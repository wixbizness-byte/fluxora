"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { getSession, queryOne, queryRows, insertRow, updateRow, deleteRow, uploadPublicFile } from "../../lib/supabase";
import styles from "./shop-manager.module.css";

type Card = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  category_label: string;
  status_label: string;
  sort_order: number;
  is_published: boolean;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const types: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/gif": "gif",
};

function makeSlug(title: string) {
  return title.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/[\s-]+/g, "-").slice(0, 90).replace(/-+$/, "");
}

function validateCard(card: Card, publish = false) {
  if (card.title.trim().length < 2 || card.title.length > 160) return "Title must be 2–160 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug) || card.slug.length > 100) return "Slug must use lowercase letters, digits, and hyphens.";
  if (card.description.length > 3000) return "Description cannot exceed 3,000 characters.";
  if (card.category_label.trim().length < 1 || card.category_label.length > 32) return "Category label must be 1–32 characters.";
  if (card.status_label.trim().length < 1 || card.status_label.length > 32) return "Status label must be 1–32 characters.";
  if (publish && !card.image_url) return "Upload a cover image before publishing.";
  if (card.image_url && (!card.image_url.startsWith("https://") || card.image_url.length > 2048)) return "Image URL must start with https://.";
  return "";
}

export default function ShopManager() {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session) throw new Error("Your admin session has expired.");
        const check = await queryOne<{ user_id: string }>("site_admins",
          "select=user_id&user_id=eq." + encodeURIComponent(session.user.id), true);
        if (check.error || !check.data) throw new Error("Your Google account is not authorized to manage the shop.");
        if (canceled) return;
        setAuthorized(true);
        const result = await queryRows<Card>("shop_catalog_cards",
          "select=id,slug,title,description,image_url,category_label,status_label,sort_order,is_published&order=sort_order.asc,created_at.desc", true);
        if (result.error) throw new Error(result.error.message);
        if (canceled) return;
        setCards(result.data || []);
        setNotice("Shop cards loaded. Unpublished drafts are visible only to admins.");
      } catch (error) {
        if (!canceled) setNotice(error instanceof Error ? error.message : "Unable to load shop manager.");
      } finally {
        if (!canceled) setReady(true);
      }
    })();
    return () => { canceled = true; };
  }, []);

  const edit = (id: string, changes: Partial<Card>) =>
    setCards((current) => current.map((card) => card.id === id ? { ...card, ...changes } : card));

  async function createCard() {
    const normalizedTitle = title.trim();
    const normalizedSlug = (slug || makeSlug(title)).trim();
    const newCard = {
      title: normalizedTitle,
      slug: normalizedSlug,
      description: "",
      image_url: null,
      category_label: "Digital Product",
      status_label: "Coming Soon",
      sort_order: 100,
      is_published: false,
    };
    const error = validateCard({ ...newCard, id: "" });
    if (error) { setNotice(error); return; }
    setBusy("create");
    try {
      const saved = await insertRow<Card>("shop_catalog_cards", newCard);
      if (saved.error || !saved.data) throw new Error(saved.error?.message || "Unable to create card.");
      setCards((current) => [...current, saved.data!]);
      setTitle("");
      setSlug("");
      setNotice("Draft created. Upload a cover image, edit its details, and choose Publish.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to create card."); }
    finally { setBusy(""); }
  }

  async function save(card: Card, publish: boolean = card.is_published) {
    const error = validateCard(card, publish);
    if (error) { setNotice(error); return; }
    setBusy(card.id);
    try {
      const saved = await updateRow<Card>("shop_catalog_cards", card.id, {
        slug: card.slug,
        title: card.title.trim(),
        description: card.description,
        image_url: card.image_url,
        category_label: card.category_label.trim(),
        status_label: card.status_label.trim(),
        sort_order: card.sort_order,
        is_published: publish,
        updated_at: new Date().toISOString(),
      });
      if (saved.error || !saved.data) throw new Error(saved.error?.message || "Unable to save card.");
      edit(card.id, saved.data);
      setNotice(publish ? "Saved and published. Your cover now appears on /shop." : "Draft changes saved. This card is hidden from visitors.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save card."); }
    finally { setBusy(""); }
  }

  async function upload(card: Card, file: File) {
    if (!types[file.type] || file.size === 0 || file.size > MAX_FILE_SIZE) {
      setNotice("Choose a PNG, JPEG, WebP, or GIF image up to 10 MB.");
      return;
    }
    setBusy(card.id);
    setNotice("Uploading cover image...");
    try {
      const objectKey = "cards/" + crypto.randomUUID() + "." + types[file.type];
      const uploaded = await uploadPublicFile("shop-product-covers", objectKey, file);
      if (uploaded.error || !uploaded.data) throw new Error(uploaded.error?.message || "Image upload failed.");
      const saved = await updateRow<Card>("shop_catalog_cards", card.id, {
        image_url: uploaded.data,
        updated_at: new Date().toISOString(),
      });
      if (saved.error || !saved.data) throw new Error(saved.error?.message || "Image uploaded but could not be attached to the card.");
      edit(card.id, { image_url: uploaded.data });
      setNotice(card.is_published
        ? "New cover uploaded. The public shop now displays the updated image."
        : "Cover uploaded. Publish this draft when ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Image upload failed.");
    } finally { setBusy(""); }
  }

  async function remove(card: Card) {
    if (!window.confirm(`Delete "${card.title}" from the shop catalog? This cannot be undone.`)) return;
    setBusy(card.id);
    try {
      const result = await deleteRow("shop_catalog_cards", card.id);
      if (result.error) throw new Error(result.error.message);
      setCards((current) => current.filter((item) => item.id !== card.id));
      setNotice("Card deleted from the shop catalog.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to delete card."); }
    finally { setBusy(""); }
  }

  if (!ready) return <div className={styles.message}>Checking your Shop manager permissions...</div>;
  if (!authorized) return <div className={styles.message}>{notice || "Shop manager access is restricted to authorized admins."}</div>;

  return <section className={styles.panel} id="shop-manager" aria-labelledby="shop-manager-title">
    <div className={styles.heading}>
      <div>
        <span className={styles.eyebrow}>Fluxora Shop</span>
        <h1 id="shop-manager-title">Product card manager</h1>
        <p>Create image-first product cards with the same format as /tools. Upload a 16:9 cover, edit the badges and title, and publish without redeploying the website.</p>
      </div>
      <a className={styles.headerLink} href="/shop" target="_blank" rel="noopener noreferrer">Preview public shop ↗</a>
    </div>

    <p className={styles.notice} role="status" aria-live="polite">{notice}</p>

    <div className={styles.newForm}>
      <label className={styles.label}>New product title
        <input className={styles.field} value={title} maxLength={160} placeholder="Product name"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const next = e.target.value;
            if (!slug || slug === makeSlug(title)) setSlug(makeSlug(next));
            setTitle(next);
          }} />
      </label>
      <label className={styles.label}>URL slug
        <input className={styles.field} value={slug} maxLength={100} placeholder="product-name"
          onChange={(e) => setSlug(e.target.value.toLowerCase())} />
      </label>
      <button className={styles.primary} type="button" disabled={busy !== ""} onClick={() => void createCard()}>
        {busy === "create" ? "Creating..." : "+ Add product"}
      </button>
    </div>

    {cards.length === 0 ? <div className={styles.message}>No products yet. Add one above, upload the cover, then publish it.</div> : null}

    <div className={styles.list}>
      {cards.map((card) => <article className={styles.editor} key={card.id}>
        <div className={styles.preview}>
          {card.image_url ? <img src={card.image_url} alt={card.title + " preview"} /> : <span>16:9 product cover preview</span>}
        </div>
        <div className={styles.livePreview}>
          <div className={styles.previewBadges}>
            <span>{card.category_label || "Product"}</span>
            <span className={/available|in stock/i.test(card.status_label) ? styles.previewStatus : styles.previewSoon}>{card.status_label || "Coming Soon"}</span>
          </div>
          <strong>{card.title}</strong>
          <small>↗ VIEW DETAILS</small>
        </div>
        <div className={styles.editorStatus}>
          {card.is_published ? <span className={styles.state}>Published</span> : <span className={styles.stateDraft}>Unpublished draft</span>}
        </div>
        <div className={styles.formFields}>
          <label className={styles.upload}>Upload cover (16:9 recommended)
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy !== ""}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (file) void upload(card, file);
                event.currentTarget.value = "";
              }} />
            <small>PNG, JPG, WebP, GIF · Max 10 MB</small>
          </label>
          <label className={styles.label}>Title
            <input className={styles.field} value={card.title} maxLength={160}
              onChange={(e) => edit(card.id, { title: e.target.value })} />
          </label>
          <label className={styles.label}>URL slug
            <input className={styles.field} value={card.slug} maxLength={100}
              onChange={(e) => edit(card.id, { slug: e.target.value.toLowerCase() })} />
          </label>
          <div className={styles.inlineFields}>
            <label className={styles.label}>First badge (e.g. Product)
              <input className={styles.field} value={card.category_label} maxLength={32}
                onChange={(e) => edit(card.id, { category_label: e.target.value })} />
            </label>
            <label className={styles.label}>Status badge (e.g. Coming Soon)
              <input className={styles.field} value={card.status_label} maxLength={32}
                onChange={(e) => edit(card.id, { status_label: e.target.value })} />
            </label>
          </div>
          <label className={styles.label}>Description (shown on View Details)
            <textarea className={styles.textarea} value={card.description} maxLength={3000}
              onChange={(e) => edit(card.id, { description: e.target.value })} />
          </label>
          <label className={styles.label}>Display order
            <input className={styles.field} type="number" min="0" max="100000" value={card.sort_order}
              onChange={(e) => edit(card.id, { sort_order: Number(e.target.value) || 0 })} />
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} disabled={busy !== ""} onClick={() => void save(card)}>
            {busy === card.id ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className={styles.primary} disabled={busy !== ""}
            onClick={() => void save(card, !card.is_published)}>
            {card.is_published ? "Unpublish" : "Publish"}
          </button>
          {card.is_published ? <a href={`/shop/${encodeURIComponent(card.slug)}`} target="_blank" rel="noopener noreferrer" className={styles.headerLink}>View details ↗</a> : null}
          <button type="button" className={`${styles.secondary} ${styles.danger}`} disabled={busy !== ""}
            onClick={() => void remove(card)}>Delete</button>
        </div>
      </article>)}
    </div>
  </section>;
}
