import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordDrawView } from "@/lib/db";

const COOKIE = "lph_visitor";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });

  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    return NextResponse.json({ error: "Sorteo inválido." }, { status: 400 });

  const existing = request.cookies.get(COOKIE)?.value;
  const visitorId = existing && UUID.test(existing) ? existing : randomUUID();
  const visitorHash = createHash("sha256").update(`${id}:${visitorId}`).digest("hex");

  try {
    const views = await recordDrawView(id, visitorHash);
    if (views === null) return NextResponse.json({ error: "Sorteo no encontrado." }, { status: 404 });
    const response = NextResponse.json({ views }, { headers: { "Cache-Control": "private, no-store" } });
    if (visitorId !== existing) response.cookies.set(COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudieron registrar las vistas." }, { status: 503 });
  }
}
