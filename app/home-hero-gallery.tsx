"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { HomeGalleryImage } from "./home-data";
import styles from "./home.module.css";

type GalleryRows = {
  top: HomeGalleryImage[];
  middle: HomeGalleryImage[];
  bottom: HomeGalleryImage[];
};

function PreviewButton({ item, onPreview }: { item: HomeGalleryImage; onPreview: (item: HomeGalleryImage) => void }) {
  return (
    <button className={styles.heroGalleryImageButton} type="button" onClick={() => onPreview(item)} aria-label={`Preview ${item.alt_text || "Fluxora creation"}`}>
      <img src={item.image_url} alt={item.alt_text || "Fluxora creation preview"} loading="eager" />
    </button>
  );
}

function MovingRow({ items, direction, onPreview }: { items: HomeGalleryImage[]; direction: "left" | "right"; onPreview: (item: HomeGalleryImage) => void }) {
  const loopItems = [...items, ...items];
  return (
    <div className={`${styles.heroGalleryRow} ${direction === "right" ? styles.heroGalleryRowRight : styles.heroGalleryRowLeft}`}>
      <div className={styles.heroGalleryTrack}>
        {loopItems.map((item, index) => <PreviewButton item={item} onPreview={onPreview} key={`${item.id}-${index}`} />)}
      </div>
    </div>
  );
}

export function HomeHeroGallery({ rows }: { rows: GalleryRows }) {
  const [selected, setSelected] = useState<HomeGalleryImage | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      <div className={styles.heroGallery} aria-label="Examples made with Fluxora">
        <MovingRow items={rows.top} direction="left" onPreview={setSelected} />
        <MovingRow items={rows.middle} direction="right" onPreview={setSelected} />
        <MovingRow items={rows.bottom} direction="left" onPreview={setSelected} />
      </div>

      {selected && (
        <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label={`Preview ${selected.alt_text || "Fluxora image"}`}>
          <button className={styles.previewBackdrop} type="button" onClick={() => setSelected(null)} aria-label="Close preview" />
          <div className={styles.previewPanel}>
            <button className={styles.previewClose} type="button" onClick={() => setSelected(null)} aria-label="Close preview"><X size={20} /></button>
            <div className={styles.previewImageWrap}><img src={selected.image_url} alt={selected.alt_text || "Fluxora image preview"} /></div>
            <div className={styles.previewMeta}>
              <span>Fluxora preview</span>
              <h2>{selected.alt_text || "Creative preview"}</h2>
              <p>See the visual direction up close, then open the source prompt if you want to study or adapt it.</p>
              {selected.target_url && <a href={selected.target_url}>View prompt <ExternalLink size={15} /></a>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
