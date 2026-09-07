import { NextResponse } from "next/server";
import { verifyHomepageUploadToken } from "../../../lib/homepage-media-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: unknown };
    if (typeof body.token !== "string" || body.token.length > 4096) throw new Error("Invalid upload token.");
    const claims = await verifyHomepageUploadToken(body.token, process.env.HOMEPAGE_MEDIA_SECRET || "");
    return NextResponse.json({ claims });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload authorization is invalid." }, { status: 401 });
  }
}
