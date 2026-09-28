import { NextResponse } from "next/server";
import {
  configured,
  COOKIE,
  cookieOptions,
  newSession,
  sameOrigin,
  sameSecret,
} from "@/lib/auth";
import { consumeAttempt, StorageError } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  if (!configured())
    return NextResponse.json(
      { error: "Configura ADMIN_PASSWORD y SESSION_SECRET en el servidor." },
      { status: 503 },
    );
  // Global account budget cannot be bypassed by spoofing X-Forwarded-For.
  try {
    if (!(await consumeAttempt("admin-login", 15, 15 * 60 * 1000)))
      return NextResponse.json(
        { error: "Demasiados intentos. Vuelve a intentar en 15 minutos." },
        { status: 429 },
      );
    const { password } = await request.json();
    if (
      typeof password !== "string" ||
      password.length > 256 ||
      !sameSecret(password, process.env.ADMIN_PASSWORD!)
    )
      return NextResponse.json(
        { error: "La contraseña no es correcta." },
        { status: 401 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, await newSession(), cookieOptions());
    return response;
  } catch (error) {
    if (error instanceof StorageError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
