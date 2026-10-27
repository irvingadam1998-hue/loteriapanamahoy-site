import Database from "libsql";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { demoDraws } from "./demo";
import type { Draw } from "./lottery";

// This driver opens the existing SQLite file without requiring node:sqlite.
// Use a separate cache key so hot reload cannot reuse the previous driver.
const globalDb = globalThis as unknown as {
  suerteLibsqlDb?: InstanceType<typeof Database>;
};
function db() {
  if (globalDb.suerteLibsqlDb) return globalDb.suerteLibsqlDb;
  const filename = path.resolve(
    /* turbopackIgnore: true */ process.env.DATABASE_PATH ||
      "./data/suerte.sqlite",
  );
  mkdirSync(path.dirname(filename), { recursive: true });
  const connection = new Database(filename);
  connection.exec(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS draws (id TEXT PRIMARY KEY, kind TEXT NOT NULL, date TEXT NOT NULL, number TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL, UNIQUE(kind, number));
    CREATE TABLE IF NOT EXISTS draw_visitors (draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE, visitor_hash TEXT NOT NULL, PRIMARY KEY(draw_id, visitor_hash));
    CREATE INDEX IF NOT EXISTS draws_date ON draws(date DESC);`);
  const columns = connection.prepare("PRAGMA table_info(draws)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "views"))
    connection.exec("ALTER TABLE draws ADD COLUMN views INTEGER NOT NULL DEFAULT 0");
  globalDb.suerteLibsqlDb = connection;
  return connection;
}
export function getDraws(): Draw[] {
  const rows = db()
    .prepare("SELECT body, views FROM draws WHERE status IN ('published', 'scheduled') ORDER BY date DESC")
    .all() as { body: string; views: number }[];
  const real = rows.map((r) => ({ ...(JSON.parse(r.body) as Draw), views: r.views }));
  // Demo data is virtual, so disabling it removes it from every public/API view.
  const demo = process.env.DEMO_DATA === "true" ? demoDraws() : [];
  return [...real, ...demo].sort((a, b) => b.date.localeCompare(a.date));
}
export function getDraw(id: string) {
  return getDraws().find((draw) => draw.id === id);
}
export function recordDrawView(id: string, visitorHash: string): number | null {
  const connection = db();
  const draw = connection.prepare("SELECT status FROM draws WHERE id=?").get(id) as {status: string} | undefined;
  if (!draw || !["published", "scheduled"].includes(draw.status)) return null;
  const insert = connection.prepare("INSERT OR IGNORE INTO draw_visitors(draw_id,visitor_hash) VALUES(?,?)").run(id, visitorHash);
  if (insert.changes) connection.prepare("UPDATE draws SET views=views+1 WHERE id=?").run(id);
  const result = connection.prepare("SELECT views FROM draws WHERE id=?").get(id) as {views: number};
  return result.views;
}
