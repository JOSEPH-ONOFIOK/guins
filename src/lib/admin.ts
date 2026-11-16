import { timingSafeEqual } from "node:crypto";

// True when the key matches ADMIN_KEY. Constant-time, so the key can't be guessed
// a character at a time. Off entirely when ADMIN_KEY isn't set.
export function isAdmin(key: unknown) {
  const real = process.env.ADMIN_KEY;
  if (!real || typeof key !== "string") return false;
  const a = Buffer.from(key), b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}
