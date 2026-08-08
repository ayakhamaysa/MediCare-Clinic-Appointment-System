import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "doctor", "staff", "patient"] }).notNull().default("staff"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const doctors = sqliteTable("doctors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  phone: text("phone").notNull().default(""),
  experience: integer("experience").notNull().default(0),
  status: text("status").notNull().default("متاح"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  bloodType: text("blood_type").notNull().default("غير محدد"),
  allergies: text("allergies").notNull().default("لا يوجد"),
  chronicConditions: text("chronic_conditions").notNull().default("لا يوجد"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  reason: text("reason").notNull().default("فحص عام"),
  status: text("status").notNull().default("بانتظار التأكيد"),
  fee: real("fee").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  medicine: text("medicine").notNull(),
  dosage: text("dosage").notNull(),
  instructions: text("instructions").notNull().default(""),
  duration: text("duration").notNull().default(""),
  status: text("status").notNull().default("نشطة"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const availability = sqliteTable("availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekday: integer("weekday").notNull().unique(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  slotMinutes: integer("slot_minutes").notNull().default(30),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
