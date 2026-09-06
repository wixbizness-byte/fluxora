"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { getSession, queryOne, queryRows, updateRow, type SupabaseSession } from "../lib/supabase";
import styles from "./homepage-content-admin.module.css";

type Primitive = string | number | boolean | null;
type GalleryRow = Record<string, Primitive> & { id: string; row_position?: Primitive; sort_order?: Primitive };
type ToolRow = Record<string, Primitive> & { id: string; sort_order?: Primitive };
type FaqRow = Record<string, Primitive> & { id: string; sort_order?: Primitive };

const rowOrder = ["top", "middle", "bottom"];

function patch<T extends { id: string }>(rows: T[], id: string, key: string, value: Primitive) {
  return rows.map((row) => row.id === id ? { ...row, [key]: value } : row);
}

export default function HomepageContentAdmin() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSession().then(async (stored) => {
      if (cancelled || !stored) return;
      setSession(stored);
      const admin = await queryOne<{ user_id: string }>("site_admins", `select=user_id&user_id=eq.${encodeURIComponent(stored.user.id)}`, true);
      if (cancelled || !admin.data || admin.error) return;
      setAuthorized(true);
      const [galleryResult, toolResult, faqResult] = await Promise.all([
        queryRows<GalleryRow>("gallery_images", "select=*&sort_order=lte.6&order=row_position.asc,sort_order.asc", true),
        queryRows<ToolRow>("homepage_tool_previews", "select=*&order=sort_order.asc", true),
        queryRows<FaqRow>("homepage_faqs", "select=*&order=sort_order.asc", true),
      ]);
      if (cancelled) return;
      setGallery(galleryResult.data || []);
      setTools(toolResult.data || []);
      setFaqs(faqResult.data || []);
      const error = galleryResult.error || toolResult.error || faqResult.error;
      setNotice(error?.message || "Homepage controls loaded.");
    });
    return () => { cancelled = true; };
  }, []);

  const groupedGallery = useMemo(() => Object.fromEntries(rowOrder.map((row) => [row, gallery.filter((item) => String(item.row_position) === row).sort((a,b) => Number(a.sort_order)-Number(b.sort_order))])), [gallery]);

  async function save(table: string, row: Record<string, Primitive> & { id: string }) {
    setBusy(`${table}-${row.id}`);
    setNotice("Saving homepage content…");
    const body = Object.fromEntries(Object.entries(row).filter(([key]) => !["id", "created_at", "updated_at", "row_position", "sort_order"].includes(key)));
    const result = await updateRow(table, row.id, body);
    setNotice(result.error?.message || "Homepage content saved.");
    setBusy("");
  }

  if (!session || !authorized) return null;

  return (
    <section className={styles.panel} aria-labelledby="homepage-controls-heading">
      <div className={styles.heading}>
        <div>
          <span>Homepage</span>
          <h2 id="homepage-controls-heading">Homepage content controls</h2>
          <p>Configure the moving hero rows, three featured tool previews, and up to five homepage FAQ answers.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">Preview homepage ↗</a>
      </div>

      <p className={styles.notice} role="status">{notice}</p>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <div><h3>3 moving image rows</h3><p>Fixed to 6 slots per row. Top and bottom move left; middle moves right.</p></div>
          <strong>18 slots · max 6 per row</strong>
        </div>
        {rowOrder.map((rowName) => (
          <div className={styles.rowGroup} key={rowName}>
            <h4>{rowName[0].toUpperCase() + rowName.slice(1)} row · {rowName === "middle" ? "moves right" : "moves left"}</h4>
            <div className={styles.itemGrid}>
              {(groupedGallery[rowName] || []).map((row: GalleryRow) => (
                <article className={styles.itemCard} key={row.id}>
                  <div className={styles.preview}>{row.image_url ? <img src={String(row.image_url)} alt="" /> : <span>No image</span>}</div>
                  <label>Image URL<input value={String(row.image_url || "")} onChange={(e: ChangeEvent<HTMLInputElement>) => setGallery((current) => patch(current,row.id,"image_url",e.target.value))} /></label>
                  <label>Click / preview link<input value={String(row.target_url || "")} onChange={(e: ChangeEvent<HTMLInputElement>) => setGallery((current) => patch(current,row.id,"target_url",e.target.value))} /></label>
                  <label>Alt text<input value={String(row.alt_text || "")} onChange={(e: ChangeEvent<HTMLInputElement>) => setGallery((current) => patch(current,row.id,"alt_text",e.target.value))} /></label>
                  <label className={styles.toggle}><input type="checkbox" checked={Boolean(row.is_active)} onChange={(e) => setGallery((current) => patch(current,row.id,"is_active",e.target.checked))} /> Show image</label>
                  <button type="button" onClick={() => save("gallery_images", row)} disabled={busy === `gallery_images-${row.id}`}>{busy === `gallery_images-${row.id}` ? "Saving…" : "Save slot"}</button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}><div><h3>3 tool previews</h3><p>Featured tools shown directly below the Explore Fluxora directory.</p></div><strong>Fixed max 3</strong></div>
        <div className={styles.itemGridThree}>
          {tools.map((row) => (
            <article className={styles.itemCard} key={row.id}>
              <div className={styles.previewWide}>{row.image_url ? <img src={String(row.image_url)} alt="" /> : <span>No image</span>}</div>
              <label>Badge<input value={String(row.badge || "")} onChange={(e) => setTools((current) => patch(current,row.id,"badge",e.target.value))} /></label>
              <label>Title<input value={String(row.title || "")} onChange={(e) => setTools((current) => patch(current,row.id,"title",e.target.value))} /></label>
              <label>Description<textarea value={String(row.description || "")} onChange={(e) => setTools((current) => patch(current,row.id,"description",e.target.value))} /></label>
              <label>Image URL<input value={String(row.image_url || "")} onChange={(e) => setTools((current) => patch(current,row.id,"image_url",e.target.value))} /></label>
              <label>Button label<input value={String(row.button_label || "")} onChange={(e) => setTools((current) => patch(current,row.id,"button_label",e.target.value))} /></label>
              <label>Button URL<input value={String(row.button_url || "")} onChange={(e) => setTools((current) => patch(current,row.id,"button_url",e.target.value))} /></label>
              <label className={styles.toggle}><input type="checkbox" checked={Boolean(row.is_active)} onChange={(e) => setTools((current) => patch(current,row.id,"is_active",e.target.checked))} /> Show preview</label>
              <button type="button" onClick={() => save("homepage_tool_previews", row)} disabled={busy === `homepage_tool_previews-${row.id}`}>{busy === `homepage_tool_previews-${row.id}` ? "Saving…" : "Save preview"}</button>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}><div><h3>Homepage FAQ</h3><p>Keep this concise so users get answers without another long section.</p></div><strong>Fixed max 5</strong></div>
        <div className={styles.faqGrid}>
          {faqs.map((row, index) => (
            <article className={styles.faqCard} key={row.id}>
              <span>FAQ {index + 1}</span>
              <label>Question<input value={String(row.question || "")} onChange={(e) => setFaqs((current) => patch(current,row.id,"question",e.target.value))} /></label>
              <label>Answer<textarea value={String(row.answer || "")} onChange={(e) => setFaqs((current) => patch(current,row.id,"answer",e.target.value))} /></label>
              <label className={styles.toggle}><input type="checkbox" checked={Boolean(row.is_active)} onChange={(e) => setFaqs((current) => patch(current,row.id,"is_active",e.target.checked))} /> Show FAQ</label>
              <button type="button" onClick={() => save("homepage_faqs", row)} disabled={busy === `homepage_faqs-${row.id}`}>{busy === `homepage_faqs-${row.id}` ? "Saving…" : "Save FAQ"}</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
