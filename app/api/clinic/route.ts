import { cookies } from "next/headers";
import { clinicConfig } from "@/clinic.config";

async function db() { const { env } = await import("cloudflare:workers"); return env.DB; }
const TOKEN = process.env.DOCTOR_SESSION_TOKEN || "medicare-local-doctor-session";
async function isDoctor() { const jar = await cookies(); return jar.get("medicare_doctor_session")?.value === TOKEN; }

async function ensureTables() {
  const d = await db();
  await d.batch([
    d.prepare("CREATE TABLE IF NOT EXISTS doctors (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,name text NOT NULL,specialty text NOT NULL,phone text DEFAULT '' NOT NULL,experience integer DEFAULT 0 NOT NULL,status text DEFAULT 'متاح' NOT NULL,created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
    d.prepare("CREATE TABLE IF NOT EXISTS patients (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,code text NOT NULL UNIQUE,name text NOT NULL,birth_date text NOT NULL,gender text NOT NULL,phone text NOT NULL,email text DEFAULT '' NOT NULL,blood_type text DEFAULT 'غير محدد' NOT NULL,allergies text DEFAULT 'لا يوجد' NOT NULL,chronic_conditions text DEFAULT 'لا يوجد' NOT NULL,notes text DEFAULT '' NOT NULL,created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
    d.prepare("CREATE TABLE IF NOT EXISTS appointments (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,patient_id integer NOT NULL,doctor_id integer NOT NULL,appointment_date text NOT NULL,appointment_time text NOT NULL,reason text DEFAULT 'فحص عام' NOT NULL,status text DEFAULT 'محجوز' NOT NULL,fee real DEFAULT 0 NOT NULL,created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
    d.prepare("CREATE TABLE IF NOT EXISTS availability (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,weekday integer NOT NULL UNIQUE,start_time text NOT NULL,end_time text NOT NULL,slot_minutes integer DEFAULT 30 NOT NULL,active integer DEFAULT true NOT NULL)"),
  ]);
}

async function seed() {
  await ensureTables();
  const d = await db();
  const doctor = await d.prepare("SELECT id FROM doctors ORDER BY id LIMIT 1").first();
  if (!doctor) await d.prepare("INSERT INTO doctors (name,specialty,phone,experience,status) VALUES (?,?,?,?,?)").bind(clinicConfig.doctorName,clinicConfig.specialty,clinicConfig.phone,0,"متاح").run();
  else await d.prepare("UPDATE doctors SET name=?,specialty=?,phone=? WHERE id=?").bind(clinicConfig.doctorName,clinicConfig.specialty,clinicConfig.phone,(doctor as any).id).run();
  const count = await d.prepare("SELECT COUNT(*) count FROM availability").first<{count:number}>();
  if (!count?.count) await d.batch([
    d.prepare("INSERT INTO availability (weekday,start_time,end_time,slot_minutes,active) VALUES (?,?,?,?,1)").bind(6,"09:00","14:00",30),
    d.prepare("INSERT INTO availability (weekday,start_time,end_time,slot_minutes,active) VALUES (?,?,?,?,1)").bind(1,"09:00","14:00",30),
    d.prepare("INSERT INTO availability (weekday,start_time,end_time,slot_minutes,active) VALUES (?,?,?,?,1)").bind(3,"09:00","14:00",30),
  ]);
}

export async function DELETE(request:Request){
  try{
    if(!await isDoctor()) return Response.json({error:"غير مصرح"},{status:401});
    await ensureTables();
    const id=Number(new URL(request.url).searchParams.get("id"));
    if(!Number.isInteger(id)||id<=0) return Response.json({error:"رقم الحجز غير صحيح"},{status:400});
    const d=await db();
    const existing=await d.prepare("SELECT id FROM appointments WHERE id=?").bind(id).first();
    if(!existing) return Response.json({error:"الحجز غير موجود"},{status:404});
    await d.prepare("DELETE FROM appointments WHERE id=?").bind(id).run();
    return Response.json({ok:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"تعذر حذف الحجز"},{status:500})}
}

export async function GET(request:Request) {
  try {
    await seed(); const d=await db(); const url=new URL(request.url); const publicView=url.searchParams.get("public")==="1";
    if(publicView){
      const doctor=await d.prepare("SELECT id,name,specialty FROM doctors ORDER BY id LIMIT 1").first();
      const availability=await d.prepare("SELECT weekday,start_time,end_time,slot_minutes FROM availability WHERE active=1 ORDER BY weekday").all();
      const occupied=await d.prepare("SELECT appointment_date,appointment_time FROM appointments WHERE doctor_id=? AND appointment_date>=date('now') AND status!='ملغي'").bind((doctor as any)?.id).all();
      return Response.json({doctor,availability:availability.results,occupied:occupied.results});
    }
    if(!await isDoctor()) return Response.json({error:"غير مصرح"},{status:401});
    const doctor=await d.prepare("SELECT id,name,specialty FROM doctors ORDER BY id LIMIT 1").first<any>();
    const appointments=await d.prepare(`SELECT a.id,a.appointment_date,a.appointment_time,a.created_at,p.name patient_name,p.phone patient_phone
      FROM appointments a JOIN patients p ON p.id=a.patient_id WHERE a.doctor_id=? AND a.appointment_date>=date('now')
      ORDER BY a.appointment_date,a.appointment_time`).bind(doctor.id).all();
    const availability=await d.prepare("SELECT id,weekday,start_time,end_time,slot_minutes,active FROM availability ORDER BY weekday").all();
    return Response.json({doctor,appointments:appointments.results,availability:availability.results});
  } catch(error){return Response.json({error:error instanceof Error?error.message:"تعذر تحميل البيانات"},{status:500})}
}

export async function POST(request:Request){
  try{
    await seed(); const d=await db(); const body=await request.json() as Record<string,any>;
    if(body.action==="book"){
      if(!body.name?.trim()||!/^0\d{8,9}$/.test(body.phone||"")||!body.date||!body.time) return Response.json({error:"يرجى إدخال الاسم ورقم هاتف صحيح واختيار الموعد"},{status:400});
      const doctor=await d.prepare("SELECT id FROM doctors ORDER BY id LIMIT 1").first<any>(); const selected=new Date(`${body.date}T12:00:00`);
      if(Number.isNaN(selected.getTime())||body.date<new Date().toISOString().slice(0,10)) return Response.json({error:"التاريخ غير صحيح"},{status:400});
      const schedule=await d.prepare("SELECT start_time,end_time,slot_minutes FROM availability WHERE weekday=? AND active=1").bind(selected.getDay()).first<any>();
      if(!schedule||body.time<schedule.start_time||body.time>=schedule.end_time) return Response.json({error:"هذا الوقت غير متاح"},{status:400});
      const conflict=await d.prepare("SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status!='ملغي'").bind(doctor.id,body.date,body.time).first();
      if(conflict) return Response.json({error:"تم حجز هذا الوقت، اختَر وقتاً آخر"},{status:409});
      let patient=await d.prepare("SELECT id FROM patients WHERE phone=? ORDER BY id DESC LIMIT 1").bind(body.phone).first<any>();
      if(!patient){const code=`P-${Date.now().toString().slice(-6)}`;patient=await d.prepare("INSERT INTO patients (code,name,birth_date,gender,phone,email,blood_type,allergies,chronic_conditions,notes) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id").bind(code,body.name.trim(),"2000-01-01","غير محدد",body.phone,"","غير محدد","غير محدد","غير محدد","بيانات أولية من الحجز الإلكتروني").first<any>()}
      else await d.prepare("UPDATE patients SET name=? WHERE id=?").bind(body.name.trim(),patient.id).run();
      await d.prepare("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status,fee) VALUES (?,?,?,?,?,?,0)").bind(patient.id,doctor.id,body.date,body.time,"حجز إلكتروني","محجوز").run();
      return Response.json({confirmation:`MC-${Date.now().toString().slice(-6)}`},{status:201});
    }
    if(body.action==="availability"){
      if(!await isDoctor()) return Response.json({error:"غير مصرح"},{status:401});
      if(!Array.isArray(body.days)||!body.days.length||!body.startTime||!body.endTime||body.startTime>=body.endTime) return Response.json({error:"أدخل أيام وأوقات دوام صحيحة"},{status:400});
      await d.prepare("DELETE FROM availability").run();
      const statements=body.days.map((day:number)=>d.prepare("INSERT INTO availability (weekday,start_time,end_time,slot_minutes,active) VALUES (?,?,?,?,1)").bind(day,body.startTime,body.endTime,Number(body.slotMinutes)||30));
      await d.batch(statements); return Response.json({ok:true});
    }
    return Response.json({error:"عملية غير مدعومة"},{status:400});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"تعذر الحفظ"},{status:500})}
}
