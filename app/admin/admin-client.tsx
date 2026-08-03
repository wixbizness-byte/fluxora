"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
  maxRows?: number;
  fields: FieldDefinition[];
  newRow: Omit<ContentRow, "id">;
};

const editors: EditorDefinition[] = [
  {
    table: "collection_cards",
    title: "Collection cards",
    description: "The public 16:9 collection cards. Each card supports Cloudinary media, text, a button, visibility, and ordering.",
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
    description: "Configure up to ten active 2:3 cards in each row. Choose Top, Middle, or Bottom, then control the Cloudinary image, click link, visibility, and order.",
    maxRows: 30,
    fields: [
      { key: "image_url", label: "Cloudinary image URL", type: "url", placeholder: "https://res.cloudinary.com/..." },
      { key: "target_url", label: "Optional click link", type: "url" },
      { key: "alt_text", label: "Image alt text", type: "text" },
      {
        key: "row_position",
        label: "Gallery row",
        type: "select",
        options: [
          { label: "Top — moves left", value: "top" },
          { label: "Middle — moves right", value: "middle" },
          { label: "Bottom — moves left", value: "bottom" },
        ],
      },
      { key: "sort_order", label: "Position in row", type: "number" },
      { key: "is_active", label: "Visible", type: "checkbox" },
    ],
    newRow: { image_url: "", target_url: "", alt_text: "", row_position: "top", sort_order: 1, is_active: true },
  },
  {
    table: "qr_resources",
    title: "Optional improvements QR",
    description: "Add the Cloudinary URL of the QR code shown beside Optional Improvements. The optional target link makes the QR box clickable.",
    maxRows: 1,
    fields: [
      { key: "image_url", label: "Cloudinary QR image URL", type: "url", placeholder: "https://res.cloudinary.com/..." },
      { key: "target_url", label: "Optional click link", type: "url" },
      { key: "alt_text", label: "QR image alt text", type: "text" },
      { key: "sort_order", label: "Position order", type: "number" },
      { key: "is_active", label: "Visible", type: "checkbox" },
    ],
    newRow: {
      image_url: "",
      target_url: "",
      alt_text: "Fluxora additional resource QR code",
      sort_order: 1,
      is_active: true,
    },
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
        const order = editor.table === "gallery_images" ? "row_position.asc,sort_order.asc" : "sort_order.asc";
        const result = await queryRows<ContentRow>(editor.table, `select=*&order=${order}`, true);
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
          [table]: (current[table] || []).map((item) => (item.id === row.id ? (data as ContentRow) : item)),
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
          [table]: (current[table] || []).map((item) => (item.id === row.id ? (data as ContentRow) : item)),
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
      <main className={styles.adminPage}>
        <section className={styles.emptyState}>
          <h1>Supabase is not configured</h1>
          <p>Copy <code>.env.example</code> to <code>.env.local</code>, then add your project URL and publishable key.</p>
          <a href="/">Return to website</a>
        </section>
      </main>
    );
  }

  if (checking) {
    return <main className={styles.adminPage}><section className={styles.emptyState}><p>Checking access…</p></section></main>;
  }

  if (!session) {
    return (
      <main className={styles.adminPage}>
        <form className={styles.loginCard} onSubmit={signIn}>
          <a className={styles.backLink} href="/">Back to Fluxora</a>
          <span className={styles.kicker}>Protected workspace</span>
          <h1>Fluxora Admin</h1>
          <p>Sign in with the Supabase Auth user registered in the <code>site_admins</code> table.</p>
          <label>Email<input type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required /></label>
          {authError && <p className={styles.error}>{authError}</p>}
          <button type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={styles.adminPage}>
        <section className={styles.emptyState}>
          <h1>Not authorized</h1>
          <p>This Supabase user is signed in but is not listed in <code>public.site_admins</code>.</p>
          <button type="button" onClick={signOut}>Sign out</button>
        </section>
      </main>
    );
  }

  const activeEditor = editors.find((editor) => editor.table === activeTable) || editors[0];
  const activeRows = rows[activeEditor.table] || [];

  return (
    <main className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div><span className={styles.kicker}>Fluxora content manager</span><h1>Admin Panel</h1><p>{session.user.email}</p></div>
        <div className={styles.headerActions}><a href="/" target="_blank">View site</a><button type="button" onClick={signOut}>Sign out</button></div>
      </header>


      <nav className={styles.tabs} aria-label="Admin sections">
        {editors.map((editor) => (
          <button className={activeTable === editor.table ? styles.activeTab : ""} type="button" key={editor.table} onClick={() => setActiveTable(editor.table)}>
            {editor.title}
          </button>
        ))}
      </nav>

      <section className={styles.editorHeader}>
        <div><span className={styles.kicker}>Editable section</span><h2>{activeEditor.title}</h2><p>{activeEditor.description}</p></div>
        <button type="button" onClick={() => addRow(activeEditor)} disabled={Boolean(activeEditor.maxRows && activeRows.length >= activeEditor.maxRows)}>
          Add item{activeEditor.maxRows ? ` (${activeRows.length}/${activeEditor.maxRows})` : ""}
        </button>
      </section>

      <p className={styles.notice} role="status">{notice}</p>

      <section className={styles.rowGrid}>
        {activeRows.map((row, rowIndex) => (
          <article className={styles.rowCard} key={row.id}>
            <div className={styles.rowTop}>
              <div><span>Item {rowIndex + 1}</span><strong>{String(row.title || row.alt_text || row.eyebrow || "Untitled")}</strong></div>
              {typeof row.image_url === "string" && row.image_url ? <img src={row.image_url} alt="Current preview" /> : <div className={styles.previewPlaceholder} />}
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
              <button type="button" onClick={() => saveRow(activeEditor.table, row)} disabled={busyId === row.id}>{busyId === row.id ? "Saving…" : "Save item"}</button>
              <button className={styles.dangerButton} type="button" onClick={() => deleteRow(activeEditor.table, row)} disabled={busyId === row.id}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
