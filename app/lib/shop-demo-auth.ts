import { createHash } from "node:crypto";
import "server-only";
import type { NextRequest } from "next/server";

export const DEMO_AMOUNT_CENTAVOS = 10000;
export const SHOP_SESSION_COOKIE = "__Host-fluxora-shop-demo-session";
export const SHOP_STATE_COOKIE = "__Host-fluxora-shop-demo-login-state";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sandboxConfigured() {
  return process.env.VERCEL_ENV !== "production" &&
    process.env.SHOP_SANDBOX_ENABLED === "true" &&
    Boolean(process.env.PAYMONGO_TEST_SECRET_KEY?.startsWith("sk_test_")) &&
    Boolean(process.env.PAYMONGO_TEST_WEBHOOK_SECRET) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function testerAllowed(role: string, email: string) {
  return role === "admin" ||
    (process.env.SHOP_TEST_ALLOWED_EMAILS || "").split(",")
      .some((entry) => entry.trim().toLowerCase() === email.toLowerCase());
}

type ShopSession = { buyer_email: string; role: string; expires_at: string };

export async function verifiedMember(request: NextRequest) {
  if (!sandboxConfigured()) return null;
  const token = request.cookies.get(SHOP_SESSION_COOKIE)?.value || "";
  if (!/^[a-f0-9]{64}$/.test(token)) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(new RegExp("/+$"), "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;

  try {
    const path = "/rest/v1/shop_demo_login_sessions?select=buyer_email,role,expires_at&token_hash=eq." +
      sha256(token) + "&expires_at=gt." + encodeURIComponent(new Date().toISOString()) + "&limit=1";
    const response = await fetch(base + path, {
      headers: { apikey: key, Authorization: "Bearer " + key },
      cache: "no-store", signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const rows: ShopSession[] = await response.json();
    const session = rows[0];
    if (!session || !["admin", "member", "free"].includes(session.role)) return null;
    const email = String(session.buyer_email || "").trim().toLowerCase();
    if (email.length > 320 || email.includes(" ") || email.indexOf("@") < 1 ||
        email.lastIndexOf(".") < email.indexOf("@") + 2) return null;
    return { email, role: session.role };
  } catch {
    return null;
  }
}
