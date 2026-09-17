import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse("Not found", { status: 404 });
  }

  const host = process.env.VERCEL_URL;
  if (!host) {
    return NextResponse.json({ ok: false, error: "VERCEL_URL unavailable" }, { status: 500 });
  }

  const response = await fetch(`https://${host}/api/start/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: {
        goal: "affiliate",
        niche: "product",
        platform: "tiktok",
        level: "some",
        blocker: "speed",
        help: "gpt",
        context: "QA check: I promote TikTok Shop products and want three short videos per day with less prompting. Unique QA run.",
      },
    }),
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return NextResponse.json({
    ok: response.ok,
    analyzerStatus: response.status,
    env: {
      deepseekKeyPresent: Boolean(process.env.DEEPSEEK_API_KEY),
      deepseekModel: process.env.DEEPSEEK_MODEL || "(default)",
      rateLimitSecretPresent: Boolean(process.env.START_RATE_LIMIT_SECRET),
    },
    body,
  });
}
