import fs from "node:fs";
import { spawnSync } from "node:child_process";

export function loadDatabaseConfig() {
  const config = JSON.parse(fs.readFileSync("database.config.json", "utf8"));
  for (const key of ["workerName", "databaseName", "databaseId"]) {
    if (!config[key] || String(config[key]).includes("PASTE")) throw new Error(`عدّلي ${key} داخل database.config.json أولاً`);
  }
  return config;
}
export function compatibilityDate() { return new Date(Date.now() - 86400000).toISOString().slice(0, 10); }
export function writeWrangler(config) {
  const wrangler = { name: config.workerName, compatibility_date: compatibilityDate(), compatibility_flags: ["nodejs_compat"], d1_databases: [{ binding: "DB", database_name: config.databaseName, database_id: config.databaseId, migrations_dir: "drizzle" }] };
  fs.writeFileSync("wrangler.jsonc", JSON.stringify(wrangler, null, 2));
}
export function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status || 1);
}
