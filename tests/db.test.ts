import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "libsql";
import { demoDraws } from "../src/lib/demo";
import {
  getDraws,
  getDraw,
  saveDraw,
  consumeAttempt,
  createSession,
  hasSession,
  removeSession,
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

test("opens existing SQLite results and persists edits through the replacement driver", async () => {
  assert.deepEqual(await getDraw(original.id), original);
  const edited = await saveDraw({ ...original, first: "0012" });
  assert.equal((await getDraw(original.id))?.first, "0012");
  assert.equal(edited.createdAt, original.createdAt);
  const secondConnection = new Database(filename);
  try {
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
});

test("preserves private drafts and prevents duplicate sorteo numbers", async () => {
  const draft = await saveDraw({
    ...original,
    id: undefined,
    number: "PRIVATE-01",
    status: "draft",
  });
  assert.equal(await getDraw(draft.id), undefined);
  assert.ok((await getDraws(true)).some((draw) => draw.id === draft.id));
  await assert.rejects(
    () => saveDraw({ ...original, id: undefined }),
    /UNIQUE/,
  );
});

test("session persistence and login attempt limits work without node:sqlite", async () => {
  await createSession("active-test-session", Date.now() + 60000);
  assert.equal(await hasSession("active-test-session"), true);
  await removeSession("active-test-session");
  assert.equal(await hasSession("active-test-session"), false);
  await createSession("expired-test-session", Date.now() - 1000);
  assert.equal(await hasSession("expired-test-session"), false);
  assert.equal(await consumeAttempt("test-login", 2, 60000), true);
  assert.equal(await consumeAttempt("test-login", 2, 60000), true);
  assert.equal(await consumeAttempt("test-login", 2, 60000), false);
});
