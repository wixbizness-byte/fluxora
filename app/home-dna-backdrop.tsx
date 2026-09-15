"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { createHelixFallback, createHelixParticles, mountGoldHelix } from "./lib/gold-helix";
import styles from "./home-dna-backdrop.module.css";

export function HomeDnaBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterId = useId();
  const cloud = useMemo(createHelixParticles, []);
  const fallback = useMemo(() => createHelixFallback(cloud), [cloud]);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const canvas = canvasRef.current;
    const page = backdrop?.closest<HTMLElement>("main");
    if (backdrop && canvas && page) return mountGoldHelix(backdrop, canvas, page, cloud);
  }, [cloud]);

  return (
    <div ref={backdropRef} className={styles.backdrop} aria-hidden="true" inert>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.placement}>
        <svg className={styles.helix} viewBox="0 0 1700 600" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <defs><filter id={filterId} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".38" /></filter></defs>
          <g fill="none" stroke="#ffcc52" strokeLinecap="round" filter={`url(#${filterId})`}>
            {fallback.map(batch => <path key={batch.key} d={batch.d} strokeWidth={batch.width} strokeOpacity={batch.opacity} />)}
          </g>
        </svg>
      </div>
    </div>
  );
}
