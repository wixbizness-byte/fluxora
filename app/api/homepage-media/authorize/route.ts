import { NextResponse } from "next/server";
import { authorizeHomepageUpload, requireSiteAdmin } from "../../../lib/homepage-media-auth";

const UPLOAD_URL = "https://fluxora-prompt-gallery-media.ppopsoda3.workers.dev/homepage-upload";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const accessToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    await requireSiteAdmin(accessToken, {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    });
    const grant = await authorizeHomepageUpload(await request.json(), process.env.HOMEPAGE_MEDIA_SECRET || "");
    return NextResponse.json({ token: grant.token, uploadUrl: UPLOAD_URL, objectKey: grant.claims.objectKey, expiresAt: grant.claims.exp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload authorization failed.";
    const status = /Unauthorized|site admin/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
