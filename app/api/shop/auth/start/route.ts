import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sandboxConfigured, SHOP_STATE_COOKIE } from "../../../../lib/shop-demo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!sandboxConfigured()) return new Response("Unavailable", { status: 503 });
  const state = randomBytes(32).toString("hex");
  const returnTo = "/prompts/shop-demo-relay?state=" + state;
  const loginUrl = "https://fluxora.wiki/prompts/member-login?returnTo=" + encodeURIComponent(returnTo) + "&auto=1";
  const response = NextResponse.redirect(loginUrl, 303);
  response.cookies.set(SHOP_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}