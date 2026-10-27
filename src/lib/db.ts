import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoDraws } from "./demo";
import type { Draw } from "./lottery";

export class StorageError extends Error {}

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
  throw new StorageError(
    "No se pudo acceder a Supabase. Revisa la conexión y aplica la migración de la base de datos.",
  );
}
export async function getDraws(): Promise<Draw[]> {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).getDraws();
  let query = cloud()
    .from("lottery_draws")
    .select("body,views")
    .order("date", { ascending: false });
  query = query.in("status", ["published", "scheduled"]);
  const draws: Draw[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499);
    check(error);
    draws.push(...(data || []).map((row) => ({ ...(row.body as Draw), views: Number(row.views || 0) })));
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
    .select("body,views")
    .eq("id", id)
    .in("status", ["published", "scheduled"])
    .maybeSingle();
  check(error);
  return (
    (data ? { ...(data.body as Draw), views: Number(data.views || 0) } : undefined) ||
    (process.env.DEMO_DATA === "true"
      ? demoDraws().find((draw) => draw.id === id)
      : undefined)
  );
}
export async function recordDrawView(id: string, visitorHash: string): Promise<number | null> {
  if (storageProvider() === "sqlite")
    return (await import("./db-local")).recordDrawView(id, visitorHash);
  const { data, error } = await cloud().rpc("lottery_record_draw_view", {
    draw_id_input: id,
    visitor_hash_input: visitorHash,
  });
  check(error);
  return data === null ? null : Number(data);
}
