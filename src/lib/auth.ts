import { cookies } from "next/headers";
import {
  createHmac,
  timingSafeEqual,
  createHash,
  randomBytes,
} from "node:crypto";
import { createSession, hasSession, removeSession } from "./db";
export const COOKIE = "suerte_admin";
export function configured() {
  return (
    !!process.env.ADMIN_PASSWORD &&
    (process.env.SESSION_SECRET?.length || 0) >= 32
  );
}
export function sameSecret(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
const signature = (id: string) =>
  createHmac("sha256", process.env.SESSION_SECRET || "")
    .update(id)
    .digest("hex");
export async function newSession() {
  const id = randomBytes(32).toString("hex");
  await createSession(id, Date.now() + 8 * 60 * 60 * 1000);
  return `${id}.${signature(id)}`;
}
export async function isAdmin() {
  if (!configured()) return false;
  const token = (await cookies()).get(COOKIE)?.value || "";
  const [id, sig] = token.split(".");
  try {
    return (
      !!id && !!sig && sameSecret(sig, signature(id)) && (await hasSession(id))
    );
  } catch {
    return false;
  }
}
export async function revokeSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await removeSession(token.split(".")[0]);
}
export const cookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.COOKIE_SECURE === "true" ||
    process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 8 * 60 * 60,
});
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(request.url).origin;
  return origin === new URL(allowed).origin;
}
