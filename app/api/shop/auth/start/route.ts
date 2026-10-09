import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const SHOP_PREVIEW_ORIGIN = "https://fluxora-git-feature-warzone-shop-catalog-d54ba5-meimei-digitals.vercel.app";
import { sandboxConfigured, SHOP_STATE_COOKIE } from "../../../../lib/shop-demo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!sandboxConfigured()) return new Response("Unavailable", { status: 503 });
  // Always set the state cookie on the stable preview alias. A cookie stored on
  // an immutable deployment hostname cannot be recovered on the alias.
  if (request.nextUrl.origin !== SHOP_PREVIEW_ORIGIN) {
    return NextResponse.redirect(SHOP_PREVIEW_ORIGIN + "/api/shop/auth/start", 303);
  }
  const state = randomBytes(32).toString("hex");
  const returnTo = "/prompts/shop-demo-relay?state=" + state;
  const loginUrl = "https://www.fluxora.wiki/prompts/member-login?returnTo=" + encodeURIComponent(returnTo) + "&auto=1";
  const response = NextResponse.redirect(loginUrl, 303);
  response.cookies.set(SHOP_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}