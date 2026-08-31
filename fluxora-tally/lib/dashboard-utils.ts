import type { DashboardState, TallyField } from "./types";

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
export function parseNumber(value?: string) {
  if (!value?.trim()) return null;
  const n = Number(value.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
}
export function move<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy;
}
export function safeUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}
export function formatValue(dashboard: DashboardState, value: string, field: TallyField) {
  if (!value?.trim()) return "—";
  const n = parseNumber(value); if (n === null) return value;
  const formatted = new Intl.NumberFormat("en-PH", { minimumFractionDigits: dashboard.settings.decimalPlaces, maximumFractionDigits: dashboard.settings.decimalPlaces }).format(Math.abs(n));
  if (field.format === "number") return n < 0 ? `-${formatted}` : formatted;
  return `${n < 0 ? "-" : ""}${dashboard.settings.currencySymbol}${formatted}`;
}
export function normalizeDashboard(next: DashboardState): DashboardState {
  const fields = next.fields.map((field, index) => ({ ...field, label: field.label.trim() || `Field ${index + 1}` }));
  const statuses = next.statuses.map((status, index) => ({ ...status, label: status.label.trim() || `Status ${index + 1}` }));
  const accounts = next.accounts.map((account) => ({ ...account, statusId: statuses.some((s) => s.id === account.statusId) ? account.statusId : statuses[0].id, values: Object.fromEntries(fields.map((field) => [field.id, account.values[field.id] || ""])) }));
  const sortMode = next.sortMode.startsWith("field:") && !fields.some((field) => next.sortMode.startsWith(`field:${field.id}:`)) ? "manual" : next.sortMode;
  return { ...next, fields, statuses, accounts, sortMode };
}
