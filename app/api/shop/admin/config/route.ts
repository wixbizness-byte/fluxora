import { NextRequest, NextResponse } from "next/server";
import { requireSiteAdmin } from "../../../../lib/homepage-media-auth";
import { shopDb } from "../../../../lib/shop-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorized(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  await requireSiteAdmin(token,{
    url:process.env.NEXT_PUBLIC_SUPABASE_URL||"",
    key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"",
  });
}

const noStore = (body: Record<string,unknown>, status=200) =>
  NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});

export async function GET(request: NextRequest) {
  try {
    await authorized(request);
    const id=request.nextUrl.searchParams.get("product_id")||"";
    if (!UUID.test(id)) return noStore({error:"Invalid product."},400);
    const rows=await shopDb<{delivery_instructions:string}>(
      "shop_private_products","?select=delivery_instructions&product_id=eq."+encodeURIComponent(id)+"&limit=1");
    return noStore({instructions:rows[0]?.delivery_instructions||""});
  } catch {
    return noStore({error:"Admin configuration unavailable."},403);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await authorized(request);
    const data: unknown=await request.json();
    if (!data || typeof data!=="object") return noStore({error:"Invalid request."},400);
    const {product_id,instructions} = data as {product_id:unknown;instructions:unknown};
    if (typeof product_id!=="string" || !UUID.test(product_id) ||
        typeof instructions!=="string" || instructions.length>10000) {
      return noStore({error:"Invalid instructions."},400);
    }
    const rows=await shopDb<{delivery_instructions:string}>(
      "shop_private_products","?product_id=eq."+encodeURIComponent(product_id),
      "PATCH",{delivery_instructions:instructions,updated_at:new Date().toISOString()});
    if(!rows[0]) return noStore({error:"Private product mapping unavailable."},404);
    return noStore({instructions:rows[0].delivery_instructions});
  } catch {
    return noStore({error:"Unable to save instructions."},403);
  }
}
