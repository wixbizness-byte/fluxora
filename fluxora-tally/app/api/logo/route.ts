import { NextResponse } from "next/server";
import { hasSession } from "../../../lib/session";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const file = (await request.formData()).get("logo");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image first." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Use a PNG, JPG, or WebP image." }, { status: 400 });
    if (file.size > MAX_LOGO_BYTES) return NextResponse.json({ error: "Logo must be 2 MB or smaller." }, { status: 413 });
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    return NextResponse.json({ logoUrl: `data:${file.type};base64,${data}` });
  } catch (error) { console.error("logo_upload_failed", error); return NextResponse.json({ error: "The logo could not be prepared." }, { status: 500 }); }
}
export async function DELETE() { if (!(await hasSession())) return NextResponse.json({ error: "Sign in required." }, { status: 401 }); return NextResponse.json({ ok: true }); }
