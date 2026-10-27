import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(path.join(root, ".env.local"), "utf8");
const raw = env.match(/^SUPABASE_DB_URL=(.*)$/m)?.[1]?.trim() || "";
const databaseUrl = raw.replace(/^['"]|['"]$/g, "");
if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  throw new Error("SUPABASE_DB_URL debe ser la Connection string URI de Supabase (postgresql://...), no la URL https:// de su API.");
}
const connection = new URL(databaseUrl);
const connectionEnv = {
  PGHOST: connection.hostname,
  PGPORT: connection.port || "5432",
  PGUSER: decodeURIComponent(connection.username),
  PGPASSWORD: decodeURIComponent(connection.password),
  PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
  PGSSLMODE: connection.searchParams.get("sslmode") || "require",
};

const migrations = [
  "202610260001_draw_views.sql",
  "202610260002_remove_embedded_admin.sql",
];
const args = ["-X", "-v", "ON_ERROR_STOP=1", ...migrations.flatMap((name) => ["-f", path.join(root, "supabase", "migrations", name)])];
const result = spawnSync("psql", args, {
  cwd: root,
  env: { ...process.env, ...connectionEnv },
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
