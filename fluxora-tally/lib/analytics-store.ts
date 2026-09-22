import "server-only";

import { getRuntimeConfig } from "./config";
import type { DailyCommissionPoint, DashboardState } from "./types";

const TABLE = "fluxora_tally_daily";
const DAYS = 30;

function apiHeaders(extra?: HeadersInit): HeadersInit {
  const { supabaseSecretKey } = getRuntimeConfig();
  if (!supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return { apikey: supabaseSecretKey, ...extra };
}

function endpoint(query = "") {
  return `${getRuntimeConfig().supabaseUrl}/rest/v1/${TABLE}${query}`;
}

function manilaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

export function manilaDateKey(date = new Date()) {
  const { year, month, day } = manilaParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDateKeys(days = DAYS) {
  const { year, month, day } = manilaParts(new Date());
  const anchor = Date.UTC(year, month - 1, day);
  return Array.from({ length: days }, (_, index) => {
    const value = new Date(anchor - (days - 1 - index) * 86_400_000);
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  });
}

function numeric(value: string | undefined) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function snapshotDailyCommission(dashboard: DashboardState) {
  if (!dashboard.fields.some((field) => field.id === "commission_today")) return;

  const commission = dashboard.accounts.reduce(
    (total, account) => total + numeric(account.values.commission_today),
    0,
  );
  const date = manilaDateKey();

  const response = await fetch(endpoint("?on_conflict=date"), {
    method: "POST",
    headers: apiHeaders({
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify([{ date, commission, updated_at: new Date().toISOString() }]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Analytics snapshot failed (${response.status}).`);
}

export async function readDailyCommission(days = DAYS): Promise<DailyCommissionPoint[]> {
  const dates = lastDateKeys(days);
  const response = await fetch(
    endpoint(`?date=gte.${dates[0]}&date=lte.${dates[dates.length - 1]}&select=date,commission&order=date.asc`),
    { headers: apiHeaders(), cache: "no-store" },
  );

  if (!response.ok) throw new Error(`Analytics read failed (${response.status}).`);

  const rows = (await response.json()) as Array<{ date?: string; commission?: number | string }>;
  const values = new Map(
    rows
      .filter((row) => typeof row.date === "string")
      .map((row) => [row.date as string, Number(row.commission ?? 0)]),
  );

  return dates.map((date) => ({
    date,
    commission: values.has(date) && Number.isFinite(values.get(date)) ? values.get(date)! : null,
  }));
}
