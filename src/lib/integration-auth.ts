import "server-only";
import { timingSafeEqual } from "node:crypto";

export function isUnifiedAdminIntegration(request: Request) {
  const expected = process.env.UNIFIED_ADMIN_SECRET;
  if (!expected || expected.length < 32) return false;
  const supplied = request.headers.get("x-unified-admin-secret") || "";
  const first = Buffer.from(expected);
  const second = Buffer.from(supplied);
  return first.length === second.length && timingSafeEqual(first, second);
}
