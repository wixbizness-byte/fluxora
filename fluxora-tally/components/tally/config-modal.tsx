import type { FormEvent } from "react";
import type { DashboardState } from "../../lib/types";
import { FLUXORA_DEFAULTS } from "../../lib/default-dashboard";
import { makeId, move } from "../../lib/dashboard-utils";
import { DownIcon, PlusIcon, RefreshIcon, TrashIcon, UpIcon, UploadIcon, XIcon } from "../icons";

export type ConfigDraft = Pick<DashboardState, "settings" | "fields" | "statuses">;

export default function ConfigModal({ draft, setDraft, onSubmit, onUploadLogo, logoBusy, logoError }: {
  draft: ConfigDraft;
  setDraft: (value: ConfigDraft | null) => void;
  onSubmit: (draft: ConfigDraft) => void;
  onUploadLogo: (file?: File) => void;
  logoBusy: boolean;
  logoError: string;
}) {
  const updateSettings = (changes: Partial<ConfigDraft["settings"]>) => setDraft({ ...draft, settings: { ...draft.settings, ...changes } });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(draft); }
  return <div className="modal-backdrop" role="presentation">
    <section className="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <form onSubmit={submit}>
        <div className="modal-header"><div><p className="eyebrow">Settings</p><h2 id="config-title">Configure dashboard</h2></div><button type="button" className="icon-button icon-button-plain" onClick={() => setDraft(null)} aria-label="Close settings"><XIcon size={18} /></button></div>
        <div className="modal-body config-body">
          <section className="config-section" aria-labelledby="general-settings">
            <div className="config-section-heading"><h3 id="general-settings">General</h3><p>Set the title and number display.</p></div>
            <div className="config-fields two-column">
              <label className="form-field"><span>Page title</span><input required value={draft.settings.siteTitle} onChange={(e) => updateSettings({ siteTitle: e.target.value })} /></label>
              <label className="form-field"><span>Subtitle</span><input value={draft.settings.subtitle} onChange={(e) => updateSettings({ subtitle: e.target.value })} placeholder="Optional" /></label>
              <label className="form-field"><span>Currency symbol</span><input required maxLength={4} value={draft.settings.currencySymbol} onChange={(e) => updateSettings({ currencySymbol: e.target.value })} /></label>
              <label className="form-field"><span>Decimal places</span><select value={String(draft.settings.decimalPlaces)} onChange={(e) => updateSettings({ decimalPlaces: e.target.value === "2" ? 2 : 0 })}><option value="0">No decimals</option><option value="2">Two decimals</option></select></label>
            </div>
          </section>
          <section className="config-section" aria-labelledby="field-settings">
            <div className="config-section-heading config-heading-action"><div><h3 id="field-settings">Displayed fields</h3><p>Rename, reorder, and choose summary totals.</p></div><button type="button" className="button button-secondary button-compact" onClick={() => setDraft({ ...draft, fields: [...draft.fields, { id: makeId("field"), label: "New field", format: "currency", showInSummary: true }] })}><PlusIcon size={15} /> Add field</button></div>
            <div className="editable-list">
              {draft.fields.map((field, index) => <div className="editable-row field-row" key={field.id}>
                <div className="mini-order-controls"><button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft({ ...draft, fields: move(draft.fields, index, index - 1) })}><UpIcon size={15} /></button><button type="button" className="icon-button" disabled={index === draft.fields.length - 1} onClick={() => setDraft({ ...draft, fields: move(draft.fields, index, index + 1) })}><DownIcon size={15} /></button></div>
                <label className="form-field compact-field"><span>Label</span><input value={field.label} onChange={(e) => setDraft({ ...draft, fields: draft.fields.map((item) => item.id === field.id ? { ...item, label: e.target.value } : item) })} /></label>
                <label className="form-field compact-field"><span>Format</span><select value={field.format} onChange={(e) => setDraft({ ...draft, fields: draft.fields.map((item) => item.id === field.id ? { ...item, format: e.target.value === "number" ? "number" : "currency" } : item) })}><option value="currency">Currency</option><option value="number">Number</option></select></label>
                <label className="checkbox-field"><input type="checkbox" checked={field.showInSummary} onChange={(e) => setDraft({ ...draft, fields: draft.fields.map((item) => item.id === field.id ? { ...item, showInSummary: e.target.checked } : item) })} /><span>Summary</span></label>
                <button type="button" className="text-button text-danger" disabled={draft.fields.length === 1} onClick={() => setDraft({ ...draft, fields: draft.fields.filter((item) => item.id !== field.id) })}><TrashIcon size={14} /> Remove</button>
              </div>)}
            </div>
          </section>
          <section className="config-section" aria-labelledby="status-settings">
            <div className="config-section-heading config-heading-action"><div><h3 id="status-settings">Status choices</h3><p>Control account labels and semantic colors.</p></div><button type="button" className="button button-secondary button-compact" onClick={() => setDraft({ ...draft, statuses: [...draft.statuses, { id: makeId("status"), label: "New status", color: FLUXORA_DEFAULTS.textMuted }] })}><PlusIcon size={15} /> Add status</button></div>
            <div className="editable-list">
              {draft.statuses.map((status, index) => <div className="editable-row status-row" key={status.id}>
                <div className="mini-order-controls"><button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft({ ...draft, statuses: move(draft.statuses, index, index - 1) })}><UpIcon size={15} /></button><button type="button" className="icon-button" disabled={index === draft.statuses.length - 1} onClick={() => setDraft({ ...draft, statuses: move(draft.statuses, index, index + 1) })}><DownIcon size={15} /></button></div>
                <label className="form-field compact-field"><span>Label</span><input value={status.label} onChange={(e) => setDraft({ ...draft, statuses: draft.statuses.map((item) => item.id === status.id ? { ...item, label: e.target.value } : item) })} /></label>
                <label className="color-field compact-color"><span>Color</span><span className="color-control"><input type="color" value={status.color} onChange={(e) => setDraft({ ...draft, statuses: draft.statuses.map((item) => item.id === status.id ? { ...item, color: e.target.value } : item) })} /><code>{status.color.toUpperCase()}</code></span></label>
                <button type="button" className="text-button text-danger" disabled={draft.statuses.length === 1} onClick={() => setDraft({ ...draft, statuses: draft.statuses.filter((item) => item.id !== status.id) })}><TrashIcon size={14} /> Remove</button>
              </div>)}
            </div>
          </section>
          <section className="config-section" aria-labelledby="appearance-settings">
            <div className="config-section-heading config-heading-action"><div><h3 id="appearance-settings">Appearance</h3><p>Use the Fluxora light-mode foundation.</p></div><button type="button" className="button button-secondary button-compact" onClick={() => updateSettings({ accentColor: FLUXORA_DEFAULTS.brand, backgroundColor: FLUXORA_DEFAULTS.canvas, cardColor: FLUXORA_DEFAULTS.surface, textColor: FLUXORA_DEFAULTS.text })}><RefreshIcon size={15} /> Fluxora defaults</button></div>
            <div>
              <div className="appearance-grid">{([ ["accentColor", "Accent"], ["backgroundColor", "Page background"], ["cardColor", "Card background"], ["textColor", "Text"] ] as const).map(([key, label]) => <label className="color-field" key={key}><span>{label}</span><span className="color-control"><input type="color" value={draft.settings[key]} onChange={(e) => updateSettings({ [key]: e.target.value })} /><code>{draft.settings[key].toUpperCase()}</code></span></label>)}</div>
              <div className="logo-settings"><div className="logo-preview"><img src={draft.settings.logoUrl || "/favicon.png"} alt="Current logo" /></div><div><strong>Logo</strong><p>PNG, JPG, or WebP. Maximum size: 2 MB.</p><div className="logo-actions"><label className="button button-secondary button-compact file-button"><UploadIcon size={15} /> {logoBusy ? "Working…" : "Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoBusy} onChange={(e) => onUploadLogo(e.target.files?.[0])} /></label>{draft.settings.logoUrl ? <button type="button" className="text-button text-danger" onClick={() => updateSettings({ logoUrl: "" })}><TrashIcon size={14} /> Remove logo</button> : null}</div>{logoError ? <p className="field-error">{logoError}</p> : null}</div></div>
            </div>
          </section>
        </div>
        <div className="modal-footer sticky-footer"><button type="button" className="button button-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="button button-primary" type="submit">Save settings</button></div>
      </form>
    </section>
  </div>;
}
