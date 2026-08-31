import { NextResponse } from "next/server";
import { isDashboardState, readDashboard, writeDashboard } from "../../../lib/dashboard-store";
import { hasSession } from "../../../lib/session";
export const dynamic = "force-dynamic";
const unauthorized = () => NextResponse.json({ error: "Sign in required." }, { status: 401 });
export async function GET() {
  if (!(await hasSession())) return unauthorized();
  try { return NextResponse.json({ dashboard: await readDashboard() }); }
  catch (error) { console.error("dashboard_get_failed", error); return NextResponse.json({ error: "Could not load the dashboard." }, { status: 500 }); }
}
export async function PUT(request: Request) {
  if (!(await hasSession())) return unauthorized();
  if (Number(request.headers.get("content-length") || 0) > 4_000_000) return NextResponse.json({ error: "Dashboard payload is too large." }, { status: 413 });
  try {
    const body = (await request.json()) as { dashboard?: unknown };
    if (!isDashboardState(body.dashboard)) return NextResponse.json({ error: "Dashboard data is invalid." }, { status: 400 });
    return NextResponse.json({ dashboard: await writeDashboard(body.dashboard) });
  } catch (error) { console.error("dashboard_update_failed", error); return NextResponse.json({ error: "Your changes could not be saved." }, { status: 500 }); }
}
