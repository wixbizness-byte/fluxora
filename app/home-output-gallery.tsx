"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HomeGalleryImage } from "./home-data";
import styles from "./home.module.css";

type GalleryRows = {
  top: HomeGalleryImage[];
  middle: HomeGalleryImage[];
  bottom: HomeGalleryImage[];
};

type NavigatorWithSaveData = Navigator & {
  connection?: { saveData?: boolean };
};

function PreviewButton({ item, onPreview }: { item: HomeGalleryImage; onPreview: (item: HomeGalleryImage) => void }) {
  return (
    <button className={styles.outputGalleryImageButton} type="button" onClick={() => onPreview(item)} aria-label={`Preview ${item.alt_text || "Fluxora creation"}`}>
      <img
        src={item.image_url}
        alt={item.alt_text || "Fluxora creation preview"}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />
    </button>
  );
}

function MovingRow({ items, direction, onPreview }: { items: HomeGalleryImage[]; direction: "left" | "right"; onPreview: (item: HomeGalleryImage) => void }) {
  const loopItems = [...items, ...items];
  return (
    <div className={`${styles.outputGalleryRow} ${direction === "right" ? styles.outputGalleryRowRight : styles.outputGalleryRowLeft}`}>
      <div className={styles.outputGalleryTrack}>
        {loopItems.map((item, index) => <PreviewButton item={item} onPreview={onPreview} key={`${item.id}-${index}`} />)}
      </div>
    </div>
  );
}

export function HomeOutputGallery({ rows }: { rows: GalleryRows }) {
  const [selected, setSelected] = useState<HomeGalleryImage | null>(null);
  const [rowsVisible, setRowsVisible] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    if (!("IntersectionObserver" in window)) {
      setRowsVisible(true);
      return;
    }

    const saveData = (navigator as NavigatorWithSaveData).connection?.saveData === true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setRowsVisible(true);
        observer.disconnect();
      },
      { rootMargin: saveData ? "100px 0px" : "700px 0px" },
    );

    observer.observe(gallery);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selected || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  return (
    <>
      <div
        ref={galleryRef}
        className={styles.outputGallery}
        aria-label="Examples made with Fluxora"
        aria-busy={!rowsVisible}
      >
        {rowsVisible && (
          <>
            <MovingRow items={rows.top} direction="left" onPreview={setSelected} />
            <MovingRow items={rows.middle} direction="right" onPreview={setSelected} />
            <MovingRow items={rows.bottom} direction="left" onPreview={setSelected} />
          </>
        )}
      </div>

      <dialog ref={dialogRef} className={styles.previewModal} aria-label={`Preview ${selected?.alt_text || "Fluxora image"}`} onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}>
        {selected && (
          <div className={styles.previewPanel}>
            <button className={styles.previewClose} type="button" onClick={() => setSelected(null)} aria-label="Close preview"><X size={20} /></button>
            <div className={styles.previewImageWrap}><img src={selected.image_url} alt={selected.alt_text || "Fluxora image preview"} decoding="async" /></div>
            <div className={styles.previewMeta}>
              <span>Fluxora preview</span>
              <h2>{selected.alt_text || "Creative preview"}</h2>
              {selected.target_url && <a href={selected.target_url} target="_blank" rel="noopener noreferrer">{selected.cta_label || "Open resource"} <ExternalLink size={15} /></a>}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
