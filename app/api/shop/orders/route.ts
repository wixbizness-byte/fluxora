import { NextRequest, NextResponse } from "next/server";
import { findBuyerOrder, publicBuyerOrder, SHOP_BUYER_COOKIE } from "../../../lib/shop-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("order") || "";
  const token = request.cookies.get(SHOP_BUYER_COOKIE)?.value || "";
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({error:"Order session not found."},{status:401,headers:{"Cache-Control":"private, no-store"}});
  }
  try {
    const order = await findBuyerOrder(id,token);
    if (!order) return NextResponse.json({error:"Order not found."},{status:404,headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json({order:publicBuyerOrder(order)},{headers:{"Cache-Control":"private, no-store"}});
  } catch {
    return NextResponse.json({error:"Unable to retrieve order."},{status:503,headers:{"Cache-Control":"private, no-store"}});
  }
}
