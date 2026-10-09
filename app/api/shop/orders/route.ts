import { NextRequest, NextResponse } from "next/server";
import { getOrdersForBuyer, publicDemoOrder } from "../../../lib/shop-demo-orders";
import { sandboxConfigured, verifiedMember } from "../../../lib/shop-demo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!sandboxConfigured()) {
    return NextResponse.json({ error: "Sandbox is not configured" }, { status: 503 });
  }

  const member = await verifiedMember(request);
  if (!member) {
    return NextResponse.json({ error: "Sign in to view your demo orders." },
      { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const orders = await getOrdersForBuyer(member.email);
    return NextResponse.json({ orders: orders.map(publicDemoOrder) },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Order history is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
