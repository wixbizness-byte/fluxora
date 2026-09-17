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

  const session = `qa-rate-${Date.now()}`;
  const statuses: number[] = [];
  const sources: string[] = [];

  for (let index = 0; index < 4; index += 1) {
    const response = await fetch(`https://${host}/api/start/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `fluxora_start_session=${session}`,
      },
      body: JSON.stringify({
        answers: {
          goal: "affiliate",
          niche: "product",
          platform: "tiktok",
          level: "some",
          blocker: "speed",
          help: "gpt",
          context: "",
        },
      }),
      cache: "no-store",
    });

    statuses.push(response.status);
    try {
      const body = await response.json();
      sources.push(typeof body?.source === "string" ? body.source : body?.error || "unknown");
    } catch {
      sources.push("unparseable");
    }
  }

  const passed =
    statuses.length === 4 &&
    statuses[0] === 200 &&
    statuses[1] === 200 &&
    statuses[2] === 200 &&
    statuses[3] === 429;

  return NextResponse.json({
    ok: passed,
    env: {
      deepseekKeyPresent: Boolean(process.env.DEEPSEEK_API_KEY),
      deepseekModel: process.env.DEEPSEEK_MODEL || "(default)",
      rateLimitSecretPresent: Boolean(process.env.START_RATE_LIMIT_SECRET),
    },
    rateLimit: {
      expected: [200, 200, 200, 429],
      statuses,
      sources,
    },
  });
}
