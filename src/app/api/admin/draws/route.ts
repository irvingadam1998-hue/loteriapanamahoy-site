import { NextResponse } from "next/server";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { getDraws, saveDraw, StorageError } from "@/lib/db";
import { drawSchema } from "@/lib/lottery";
export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    return NextResponse.json(await getDraws(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof StorageError
            ? error.message
            : "No se pudo consultar la base de datos.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return NextResponse.json(
      { error: "Sesión no válida. Inicia sesión de nuevo." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return NextResponse.json(
        { error: "Formulario demasiado grande." },
        { status: 413 },
      );
    const parsed = drawSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(". ") },
        { status: 400 },
      );
    const draw = await saveDraw(parsed.data);
    return NextResponse.json({ draw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error:
          error instanceof StorageError
            ? error.message
            : message.includes("UNIQUE")
              ? "Ya existe ese número de sorteo para esta modalidad."
              : "No se pudo guardar el sorteo. Revisa los datos e inténtalo de nuevo.",
      },
      { status: error instanceof StorageError ? 503 : 400 },
    );
  }
}
