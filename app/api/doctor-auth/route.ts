import { cookies } from "next/headers";

const COOKIE = "medicare_doctor_session";
// تُقرأ القيم عند كل طلب من متغيرات البيئة (.env محليًا، وأسرار Cloudflare بعد النشر)
const creds = () => ({ EMAIL: process.env.DOCTOR_EMAIL || "", PASSWORD: process.env.DOCTOR_PASSWORD || "", TOKEN: process.env.DOCTOR_SESSION_TOKEN || "" });

export async function GET() {
  const { TOKEN } = creds();
  const jar = await cookies();
  return Response.json({ authenticated: !!TOKEN && jar.get(COOKIE)?.value === TOKEN });
}

export async function POST(request: Request) {
  const { EMAIL, PASSWORD, TOKEN } = creds();
  if (!EMAIL || !PASSWORD || !TOKEN) {
    return Response.json({ error: "بيانات دخول الطبيب غير مضبوطة على الخادم (ملف .env)" }, { status: 500 });
  }
  const body = await request.json() as { email?: string; password?: string };
  if (body.email?.trim().toLowerCase() !== EMAIL.toLowerCase() || body.password !== PASSWORD) {
    return Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(COOKIE, TOKEN, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return Response.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
