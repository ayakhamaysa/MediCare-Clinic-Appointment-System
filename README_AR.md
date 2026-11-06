# MediCare — نظام حجز مواعيد عيادة

نظام حجز لطبيب واحد: صفحة للمريض يختار فيها التاريخ والوقت، ولوحة تحكم للطبيب يحدد فيها أيام وساعات الدوام ومدة الموعد ويشوف الحجوزات.

**التقنيات:** Next.js (vinext) · React · TypeScript · Cloudflare Workers · Cloudflare D1 (SQL)

## الملفات اللي بتعدّليها

| الملف | شو فيه |
| --- | --- |
| `clinic.config.ts` | اسم العيادة، اسم الطبيب، التخصص، الهاتف |
| `.env` | إيميل وكلمة سر دخول الطبيب (سري) |
| `database.config.json` | اسم الموقع وقاعدة البيانات على Cloudflare |
| `app/page.tsx` | شكل الصفحات (الحجز، الدخول، لوحة التحكم) |
| `app/globals.css` | الألوان والتنسيق |

## التشغيل على جهازك

```
npm install
npm run dev
```

## النشر على Cloudflare (نفس الرابط الحالي)

1. اكتبي الإيميل وكلمة السر في ملف `.env`.
2. أول مرة فقط: `npx wrangler login`
3. `npm run deploy`

أمر النشر بيبني الموقع، وبيربطه بنفس قاعدة البيانات، وبيرفع بيانات الدخول كأسرار مشفّرة. الحجوزات القديمة بتضل زي ما هي.

## لعيادة جديدة

انسخي المجلد، عدّلي `clinic.config.ts` و`.env`، وأنشئي قاعدة D1 جديدة على Cloudflare وحطي اسمها ورقمها واسم موقع جديد بـ `database.config.json`، ثم `npm run deploy`.

## هيكل المشروع

```
app/
  page.tsx              صفحات الموقع
  layout.tsx            إعدادات الصفحة والعنوان
  globals.css           التنسيق
  api/clinic/           الحجوزات وأوقات الدوام
  api/doctor-auth/      تسجيل دخول الطبيب
db/schema.ts            شكل جداول قاعدة البيانات
drizzle/                ملفات إنشاء الجداول
worker/index.ts         نقطة تشغيل Cloudflare Worker
scripts/                سكربت النشر
public/favicon.svg      أيقونة الموقع
```
