"use client";

import { Fragment, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  deleteRow as deleteSupabaseRow,
  getSession,
  insertRow,
  isSupabaseConfigured,
  queryOne,
  queryRows,
  signInWithPassword,
  signOut as clearSession,
  updateRow as updateSupabaseRow,
  type SupabaseSession,
} from "../lib/supabase";
import styles from "./admin.module.css";

type Primitive = string | number | boolean | null;
type ContentRow = Record<string, Primitive> & { id: string };
type InputType = "text" | "url" | "number" | "textarea" | "checkbox" | "select";

type FieldDefinition = {
  key: string;
  label: string;
  type: InputType;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

type EditorDefinition = {
  table: string;
  title: string;
  description: string;
  query: string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  maxRows?: number;
  fields: FieldDefinition[];
  newRow?: Omit<ContentRow, "id">;
};

const editors: EditorDefinition[] = [
  {
    table: "collection_cards",
    title: "Collection cards",
    description: "Manage the existing public collection cards, including their Cloudinary image, copy, button, visibility, and order.",
    query: "select=*&order=sort_order.asc",
    fields: [
      { key: "eyebrow", label: "Category", type: "text", placeholder: "COMMUNITY" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "button_label", label: "Button label", type: "text" },
      { key: "button_url", label: "Button link", type: "url" },
      { key: "image_url", label: "Cloudinary background image", type: "url", placeholder: "https://res.cloudinary.com/..." },
      { key: "is_featured", label: "Most popular badge", type: "checkbox" },
      { key: "sort_order", label: "Position order", type: "number" },
      { key: "is_active", label: "Visible", type: "checkbox" },
    ],
    newRow: {
      eyebrow: "CATEGORY",
      title: "New collection",
      description: "Add a short description.",
      button_label: "View item",
      button_url: "",
      image_url: "",
      is_featured: false,
      sort_order: 1,
      is_active: true,
    },
  },
  {
    table: "gallery_images",
    title: "Visual archive",
    description: "Fixed archive: six editable 2:3 slots in each row. The row and slot positions cannot be added, deleted, or moved. Hidden slots are automatically replaced by repeats of the remaining visible cards on the public page.",
    query: "select=*&sort_order=lte.6&order=row_position.asc,sort_order.asc",
    allowAdd: false,
    allowDelete: false,
    fields: [
      { key: "image_url", label: "Cloudinary image URL", type: "url", placeholder: "https://res.cloudinary.com/..." },
      { key: "target_url", label: "Optional click link", type: "url" },
      { key: "alt_text", label: "Image alt text", type: "text" },
      { key: "is_active", label: "Show this card", type: "checkbox" },
    ],
  },
  {
    table: "access_plans",
    title: "Pricing tiers",
    description: "Edit the fixed Tool, Premium, and Creator tiers. Price controls the public Buy button and checkout amount. Tier text appears beneath the three tier buttons on the Pricing page.",
    query: "select=*&order=sort_order.asc",
    allowAdd: false,
    allowDelete: false,
    fields: [
      { key: "title", label: "Plan title", type: "text" },
      { key: "price_php", label: "Price (PHP)", type: "number" },
      { key: "description", label: "Tier text", type: "textarea" },
      { key: "show_description", label: "Show tier text", type: "checkbox" },
      { key: "badge", label: "Small badge / home card badge", type: "text" },
      { key: "features", label: "Home card features — one bullet per line", type: "textarea" },
      { key: "button_label", label: "Home card button label", type: "text" },
      { key: "button_url", label: "Checkout link", type: "url" },
      { key: "checkout_enabled", label: "Checkout enabled", type: "checkbox" },
      { key: "is_active", label: "Show this tier", type: "checkbox" },
    ],
  },
  {
    table: "pricing_page_settings",
    title: "Pricing page settings",
    description: "Control Pricing-page sections without changing membership entitlement logic.",
    query: "select=*&id=eq.main&limit=1",
    allowAdd: false,
    allowDelete: false,
    fields: [
      { key: "faq_enabled", label: "Show Pricing FAQ section", type: "checkbox" },
    ],
  },
  {
    table: "pricing_faqs",
    title: "Pricing FAQ",
    description: "Edit, reorder, show, hide, add, or remove questions shown on the Pricing page.",
    query: "select=*&order=sort_order.asc",
    fields: [
      { key: "question", label: "Question", type: "text" },
      { key: "answer", label: "Answer", type: "textarea" },
      { key: "sort_order", label: "Position order", type: "number" },
      { key: "is_active", label: "Visible", type: "checkbox" },
    ],
    newRow: {
      question: "New pricing question",
      answer: "Add the answer here.",
      sort_order: 1,
      is_active: true,
    },
  },
  {
    table: "payment_settings",
    title: "Easy payments",
    description: "Edit the Easy Payments heading, description, GCash details, Cloudinary QR image, and optional QR click link.",
    query: "select=*&id=eq.main&limit=1",
    allowAdd: false,
    allowDelete: false,
    fields: [
      { key: "eyebrow", label: "Section label", type: "text" },
      { key: "heading", label: "Main heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "payment_label", label: "Payment label", type: "text" },
      { key: "payment_number", label: "GCash number", type: "text" },
      { key: "qr_image_url", label: "Cloudinary QR image URL", type: "url", placeholder: "https://res.cloudinary.com/..." },
      { key: "qr_target_url", label: "Optional QR click link", type: "url" },
      { key: "qr_alt_text", label: "QR image alt text", type: "text" },
      { key: "is_active", label: "Show Easy Payments", type: "checkbox" },
    ],
  },
];

function cleanPayload(row: ContentRow) {
  const payload: Record<string, Primitive> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (["id", "created_at", "updated_at"].includes(key)) return;
    payload[key] = value;
  });
  return payload;
}

function rowHeading(editor: EditorDefinition, row: ContentRow, index: number) {
  if (editor.table === "gallery_images") {
    const rowName = String(row.row_position || "top");
    return `${rowName.charAt(0).toUpperCase() + rowName.slice(1)} row · Slot ${Number(row.sort_order) || index + 1}`;
  }
  if (editor.table === "payment_settings") return "Easy Payments settings";
  if (editor.table === "pricing_page_settings") return "Pricing page settings";
  if (editor.table === "pricing_faqs") return String(row.question || `Question ${index + 1}`);
  return String(row.title || row.alt_text || row.eyebrow || `Item ${index + 1}`);
}

function galleryGroupLabel(row: ContentRow) {
  const rowName = String(row.row_position || "top");
  const direction = rowName === "middle" ? "moves right" : "moves left";
  return `${rowName.charAt(0).toUpperCase() + rowName.slice(1)} row — ${direction}`;
}

export default function AdminClient() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTable, setActiveTable] = useState(editors[0].table);
  const [rows, setRows] = useState<Record<string, ContentRow[]>>({});
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecking(false);
      return;
    }

    getSession().then((storedSession) => {
      setSession(storedSession);
      if (!storedSession) setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    const userId = session.user.id;
    let cancelled = false;
    async function verifyAdmin() {
      setChecking(true);
      const result = await queryOne<{ user_id: string }>(
        "site_admins",
        `select=user_id&user_id=eq.${encodeURIComponent(userId)}`,
        true,
      );
      if (cancelled) return;
      setIsAdmin(Boolean(result.data) && !result.error);
      setChecking(false);
    }
    verifyAdmin();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadAll() {
    setNotice("Loading content…");
    const tableResults = await Promise.all(
      editors.map(async (editor) => {
        const result = await queryRows<ContentRow>(editor.table, editor.query, true);
        return { table: editor.table, data: result.data || [], error: result.error };
      }),
    );
    const nextRows: Record<string, ContentRow[]> = {};
    tableResults.forEach((result) => {
      nextRows[result.table] = result.data;
    });
    setRows(nextRows);

    const error = tableResults.find((result) => result.error)?.error;
    setNotice(error ? error.message : "Content loaded.");
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    const result = await signInWithPassword(email, password);
    if (result.error) setAuthError(result.error.message);
    else if (result.data) setSession(result.data);
  }

  function signOut() {
    clearSession();
    setSession(null);
    setIsAdmin(false);
  }

  function updateRow(table: string, id: string, key: string, value: Primitive) {
    setRows((current) => ({
      ...current,
      [table]: (current[table] || []).map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function addRow(editor: EditorDefinition) {
    if (editor.allowAdd === false || !editor.newRow) return;
    const currentRows = rows[editor.table] || [];
    if (editor.maxRows && currentRows.length >= editor.maxRows) {
      setNotice(`This section is limited to ${editor.maxRows} rows.`);
      return;
    }
    const nextOrder = currentRows.reduce((highest, row) => Math.max(highest, Number(row.sort_order) || 0), 0) + 1;
    const newRow: ContentRow = { id: `new-${crypto.randomUUID()}`, ...editor.newRow, sort_order: nextOrder };
    setRows((current) => ({ ...current, [editor.table]: [...(current[editor.table] || []), newRow] }));
  }

  async function saveRow(table: string, row: ContentRow) {
    setBusyId(row.id);
    setNotice("Saving…");
    const payload = cleanPayload(row);

    if (row.id.startsWith("new-")) {
      const { data, error } = await insertRow<ContentRow>(table, payload);
      if (error) {
        setNotice(error.message);
      } else if (data) {
        setRows((current) => ({
          ...current,
          [table]: (current[table] || []).map((item) => (item.id === row.id ? data : item)),
        }));
        setNotice("Saved.");
      }
    } else {
      const { data, error } = await updateSupabaseRow<ContentRow>(table, row.id, payload);
      if (error) {
        setNotice(error.message);
      } else if (data) {
        setRows((current) => ({
          ...current,
          [table]: (current[table] || []).map((item) => (item.id === row.id ? data : item)),
        }));
        setNotice("Saved.");
      }
    }
    setBusyId("");
  }

  async function deleteRow(table: string, row: ContentRow) {
    if (!confirm("Delete this item?")) return;
    if (row.id.startsWith("new-")) {
      setRows((current) => ({ ...current, [table]: (current[table] || []).filter((item) => item.id !== row.id) }));
      return;
    }
    setBusyId(row.id);
    const { error } = await deleteSupabaseRow(table, row.id);
    if (error) setNotice(error.message);
    else {
      setRows((current) => ({ ...current, [table]: (current[table] || []).filter((item) => item.id !== row.id) }));
      setNotice("Deleted.");
    }
    setBusyId("");
  }

  if (!isSupabaseConfigured()) {
    return (
      <section className={styles.authState} aria-labelledby="supabase-not-configured-heading">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Admin unavailable</span>
          <h1 id="supabase-not-configured-heading">Supabase is not configured</h1>
          <p>Copy <code>.env.example</code> to <code>.env.local</code>, then add your project URL and publishable key.</p>
          <a className={styles.secondaryAction} href="/">Return to website</a>
        </div>
      </section>
    );
  }

  if (checking) {
    return (
      <section className={styles.authState} aria-live="polite" aria-busy="true">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Protected workspace</span>
          <h1>Checking access</h1>
          <p>Verifying your Supabase session and Fluxora Admin authorization…</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className={styles.authState} aria-labelledby="admin-password-login-heading">
        <form className={styles.loginCard} onSubmit={signIn}>
          <span className={styles.kicker}>Supabase sign in</span>
          <h1 id="admin-password-login-heading">Fluxora Admin</h1>
          <p>Sign in with the Supabase Auth user registered in the <code>site_admins</code> table.</p>
          <label>Email<input type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required /></label>
          {authError && <p className={styles.error} role="alert">{authError}</p>}
          <button className={styles.primaryAction} type="submit">Sign in</button>
        </form>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className={styles.authState} aria-labelledby="admin-not-authorized-heading">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Restricted</span>
          <h1 id="admin-not-authorized-heading">Not authorized</h1>
          <p>This Supabase user is signed in but is not listed in <code>public.site_admins</code>.</p>
          <button className={styles.secondaryAction} type="button" onClick={signOut}>Sign out</button>
        </div>
      </section>
    );
  }

  const activeEditor = editors.find((editor) => editor.table === activeTable) || editors[0];
  const activeRows = rows[activeEditor.table] || [];
  const noticeIsError = Boolean(notice) && !["Loading content…", "Content loaded.", "Saving…", "Saved.", "Deleted."].includes(notice);

  return (
    <div className={styles.adminWorkspace}>
      <section className={styles.adminIntro} aria-labelledby="content-admin-heading">
        <div>
          <span className={styles.kicker}>Admin</span>
          <h1 id="content-admin-heading">Content Admin</h1>
          <p>Manage Fluxora&apos;s public content, pricing, and payment presentation.</p>
          <span className={styles.accountLine}>{session.user.email}</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryAction} type="button" onClick={signOut}>Sign out</button>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="Content editor sections">
        {editors.map((editor) => (
          <button
            className={activeTable === editor.table ? styles.activeTab : ""}
            type="button"
            key={editor.table}
            onClick={() => setActiveTable(editor.table)}
            aria-pressed={activeTable === editor.table}
          >
            {editor.title}
          </button>
        ))}
      </nav>

      <section className={styles.editorHeader} aria-labelledby="active-editor-heading">
        <div>
          <span className={styles.kicker}>Editable section</span>
          <h2 id="active-editor-heading">{activeEditor.title}</h2>
          <p>{activeEditor.description}</p>
        </div>
        {activeEditor.allowAdd !== false && (
          <button className={styles.primaryAction} type="button" onClick={() => addRow(activeEditor)} disabled={Boolean(activeEditor.maxRows && activeRows.length >= activeEditor.maxRows)}>
            Add item{activeEditor.maxRows ? ` (${activeRows.length}/${activeEditor.maxRows})` : ""}
          </button>
        )}
      </section>

      <p className={`${styles.notice} ${noticeIsError ? styles.noticeError : ""}`} role="status" aria-live="polite">{notice}</p>

      <section className={styles.rowGrid} aria-label={`${activeEditor.title} items`}>
        {activeRows.map((row, rowIndex) => {
          const previousRow = activeRows[rowIndex - 1];
          const showGalleryGroup = activeEditor.table === "gallery_images" && (!previousRow || previousRow.row_position !== row.row_position);
          const previewUrl = activeEditor.table === "payment_settings" ? row.qr_image_url : row.image_url;

          return (
            <Fragment key={row.id}>
              {showGalleryGroup && <h3 className={styles.groupHeading}>{galleryGroupLabel(row)}</h3>}
              <article className={styles.rowCard}>
                <div className={styles.rowTop}>
                  <div>
                    <span>{activeEditor.table === "gallery_images" ? "Fixed archive slot" : `Item ${rowIndex + 1}`}</span>
                    <strong>{rowHeading(activeEditor, row, rowIndex)}</strong>
                  </div>
                  {typeof previewUrl === "string" && previewUrl ? <img src={previewUrl} alt="Current preview" /> : <div className={styles.previewPlaceholder} aria-hidden="true" />}
                </div>

                <div className={styles.formGrid}>
                  {activeEditor.fields.map((field) => {
                    const value = row[field.key];
                    if (field.type === "checkbox") {
                      return (
                        <label className={styles.checkboxLabel} key={field.key}>
                          <input type="checkbox" checked={Boolean(value)} onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(activeEditor.table, row.id, field.key, event.target.checked)} />
                          <span>{field.label}</span>
                        </label>
                      );
                    }

                    if (field.type === "textarea") {
                      return (
                        <label className={styles.fullField} key={field.key}>{field.label}
                          <textarea value={String(value || "")} placeholder={field.placeholder} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateRow(activeEditor.table, row.id, field.key, event.target.value)} />
                        </label>
                      );
                    }

                    if (field.type === "select") {
                      return (
                        <label key={field.key}>{field.label}
                          <select value={String(value || "")} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateRow(activeEditor.table, row.id, field.key, event.target.value)}>
                            {field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                          </select>
                        </label>
                      );
                    }

                    return (
                      <label className={field.type === "url" ? styles.fullField : ""} key={field.key}>{field.label}
                        <input
                          type={field.type}
                          value={field.type === "number" ? Number(value || 0) : String(value || "")}
                          placeholder={field.placeholder}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(activeEditor.table, row.id, field.key, field.type === "number" ? Number(event.target.value) : event.target.value)}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className={styles.rowActions}>
                  <button className={styles.primaryAction} type="button" onClick={() => saveRow(activeEditor.table, row)} disabled={busyId === row.id}>{busyId === row.id ? "Saving…" : "Save item"}</button>
                  {activeEditor.allowDelete !== false && (
                    <button className={styles.dangerButton} type="button" onClick={() => deleteRow(activeEditor.table, row)} disabled={busyId === row.id}>Delete</button>
                  )}
                </div>
              </article>
            </Fragment>
          );
        })}
      </section>
    </div>
  );
}
