"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import AccountCard from "../components/tally/account-card";
import AccountModal, { type AccountEditor } from "../components/tally/account-modal";
import AnalyticsPanel from "../components/tally/analytics-panel";
import ConfigModal, { type ConfigDraft } from "../components/tally/config-modal";
import { CheckIcon, LogOutIcon, PlusIcon, RefreshIcon, SearchIcon, SettingsIcon } from "../components/icons";
import { makeId, normalizeDashboard, parseNumber, move } from "../lib/dashboard-utils";
import type { DailyCommissionPoint, DashboardState, SortMode, TallyAccount } from "../lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";
type DashboardResponse = { dashboard?: DashboardState; analytics?: DailyCommissionPoint[]; error?: string };

export default function DashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [analytics, setAnalytics] = useState<DailyCommissionPoint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<AccountEditor | null>(null);
  const [config, setConfig] = useState<ConfigDraft | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, body: await response.json() as DashboardResponse }))
      .then(({ response, body }) => {
        if (!response.ok || !body.dashboard) throw new Error(body.error || "Could not load the dashboard.");
        setDashboard(body.dashboard);
        setAnalytics(body.analytics ?? []);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load the dashboard.");
      });
    return () => controller.abort();
  }, []);

  async function save(next: DashboardState) {
    const previous = dashboard;
    setDashboard(next);
    setSaveState("saving");
    setSaveError("");
    try {
      const response = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dashboard: next }),
      });
      const body = await response.json() as DashboardResponse;
      if (!response.ok || !body.dashboard) throw new Error(body.error || "Your changes could not be saved.");
      setDashboard(body.dashboard);
      setAnalytics(body.analytics ?? analytics);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (cause) {
      if (previous) setDashboard(previous);
      setSaveState("error");
      setSaveError(cause instanceof Error ? cause.message : "Your changes could not be saved.");
    }
  }

  const visibleAccounts = useMemo(() => {
    if (!dashboard) return [];
    const query = search.trim().toLowerCase();
    const filtered = dashboard.accounts.filter((account) => {
      if (!query) return true;
      const status = dashboard.statuses.find((item) => item.id === account.statusId);
      return `${account.name} ${account.url} ${status?.label || ""}`.toLowerCase().includes(query);
    });
    if (dashboard.sortMode === "manual") return filtered;
    return [...filtered].sort((a, b) => {
      if (dashboard.sortMode === "name-asc") return a.name.localeCompare(b.name);
      if (dashboard.sortMode === "name-desc") return b.name.localeCompare(a.name);
      const match = dashboard.sortMode.match(/^field:(.+):(asc|desc)$/);
      if (!match) return 0;
      const av = parseNumber(a.values[match[1]]) ?? 0;
      const bv = parseNumber(b.values[match[1]]) ?? 0;
      return match[2] === "asc" ? av - bv : bv - av;
    });
  }, [dashboard, search]);

  if (loadError) {
    return <main className="signin-page"><section className="signin-card"><img className="signin-logo" src="/favicon.png" alt="" /><p className="eyebrow">Fluxora Tally</p><h1>Couldn’t open your tally</h1><p className="signin-copy">{loadError}</p><button className="button button-primary" onClick={() => location.reload()}><RefreshIcon size={16} /> Try again</button></section></main>;
  }
  if (!dashboard) {
    return <main className="loading-page" aria-live="polite"><img className="loading-logo" src="/favicon.png" alt="" /><p>Opening your analytics…</p></main>;
  }

  const current = dashboard;
  const theme = {
    "--fx-brand": current.settings.accentColor,
    "--fx-canvas": current.settings.backgroundColor,
    "--fx-surface": current.settings.cardColor,
    "--fx-text": current.settings.textColor,
  } as CSSProperties;

  function createAccount() {
    setEditor({
      mode: "new",
      account: {
        id: makeId("account"),
        name: "",
        url: "",
        statusId: current.statuses[0].id,
        values: Object.fromEntries(current.fields.map((field) => [field.id, ""])),
      },
    });
  }

  function persistAccount(account: TallyAccount, mode: "new" | "edit") {
    const accounts = mode === "new"
      ? [...current.accounts, account]
      : current.accounts.map((item) => item.id === account.id ? account : item);
    setEditor(null);
    void save({ ...current, accounts });
  }

  function openConfig() {
    setLogoError("");
    setConfig({
      settings: { ...current.settings },
      fields: current.fields.map((field) => ({ ...field })),
      statuses: current.statuses.map((status) => ({ ...status })),
    });
  }

  async function uploadLogo(file?: File) {
    if (!file || !config) return;
    setLogoBusy(true);
    setLogoError("");
    try {
      const form = new FormData();
      form.append("logo", file);
      const response = await fetch("/api/logo", { method: "POST", body: form });
      const body = await response.json() as { logoUrl?: string; error?: string };
      if (!response.ok || !body.logoUrl) throw new Error(body.error || "The logo could not be uploaded.");
      setConfig({ ...config, settings: { ...config.settings, logoUrl: body.logoUrl } });
    } catch (cause) {
      setLogoError(cause instanceof Error ? cause.message : "The logo could not be uploaded.");
    } finally {
      setLogoBusy(false);
    }
  }

  return <div className="app-shell" style={theme}>
    <header className="site-header"><div className="header-inner">
      <div className="brand-lockup"><div className="brand-image-wrap"><img className="brand-logo" src={current.settings.logoUrl || "/favicon.png"} alt="" /></div><div className="brand-copy"><h1>{current.settings.siteTitle}</h1><p>Analytics dashboard</p></div></div>
      <div className="header-actions"><div className={`save-indicator save-${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? <><CheckIcon size={15} /> Saved</> : saveState === "error" ? "Not saved" : "Synced"}</div><button className="button button-secondary" onClick={openConfig}><SettingsIcon size={16} /> Configure</button><a className="signout-link" href="/api/logout"><LogOutIcon size={16} /><span>Sign out</span></a></div>
    </div></header>

    <main className="dashboard-main">
      {saveError ? <div className="notice notice-error">{saveError}</div> : null}
      <AnalyticsPanel dashboard={current} points={analytics} />

      <section className="accounts-section" aria-labelledby="accounts-title">
        <div className="section-heading accounts-heading">
          <div><p className="eyebrow">Operations</p><h2 id="accounts-title">Affiliate accounts</h2><p className="analytics-subtitle">Update account values here. Today’s combined commission automatically feeds the analytics history.</p></div>
          <div className="toolbar"><label className="search-control"><span className="sr-only">Search accounts</span><SearchIcon size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" /></label><label className="sort-control"><span className="sr-only">Sort accounts</span><select value={current.sortMode} onChange={(event) => void save({ ...current, sortMode: event.target.value as SortMode })}><option value="manual">Manual order</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>{current.fields.flatMap((field) => [<option key={`${field.id}-desc`} value={`field:${field.id}:desc`}>{field.label}: high to low</option>, <option key={`${field.id}-asc`} value={`field:${field.id}:asc`}>{field.label}: low to high</option>])}</select></label><button className="button button-primary" onClick={createAccount}><PlusIcon size={16} /> Add account</button></div>
        </div>

        <div className="account-list">
          {visibleAccounts.map((account) => <AccountCard key={account.id} dashboard={current} account={account} onEdit={() => setEditor({ mode: "edit", account: { ...account, values: { ...account.values } } })} onDelete={() => { if (confirm(`Delete “${account.name}”?`)) void save({ ...current, accounts: current.accounts.filter((item) => item.id !== account.id) }); }} onMove={(direction) => { const index = current.accounts.findIndex((item) => item.id === account.id); void save({ ...current, accounts: move(current.accounts, index, index + direction) }); }} />)}
          {!visibleAccounts.length ? <div className="empty-state"><h3>{search ? "No matching accounts" : "No accounts yet"}</h3><p>{search ? "Try a different search term." : "Add your first account to start the tally."}</p>{search ? null : <button className="button button-primary" onClick={createAccount}><PlusIcon size={16} /> Add account</button>}</div> : null}
        </div>
      </section>
    </main>

    {editor ? <AccountModal dashboard={current} editor={editor} setEditor={setEditor} onSave={persistAccount} /> : null}
    {config ? <ConfigModal draft={config} setDraft={setConfig} logoBusy={logoBusy} logoError={logoError} onUploadLogo={(file) => void uploadLogo(file)} onSubmit={(draft) => { const next = normalizeDashboard({ ...current, ...draft }); setConfig(null); void save(next); }} /> : null}
  </div>;
}
