import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "libsql";
import { NextRequest } from "next/server";
import { demoDraws } from "../src/lib/demo";
import { POST as recordViewRequest } from "../src/app/api/draws/[id]/views/route";
import {
  getDraws,
  getDraw,
  recordDrawView,
} from "../src/lib/db";

const directory = mkdtempSync(path.join(tmpdir(), "suerte-db-regression-"));
const filename = path.join(directory, "existing.sqlite");
const oldPath = process.env.DATABASE_PATH;
const oldDemo = process.env.DEMO_DATA;
const oldProvider = process.env.DATABASE_PROVIDER;
process.env.DATABASE_PATH = filename;
process.env.DEMO_DATA = "false";
process.env.DATABASE_PROVIDER = "sqlite";

// Existing on-disk schema, as created by the previous SQLite driver.
const existing = new Database(filename);
existing.exec(
  "CREATE TABLE draws (id TEXT PRIMARY KEY, kind TEXT NOT NULL, date TEXT NOT NULL, number TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL, UNIQUE(kind, number))",
);
const original = { ...demoDraws()[0], id: "existing-result", isDemo: false };
existing
  .prepare("INSERT INTO draws VALUES (?, ?, ?, ?, ?, ?)")
  .run(
    original.id,
    original.kind,
    original.date,
    original.number,
    original.status,
    JSON.stringify(original),
  );
existing.close();

after(() => {
  const cache = globalThis as unknown as {
    suerteLibsqlDb?: InstanceType<typeof Database>;
  };
  cache.suerteLibsqlDb?.close();
  delete cache.suerteLibsqlDb;
  if (oldPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = oldPath;
  if (oldDemo === undefined) delete process.env.DEMO_DATA;
  else process.env.DEMO_DATA = oldDemo;
  if (oldProvider === undefined) delete process.env.DATABASE_PROVIDER;
  else process.env.DATABASE_PROVIDER = oldProvider;
  rmSync(directory, { recursive: true, force: true });
});

test("opens existing SQLite results and reads external edits", async () => {
  assert.deepEqual(await getDraw(original.id), { ...original, views: 0 });
  const secondConnection = new Database(filename);
  try {
    secondConnection.prepare("UPDATE draws SET body=? WHERE id=?").run(JSON.stringify({ ...original, first: "0012" }), original.id);
    const row = secondConnection
      .prepare("SELECT body FROM draws WHERE id=?")
      .get(original.id) as { body: string };
    assert.equal(JSON.parse(row.body).first, "0012");
    const integrity = secondConnection
      .prepare("PRAGMA integrity_check")
      .get() as {
      integrity_check: string;
    };
    assert.equal(integrity.integrity_check, "ok");
  } finally {
    secondConnection.close();
  }
  assert.equal((await getDraw(original.id))?.first, "0012");
});

test("keeps drafts out of public results", async () => {
  const draft = { ...original, id: "private-draft", number: "PRIVATE-01", status: "draft" as const };
  const connection = new Database(filename);
  connection.prepare("INSERT INTO draws(id,kind,date,number,status,body) VALUES(?,?,?,?,?,?)").run(draft.id, draft.kind, draft.date, draft.number, draft.status, JSON.stringify(draft));
  connection.close();
  assert.equal(await getDraw(draft.id), undefined);
  assert.ok(!(await getDraws()).some((draw) => draw.id === draft.id));
});

test("counts each anonymous browser once per published draw and keeps the count after edits", async () => {
  const first = "a".repeat(64);
  const second = "b".repeat(64);
  assert.equal(await recordDrawView(original.id, first), 1);
  assert.equal(await recordDrawView(original.id, first), 1);
  assert.equal(await recordDrawView(original.id, second), 2);
  assert.equal((await getDraw(original.id))?.views, 2);
  const connection = new Database(filename);
  connection.prepare("UPDATE draws SET body=? WHERE id=?").run(JSON.stringify({ ...original, first: "0033" }), original.id);
  connection.close();
  assert.equal((await getDraw(original.id))?.views, 2);
  assert.equal(await recordDrawView("missing-draw", first), null);
  assert.equal(await recordDrawView("private-draft", first), null);
  const scheduled = { ...original, id: "scheduled-draw", number: "SCHED-01", status: "scheduled" as const };
  const scheduledConnection = new Database(filename);
  scheduledConnection.prepare("INSERT INTO draws(id,kind,date,number,status,body) VALUES(?,?,?,?,?,?)").run(scheduled.id, scheduled.kind, scheduled.date, scheduled.number, scheduled.status, JSON.stringify(scheduled));
  scheduledConnection.close();
  assert.equal(await recordDrawView(scheduled.id, first), 1);
});

test("view endpoint issues an anonymous cookie and ignores repeat visits", async () => {
  const url = `http://localhost:3015/api/draws/${original.id}/views`;
  const context = { params: Promise.resolve({ id: original.id }) };
  const first = await recordViewRequest(new NextRequest(url, { method: "POST", headers: { origin: "http://localhost:3015" } }), context);
  assert.equal(first.status, 200);
  const cookie = first.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("lph_visitor="));
  const firstCount = (await first.json()).views;
  const repeat = await recordViewRequest(new NextRequest(url, { method: "POST", headers: { origin: "http://localhost:3015", cookie } }), context);
  assert.equal((await repeat.json()).views, firstCount);
  const crossOrigin = await recordViewRequest(new NextRequest(url, { method: "POST", headers: { origin: "https://otro.example" } }), context);
  assert.equal(crossOrigin.status, 403);
});
