import fs from "node:fs";
import { compatibilityDate, loadDatabaseConfig, run, writeWrangler } from "./config-utils.mjs";

// 1) قراءة بيانات دخول الطبيب من ملف .env
if (!fs.existsSync(".env")) {
  console.log("\n⚠️  ملف .env غير موجود. انسخي .env.example باسم .env واكتبي فيه بيانات الدخول.\n");
  process.exit(1);
}
const secrets = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
    .filter(([k]) => k.startsWith("DOCTOR_"))
);
if (!secrets.DOCTOR_EMAIL || !secrets.DOCTOR_PASSWORD || secrets.DOCTOR_PASSWORD === "CHANGE-ME" || !secrets.DOCTOR_SESSION_TOKEN) {
  console.log("\n⚠️  اكتبي DOCTOR_EMAIL و DOCTOR_PASSWORD في ملف .env ثم أعيدي npm run deploy\n");
  process.exit(1);
}

// 2) بناء الموقع وربطه بقاعدة البيانات
const config = loadDatabaseConfig();
writeWrangler(config);
console.log("\nبناء الموقع...\n");
run("npx", ["vinext", "build"]);
const outputPath = "dist/server/wrangler.json";
const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
output.name = config.workerName;
output.compatibility_date = compatibilityDate();
output.compatibility_flags = [...new Set(output.compatibility_flags ?? ["nodejs_compat"])];
output.d1_databases = [{ binding: "DB", database_name: config.databaseName, database_id: config.databaseId }];
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

// 3) النشر على Cloudflare
console.log("\nنشر الموقع...\n");
run("npx", ["wrangler", "deploy", "--config=dist/server/wrangler.json"]);

// 4) رفع بيانات الدخول كأسرار مشفّرة (لا تظهر في الكود)
fs.writeFileSync(".secrets.json", JSON.stringify(secrets));
console.log("\nرفع بيانات الدخول...\n");
try {
  run("npx", ["wrangler", "secret", "bulk", ".secrets.json", `--name=${config.workerName}`]);
} finally {
  fs.rmSync(".secrets.json", { force: true });
}
console.log("\n✅ تم النشر بنجاح\n");
