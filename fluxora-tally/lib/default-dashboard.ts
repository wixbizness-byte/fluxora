import type { DashboardState } from "./types";

export const FLUXORA_DEFAULTS = {
  brand: "#6658E8", brandHover: "#5749D5", brandSoft: "#F0EEFF", canvas: "#FAFAF8",
  surface: "#FFFFFF", surfaceMuted: "#F5F5F2", text: "#18181B", textSecondary: "#52525B",
  textMuted: "#71717A", border: "#E4E4E7", borderStrong: "#D4D4D8", success: "#16A34A",
  warning: "#D97706", danger: "#DC2626", info: "#2563EB",
} as const;

export const DEFAULT_DASHBOARD: DashboardState = {
  settings: { siteTitle: "Fluxora Tally", subtitle: "Commission overview", currencySymbol: "₱", decimalPlaces: 0, accentColor: FLUXORA_DEFAULTS.brand, backgroundColor: FLUXORA_DEFAULTS.canvas, cardColor: FLUXORA_DEFAULTS.surface, textColor: FLUXORA_DEFAULTS.text, logoUrl: "" },
  fields: [
    { id: "commission_today", label: "Commission today", format: "currency", showInSummary: true },
    { id: "commission_month", label: "Commission this month", format: "currency", showInSummary: true },
    { id: "ad_spent", label: "Ad spent", format: "currency", showInSummary: true },
    { id: "overall_profit", label: "Overall profit", format: "currency", showInSummary: true },
  ],
  statuses: [
    { id: "active", label: "Active", color: FLUXORA_DEFAULTS.success },
    { id: "paused", label: "Paused", color: FLUXORA_DEFAULTS.warning },
    { id: "inactive", label: "Inactive", color: FLUXORA_DEFAULTS.textMuted },
  ],
  accounts: [], sortMode: "manual",
};
