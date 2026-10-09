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
  if (!cookie) return null;
  const safeOrigin = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000";
  const portal = new URL("/prompts/api/member-portal", safeOrigin);
  const response = await fetch(portal, { headers: { Cookie: cookie }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const account = await response.json();
  const email = typeof account.email === "string" ? account.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!["admin", "member", "free"].includes(account.role)) return null;
  return { email, role: account.role as string };
}

export function testerAllowed(role: string, email: string) {
  return role === "admin" || (process.env.SHOP_TEST_ALLOWED_EMAILS || "").split(",")
    .some((entry) => entry.trim().toLowerCase() === email);
}