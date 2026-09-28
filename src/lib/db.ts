import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoDraws } from "./demo";
import type { Draw, DrawInput } from "./lottery";

export class StorageError extends Error {}
export type StorageStatus = {
  provider: "supabase" | "sqlite";
  ready: boolean;
  message: string;
};

export function storageProvider(): "supabase" | "sqlite" {
  const provider = process.env.DATABASE_PROVIDER;
  if (provider && !["sqlite", "supabase"].includes(provider))
    throw new StorageError("DATABASE_PROVIDER debe ser supabase o sqlite.");
  if (provider === "sqlite") {
    if (process.env.VERCEL)
      throw new StorageError(
        "Vercel necesita Supabase para guardar datos permanentes.",
      );
    return "sqlite";
  }
  return "supabase";
}
export function isStorageConfigured() {
  try {
    const provider = storageProvider();
    return (
      provider === "sqlite" ||
      (!!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY)
    );
  } catch {
    return false;
  }
}
let cached: { url: string; key: string; client: SupabaseClient } | undefined;
function cloud() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new StorageError(
      "Falta conectar Supabase: configura SUPABASE_URL y SUPABASE_SECRET_KEY en el servidor.",
    );
  if (!cached || cached.url !== url || cached.key !== key)
    cached = {
      url,
      key,
      client: createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              cache: "no-store",
              signal: init?.signal || AbortSignal.timeout(12000),
            }),
        },
      }),
    };
  return cached.client;
}
function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new Error("UNIQUE: Ya existe ese número de sorteo.");
  throw new StorageError(
    "No se pudo acceder a Supabase. Revisa la conexión y aplica la migración de la base de datos.",
  );
}
export async function storageStatus(): Promise<StorageStatus> {
  let provider: "supabase" | "sqlite" = "supabase";
  try {
    provider = storageProvider();
    if (provider === "supabase") {
      const { error } = await cloud()
        .from("lottery_draws")
        .select("id", { head: true, count: "exact" });
      check(error);
    } else await (await import("./db-local")).getDraws(true);
    return {
      provider,
      ready: true,
      message:
        provider === "supabase"
          ? "Supabase conectado · almacenamiento permanente en la nube"
          : "SQLite conectado · datos guardados en este equipo",
    };
  } catch (error) {
    return {
      provider,
      ready: false,
      message:
        error instanceof StorageError
          ? error.message
          : "No se pudo abrir la base de datos.",
    };
  }
}
export async function getDraws(admin = false): Promise<Draw[]> {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).getDraws(admin);
  let query = cloud()
    .from("lottery_draws")
    .select("body")
    .order("date", { ascending: false });
  if (!admin) query = query.in("status", ["published", "scheduled"]);
  const draws: Draw[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499);
    check(error);
    draws.push(...(data || []).map((row) => row.body as Draw));
    if (!data || data.length < 500) break;
  }
  if (process.env.DEMO_DATA === "true") draws.push(...demoDraws());
  return draws.sort((a, b) => b.date.localeCompare(a.date));
}
export async function getDraw(id: string): Promise<Draw | undefined> {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).getDraw(id);
  const { data, error } = await cloud()
    .from("lottery_draws")
    .select("body")
    .eq("id", id)
    .in("status", ["published", "scheduled"])
    .maybeSingle();
  check(error);
  return (
    (data?.body as Draw | undefined) ||
    (process.env.DEMO_DATA === "true"
      ? demoDraws().find((draw) => draw.id === id)
      : undefined)
  );
}
export async function saveDraw(input: DrawInput): Promise<Draw> {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).saveDraw(input);
  let existing: Draw | undefined;
  if (input.id) {
    const { data, error } = await cloud()
      .from("lottery_draws")
      .select("body")
      .eq("id", input.id)
      .maybeSingle();
    check(error);
    if (!data) throw new Error("No se encontró el sorteo para editar.");
    existing = data.body as Draw;
  }
  const now = new Date().toISOString();
  const draw: Draw = {
    ...input,
    id: input.id || randomUUID(),
    isDemo: false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const row = {
    id: draw.id,
    kind: draw.kind,
    date: draw.date,
    number: draw.number,
    status: draw.status,
    body: draw,
  };
  const query = input.id
    ? cloud().from("lottery_draws").update(row).eq("id", input.id)
    : cloud().from("lottery_draws").insert(row);
  const { data, error } = await query.select("body").single();
  check(error);
  return data!.body as Draw;
}
export async function consumeAttempt(
  key: string,
  limit: number,
  duration: number,
) {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).consumeAttempt(key, limit, duration);
  const { data, error } = await cloud().rpc("lottery_consume_attempt", {
    attempt_key: key,
    attempt_limit: limit,
    duration_ms: duration,
  });
  check(error);
  return data === true;
}
export async function createSession(id: string, expires: number) {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).createSession(id, expires);
  const cleanup = await cloud()
    .from("lottery_sessions")
    .delete()
    .lt("expires", Date.now());
  check(cleanup.error);
  const { error } = await cloud()
    .from("lottery_sessions")
    .insert({ id, expires });
  check(error);
}
export async function hasSession(id: string) {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).hasSession(id);
  const { data, error } = await cloud()
    .from("lottery_sessions")
    .select("id")
    .eq("id", id)
    .gt("expires", Date.now())
    .maybeSingle();
  check(error);
  return !!data;
}
export async function removeSession(id: string) {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).removeSession(id);
  const { error } = await cloud()
    .from("lottery_sessions")
    .delete()
    .eq("id", id);
  check(error);
}
