import { NextResponse } from "next/server";
import { isUnifiedAdminIntegration } from "@/lib/integration-auth";
import { getDraws, saveDraw, StorageError } from "@/lib/db";
import { drawSchema } from "@/lib/lottery";

export async function GET(request: Request) {
  if (!isUnifiedAdminIntegration(request))
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  try {
    return NextResponse.json({ rows: await getDraws(true) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageError ? error.message : "No se pudieron consultar los sorteos." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isUnifiedAdminIntegration(request))
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return NextResponse.json({ error: "Formulario demasiado grande." }, { status: 413 });
    const parsed = drawSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join(". ") }, { status: 400 });
    return NextResponse.json({ row: await saveDraw(parsed.data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageError ? error.message : "No se pudo guardar el sorteo." }, { status: 400 });
  }
}
