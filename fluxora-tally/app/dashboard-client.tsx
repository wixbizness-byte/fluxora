"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import AccountCard from "../components/tally/account-card";
import AccountModal, { type AccountEditor } from "../components/tally/account-modal";
import ConfigModal, { type ConfigDraft } from "../components/tally/config-modal";
import { CheckIcon, LogOutIcon, PlusIcon, RefreshIcon, SearchIcon, SettingsIcon } from "../components/icons";
import { formatValue, makeId, normalizeDashboard, parseNumber, move } from "../lib/dashboard-utils";
import type { DashboardState, SortMode, TallyAccount } from "../lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function DashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
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
      .then(async (response) => ({ response, body: await response.json() as { dashboard?: DashboardState; error?: string } }))
      .then(({ response, body }) => {
        if (!response.ok || !body.dashboard) throw new Error(body.error || "Could not load the dashboard.");
        setDashboard(body.dashboard);
      })
      .catch((cause) => { if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load the dashboard."); });
    return () => controller.abort();
  }, []);

  async function save(next: DashboardState) {
    const previous = dashboard;
    setDashboard(next); setSaveState("saving"); setSaveError("");
    try {
      const response = await fetch("/api/dashboard", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ dashboard: next }) });
      const body = await response.json() as { dashboard?: DashboardState; error?: string };
      if (!response.ok || !body.dashboard) throw new Error(body.error || "Your changes could not be saved.");
      setDashboard(body.dashboard); setSaveState("saved"); window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (cause) {
      if (previous) setDashboard(previous);
      setSaveState("error"); setSaveError(cause instanceof Error ? cause.message : "Your changes could not be saved.");
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

  if (loadError) return <main className="signin-page"><section className="signin-card"><img className="signin-logo" src="/favicon.png" alt="" /><p className="eyebrow">Fluxora Tally</p><h1>Couldn’t open your tally</h1><p className="signin-copy">{loadError}</p><button className="button button-primary" onClick={() => location.reload()}><RefreshIcon size={16} /> Try again</button></section></main>;
  if (!dashboard) return <main className="loading-page" aria-live="polite"><img className="loading-logo" src="/favicon.png" alt="" /><p>Opening your tally…</p></main>;

  const theme = { "--fx-brand": dashboard.settings.accentColor, "--fx-canvas": dashboard.settings.backgroundColor, "--fx-surface": dashboard.settings.cardColor, "--fx-text": dashboard.settings.textColor } as CSSProperties;
  function createAccount() {
    setEditor({ mode: "new", account: { id: makeId("account"), name: "", url: "", statusId: dashboard.statuses[0].id, values: Object.fromEntries(dashboard.fields.map((field) => [field.id, ""])) } });
  }
  function persistAccount(account: TallyAccount, mode: "new" | "edit") {
    const accounts = mode === "new" ? [...dashboard.accounts, account] : dashboard.accounts.map((item) => item.id === account.id ? account : item);
    setEditor(null); void save({ ...dashboard, accounts });
  }
  function openConfig() { setLogoError(""); setConfig({ settings: { ...dashboard.settings }, fields: dashboard.fields.map((f) => ({ ...f })), statuses: dashboard.statuses.map((s) => ({ ...s })) }); }
  async function uploadLogo(file?: File) {
    if (!file || !config) return;
    setLogoBusy(true); setLogoError("");
    try {
      const form = new FormData(); form.append("logo", file);
      const response = await fetch("/api/logo", { method: "POST", body: form });
      const body = await response.json() as { logoUrl?: string; error?: string };
      if (!response.ok || !body.logoUrl) throw new Error(body.error || "The logo could not be uploaded.");
      setConfig({ ...config, settings: { ...config.settings, logoUrl: body.logoUrl } });
    } catch (cause) { setLogoError(cause instanceof Error ? cause.message : "The logo could not be uploaded."); }
    finally { setLogoBusy(false); }
  }

  return <div className="app-shell" style={theme}>
    <header className="site-header"><div className="header-inner">
      <div className="brand-lockup"><div className="brand-image-wrap"><img className="brand-logo" src={dashboard.settings.logoUrl || "/favicon.png"} alt="" /></div><div className="brand-copy"><h1>{dashboard.settings.siteTitle}</h1><p>{dashboard.settings.subtitle}</p></div></div>
      <div className="header-actions"><div className={`save-indicator save-${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? <><CheckIcon size={15} /> Saved</> : saveState === "error" ? "Not saved" : "Synced"}</div><button className="button button-secondary" onClick={openConfig}><SettingsIcon size={16} /> Configure</button><a className="signout-link" href="/api/logout"><LogOutIcon size={16} /><span>Sign out</span></a></div>
    </div></header>

    <main className="dashboard-main">
      {saveError ? <div className="notice notice-error">{saveError}</div> : null}
      <section className="summary-section" aria-labelledby="summary-title"><div className="section-heading"><div><p className="eyebrow">Overview</p><h2 id="summary-title">Summary totals</h2></div><p className="section-note">Totals add up the values you enter manually.</p></div><div className="summary-grid"><article className="summary-card"><span>Accounts</span><strong>{dashboard.accounts.length}</strong></article>{dashboard.fields.filter((field) => field.showInSummary).map((field) => <article className="summary-card" key={field.id}><span>{field.label}</span><strong>{formatValue(dashboard, String(dashboard.accounts.reduce((total, account) => total + (parseNumber(account.values[field.id]) ?? 0), 0)), field)}</strong></article>)}</div></section>

      <section className="accounts-section" aria-labelledby="accounts-title"><div className="section-heading accounts-heading"><div><p className="eyebrow">Accounts</p><h2 id="accounts-title">Your tally</h2></div><div className="toolbar"><label className="search-control"><span className="sr-only">Search accounts</span><SearchIcon size={17} /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts" /></label><label className="sort-control"><span className="sr-only">Sort accounts</span><select value={dashboard.sortMode} onChange={(e) => void save({ ...dashboard, sortMode: e.target.value as SortMode })}><option value="manual">Manual order</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>{dashboard.fields.flatMap((field) => [<option key={`${field.id}-desc`} value={`field:${field.id}:desc`}>{field.label}: high to low</option>, <option key={`${field.id}-asc`} value={`field:${field.id}:asc`}>{field.label}: low to high</option>])}</select></label><button className="button button-primary" onClick={createAccount}><PlusIcon size={16} /> Add account</button></div></div>
        <div className="account-list">{visibleAccounts.map((account) => <AccountCard key={account.id} dashboard={dashboard} account={account} onEdit={() => setEditor({ mode: "edit", account: { ...account, values: { ...account.values } } })} onDelete={() => { if (confirm(`Delete “${account.name}”?`)) void save({ ...dashboard, accounts: dashboard.accounts.filter((item) => item.id !== account.id) }); }} onMove={(direction) => { const index = dashboard.accounts.findIndex((item) => item.id === account.id); void save({ ...dashboard, accounts: move(dashboard.accounts, index, index + direction) }); }} />)}{!visibleAccounts.length ? <div className="empty-state"><h3>{search ? "No matching accounts" : "No accounts yet"}</h3><p>{search ? "Try a different search term." : "Add your first account to start the tally."}</p>{search ? null : <button className="button button-primary" onClick={createAccount}><PlusIcon size={16} /> Add account</button>}</div> : null}</div>
      </section>
    </main>

    {editor ? <AccountModal dashboard={dashboard} editor={editor} setEditor={setEditor} onSave={persistAccount} /> : null}
    {config ? <ConfigModal draft={config} setDraft={setConfig} logoBusy={logoBusy} logoError={logoError} onUploadLogo={(file) => void uploadLogo(file)} onSubmit={(draft) => { const next = normalizeDashboard({ ...dashboard, ...draft }); setConfig(null); void save(next); }} /> : null}
  </div>;
}
