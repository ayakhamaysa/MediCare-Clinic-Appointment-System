import { cookies } from "next/headers";
import { clinicConfig } from "@/clinic.config";

const COOKIE = "medicare_doctor_session";
const EMAIL = process.env.DOCTOR_EMAIL || clinicConfig.loginEmail;
const PASSWORD = process.env.DOCTOR_PASSWORD || clinicConfig.loginPassword;
const TOKEN = process.env.DOCTOR_SESSION_TOKEN || "medicare-local-doctor-session";

export async function GET() {
  const jar = await cookies();
  return Response.json({ authenticated: jar.get(COOKIE)?.value === TOKEN });
}

export async function POST(request: Request) {
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
