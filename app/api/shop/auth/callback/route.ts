import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sandboxConfigured, sha256, SHOP_STATE_COOKIE, SHOP_SESSION_COOKIE } from "../../../../lib/shop-demo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bounce(status: string) {
  const response = NextResponse.redirect("/shop/demo?auth=" + status, 303);
  response.cookies.delete(SHOP_STATE_COOKIE);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  if (!sandboxConfigured()) return new Response("Unavailable", { status: 503 });
  const state = request.nextUrl.searchParams.get("state") || "";
  const ticket = request.nextUrl.searchParams.get("ticket") || "";
  const cookie = request.cookies.get(SHOP_STATE_COOKIE)?.value || "";
  if (![state, ticket, cookie].every(v => /^[a-f0-9]{64}$/.test(v))) return bounce("invalid");
  if (!timingSafeEqual(Buffer.from(state, "hex"), Buffer.from(cookie, "hex"))) return bounce("invalid");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(new RegExp("/+$"), "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return bounce("unavailable");
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  try {
    const reply = await fetch(base + "/rest/v1/rpc/shop_demo_consume_sso_ticket", {
      method: "POST", headers, cache: "no-store",
      body: JSON.stringify({ p_ticket_hash: sha256(ticket), p_state_hash: sha256(state) }),
      signal: AbortSignal.timeout(7000),
    });
    if (!reply.ok) return bounce("unavailable");
    const rows: Array<{ buyer_email: string; member_role: string }> = await reply.json();
    const claimed = rows[0];
    if (!claimed || !["admin", "member", "free"].includes(claimed.member_role)) return bounce("expired");
    if (typeof claimed.buyer_email !== "string" || claimed.buyer_email.length > 320) return bounce("invalid");
    const session = randomBytes(32).toString("hex");
    const saved = await fetch(base + "/rest/v1/shop_demo_login_sessions", {
      method: "POST", headers: { ...headers, Prefer: "return=minimal" }, cache: "no-store",
      body: JSON.stringify({
        token_hash: sha256(session), buyer_email: claimed.buyer_email, role: claimed.member_role,
        expires_at: new Date(Date.now() + 4 * 3600000).toISOString(),
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!saved.ok) return bounce("unavailable");
    const response = bounce("connected");
    response.cookies.set(SHOP_SESSION_COOKIE, session, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 4 * 3600,
    });
    return response;
  } catch { return bounce("unavailable"); }
}