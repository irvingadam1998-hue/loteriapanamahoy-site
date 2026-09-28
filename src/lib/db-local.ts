import Database from "libsql";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoDraws } from "./demo";
import type { Draw, DrawInput } from "./lottery";

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
  connection.exec(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS draws (id TEXT PRIMARY KEY, kind TEXT NOT NULL, date TEXT NOT NULL, number TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL, UNIQUE(kind, number));
    CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS draws_date ON draws(date DESC);`);
  globalDb.suerteLibsqlDb = connection;
  return connection;
}
export function getDraws(admin = false): Draw[] {
  const rows = db()
    .prepare(
      admin
        ? "SELECT body FROM draws ORDER BY date DESC"
        : "SELECT body FROM draws WHERE status IN ('published', 'scheduled') ORDER BY date DESC",
    )
    .all() as { body: string }[];
  const real = rows.map((r) => JSON.parse(r.body) as Draw);
  // Demo data is virtual, so disabling it removes it from every public/API view.
  const demo = process.env.DEMO_DATA === "true" ? demoDraws() : [];
  return [...real, ...demo].sort((a, b) => b.date.localeCompare(a.date));
}
export function getDraw(id: string) {
  return getDraws().find((draw) => draw.id === id);
}
export function saveDraw(input: DrawInput): Draw {
  const existing = input.id
    ? (db().prepare("SELECT body FROM draws WHERE id = ?").get(input.id) as
        { body: string } | undefined)
    : undefined;
  if (input.id && !existing)
    throw new Error("No se encontró el sorteo para editar.");
  const now = new Date().toISOString();
  const draw: Draw = {
    ...input,
    id: input.id || randomUUID(),
    isDemo: false,
    createdAt: existing ? JSON.parse(existing.body).createdAt : now,
    updatedAt: now,
  };
  db()
    .prepare(
      "INSERT INTO draws(id, kind, date, number, status, body) VALUES(?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, date=excluded.date, number=excluded.number, status=excluded.status, body=excluded.body",
    )
    .run(
      draw.id,
      draw.kind,
      draw.date,
      draw.number,
      draw.status,
      JSON.stringify(draw),
    );
  return draw;
}
export function consumeAttempt(key: string, limit: number, duration: number) {
  const now = Date.now();
  db().prepare("DELETE FROM attempts WHERE reset < ?").run(now);
  const row = db()
    .prepare(
      "INSERT INTO attempts(key,count,reset) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .get(key, now + duration) as { count: number };
  return row.count <= limit;
}
export function createSession(id: string, expires: number) {
  db().prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db()
    .prepare("INSERT INTO sessions(id, expires) VALUES(?, ?)")
    .run(id, expires);
}
export function hasSession(id: string) {
  return !!db()
    .prepare("SELECT id FROM sessions WHERE id=? AND expires>?")
    .get(id, Date.now());
}
export function removeSession(id: string) {
  db().prepare("DELETE FROM sessions WHERE id=?").run(id);
}
