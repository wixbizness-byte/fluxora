"use client";

import { useEffect, useRef } from "react";
import styles from "./home-dna-backdrop.module.css";

type NavigatorWithSaveData = Navigator & {
  connection?: { saveData?: boolean };
};

export function HomeDnaBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const canvas = canvasRef.current;
    const page = backdrop?.closest<HTMLElement>("main");
    if (!backdrop || !canvas || !page) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    // Keep first paint cheap: the tiny SVG is immediately visible, while the
    // full WebGL renderer is split into its own chunk and starts one frame later.
    const frame = window.requestAnimationFrame(() => {
      const saveData = (navigator as NavigatorWithSaveData).connection?.saveData === true;
      if (saveData) {
        backdrop.dataset.renderer = "fallback";
        return;
      }

      void import("./lib/gold-helix")
        .then(({ createHelixParticles, mountGoldHelix }) => {
          if (cancelled) return;
          const cloud = createHelixParticles();
          if (cancelled) return;
          dispose = mountGoldHelix(backdrop, canvas, page, cloud);
        })
        .catch(() => {
          if (!cancelled) backdrop.dataset.renderer = "fallback";
        });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      dispose?.();
    };
  }, []);

  return (
    <div ref={backdropRef} className={styles.backdrop} data-renderer="fallback" aria-hidden="true" inert>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.placement}>
        <svg className={styles.helix} viewBox="0 0 1700 600" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <g fill="none" stroke="#ffcc52" strokeLinecap="round">
            <path d="M-120 300 C40 95 235 95 395 300 S750 505 910 300 S1265 95 1425 300 S1780 505 1940 300" strokeWidth="4" strokeOpacity=".58" strokeDasharray="1 10" />
            <path d="M-120 300 C40 505 235 505 395 300 S750 95 910 300 S1265 505 1425 300 S1780 95 1940 300" strokeWidth="4" strokeOpacity=".48" strokeDasharray="1 10" />
            <path d="M90 184 L90 416 M245 126 L245 474 M395 300 L395 300 M550 474 L550 126 M705 416 L705 184 M910 300 L910 300 M1065 184 L1065 416 M1220 126 L1220 474 M1425 300 L1425 300 M1580 474 L1580 126" strokeWidth="3" strokeOpacity=".25" strokeDasharray="1 13" />
          </g>
        </svg>
      </div>
    </div>
  );
}
