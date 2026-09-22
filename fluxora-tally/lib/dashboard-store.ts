import "server-only";
import { getRuntimeConfig } from "./config";
import { DEFAULT_DASHBOARD } from "./default-dashboard";
import type { DashboardState } from "./types";
const TABLE = "fluxora_tally_state";
const ROW_ID = "main";

function apiHeaders(extra?: HeadersInit): HeadersInit {
  const { supabaseSecretKey } = getRuntimeConfig();
  if (!supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return { apikey: supabaseSecretKey, ...extra };
}
function endpoint(query = "") { return `${getRuntimeConfig().supabaseUrl}/rest/v1/${TABLE}${query}`; }
export function isDashboardState(value: unknown): value is DashboardState {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<DashboardState>;
  return Boolean(d.settings && typeof d.settings === "object" && Array.isArray(d.fields) && d.fields.length && Array.isArray(d.statuses) && d.statuses.length && Array.isArray(d.accounts) && typeof d.sortMode === "string");
}
export async function readDashboard(): Promise<DashboardState> {
  const response = await fetch(endpoint(`?id=eq.${ROW_ID}&select=data&limit=1`), { headers: apiHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase read failed (${response.status}).`);
  const rows = (await response.json()) as Array<{ data?: unknown }>;
  return isDashboardState(rows[0]?.data) ? rows[0].data : structuredClone(DEFAULT_DASHBOARD);
}
export async function writeDashboard(dashboard: DashboardState) {
  const response = await fetch(endpoint(`?id=eq.${ROW_ID}`), { method: "PATCH", headers: apiHeaders({ "content-type": "application/json", prefer: "return=representation" }), body: JSON.stringify({ data: dashboard, updated_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase update failed (${response.status}).`);
  const rows = (await response.json()) as Array<{ data?: unknown }>;
  if (!isDashboardState(rows[0]?.data)) throw new Error("Supabase returned an invalid dashboard payload.");
  return rows[0].data;
}
