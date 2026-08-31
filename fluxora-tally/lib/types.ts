export type FieldFormat = "currency" | "number";
export type TallyField = { id: string; label: string; format: FieldFormat; showInSummary: boolean };
export type TallyStatus = { id: string; label: string; color: string };
export type TallyAccount = { id: string; name: string; url: string; statusId: string; values: Record<string, string> };
export type TallySettings = { siteTitle: string; subtitle: string; currencySymbol: string; decimalPlaces: 0 | 2; accentColor: string; backgroundColor: string; cardColor: string; textColor: string; logoUrl: string };
export type SortMode = "manual" | "name-asc" | "name-desc" | `field:${string}:asc` | `field:${string}:desc`;
export type DashboardState = { settings: TallySettings; fields: TallyField[]; statuses: TallyStatus[]; accounts: TallyAccount[]; sortMode: SortMode };
