import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getRuntimeConfig } from "./config";

export const SESSION_COOKIE = "fluxora_tally_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
type SessionPayload = { exp: number; scope: "tally" };
const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createSessionToken(now = Date.now()) {
  const { sessionSecret } = getRuntimeConfig();
  if (!sessionSecret) throw new Error("SESSION_SECRET is not configured.");
  const payload: SessionPayload = { exp: Math.floor(now / 1000) + SESSION_DURATION_SECONDS, scope: "tally" };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, sessionSecret)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  const { sessionSecret } = getRuntimeConfig();
  if (!sessionSecret || !token) return false;
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return false;
  const expected = Buffer.from(sign(encoded, sessionSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.scope === "tally" && Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export async function hasSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
