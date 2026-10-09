import "server-only";
import type { NextRequest } from "next/server";

export const DEMO_AMOUNT_CENTAVOS = 10000;
export function sandboxConfigured() {
  return process.env.VERCEL_ENV !== "production" && process.env.SHOP_SANDBOX_ENABLED === "true" &&
    Boolean(process.env.PAYMONGO_TEST_SECRET_KEY?.startsWith("sk_test_")) &&
    Boolean(process.env.PAYMONGO_TEST_WEBHOOK_SECRET) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function verifiedMember(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  if (!cookie || cookie.length > 12000) return null;
  try {
    const safeOrigin = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000";
    const portal = new URL("/prompts/api/member-portal", safeOrigin);
    const response = await fetch(portal, {
      headers: { Cookie: cookie, Accept: "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const account: unknown = await response.json();
    if (!account || typeof account !== "object" || Array.isArray(account)) return null;
    const user = account as Record<string, unknown>;
    const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    if (email.length > 320 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return null;
    if (!["admin", "member", "free"].includes(String(user.role))) return null;
    return { email, role: String(user.role) };
  } catch {
    return null;
  }
}

export function testerAllowed(role: string, email: string) {
  return role === "admin" || (process.env.SHOP_TEST_ALLOWED_EMAILS || "").split(",")
    .some((entry) => entry.trim().toLowerCase() === email);
}