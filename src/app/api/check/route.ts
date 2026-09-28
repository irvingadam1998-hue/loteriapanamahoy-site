import { NextResponse } from "next/server";
import { checkSchema, checkTicket } from "@/lib/lottery";
import { getDraw, StorageError } from "@/lib/db";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 4000)
      return NextResponse.json(
        { error: "Solicitud demasiado grande." },
        { status: 413 },
      );
    const input = checkSchema.safeParse(JSON.parse(raw));
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues[0].message },
        { status: 400 },
      );
    const draw = await getDraw(input.data.drawId);
    if (!draw)
      return NextResponse.json(
        { error: "Este sorteo no está disponible." },
        { status: 404 },
      );
    return NextResponse.json(checkTicket(draw, input.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.startsWith("Este ")
            ? error.message
            : "No se pudo comprobar el número. Inténtalo de nuevo.",
      },
      { status: error instanceof StorageError ? 503 : 400 },
    );
  }
}
