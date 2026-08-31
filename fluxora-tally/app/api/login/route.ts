import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRuntimeConfig, isConfigured } from "../../../lib/config";
import { createSessionToken, SESSION_COOKIE, SESSION_DURATION_SECONDS } from "../../../lib/session";
function sameSecret(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function POST(request: Request) {
  if (!isConfigured()) return NextResponse.json({ error: "Fluxora Tally is not configured yet." }, { status: 503 });
  let password = "";
  try { const body = (await request.json()) as { password?: unknown }; password = typeof body.password === "string" ? body.password : ""; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!sameSecret(password, getRuntimeConfig().sitePassword)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: SESSION_COOKIE, value: createSessionToken(), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DURATION_SECONDS });
  return response;
}
