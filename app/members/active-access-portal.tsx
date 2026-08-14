"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./active-access-portal.module.css";

type ActivityRow = {
  member_id: string;
  access_code: string;
  gmail: string;
  tier: "Tool" | "Premium" | "Creator";
  status: string;
  uses_today: number;
  last_used_at_today: string | null;
  canvas_devices_today: number;
  uses_7d: number;
  last_used_at_7d: string | null;
  canvas_devices_7d: number;
};

type ActivityResponse = {
  activity?: ActivityRow[];
  error?: string;
};

type WindowMode = "today" | "week";

function phTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function focusMember(item: ActivityRow) {
  const input = document.querySelector<HTMLInputElement>('input[placeholder="Search Gmail, code, tier, status, or notes..."]');
  if (!input) return;
  const isTrial = item.status.toLowerCase() === "google_trial";
  const value = isTrial ? item.access_code : item.gmail;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  input.focus({ preventScroll: true });
}

export default function ActiveAccessPortal() {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [mode, setMode] = useState<WindowMode>("today");
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/prompts/api/member-access-usage", {
          cache: "no-store",
          credentials: "include",
        });
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) {
          setDenied(true);
          return;
        }
        const body = (await response.json().catch(() => ({}))) as ActivityResponse;
        if (!response.ok) throw new Error(body.error || "Could not load active access analytics.");
        setDenied(false);
        setError("");
        setActivity(body.activity || []);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load active access analytics.");
      }
    }

    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (denied) return;
    let host: HTMLDivElement | null = null;
    let legacyRail: HTMLElement | null = null;

    const attach = () => {
      if (host?.isConnected) return true;
      const rail = document.querySelector<HTMLElement>('aside[class*="activityRail"]');
      const parent = rail?.parentElement;
      if (!rail || !parent) return false;

      legacyRail = rail;
      legacyRail.hidden = true;

      host = document.createElement("div");
      host.dataset.activeAccessHost = "true";
      host.className = styles.portalHost;
      parent.insertBefore(host, rail);
      setMountNode(host);
      return true;
    };

    if (attach()) {
      return () => {
        setMountNode(null);
        host?.remove();
        if (legacyRail) legacyRail.hidden = false;
      };
    }

    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      setMountNode(null);
      host?.remove();
      if (legacyRail) legacyRail.hidden = false;
    };
  }, [denied]);

  const ranked = useMemo(() => {
    const rows = activity.filter((item) => (mode === "today" ? item.uses_today : item.uses_7d) > 0);
    return [...rows].sort((a, b) => {
      const primary = mode === "today" ? b.uses_today - a.uses_today : b.uses_7d - a.uses_7d;
      if (primary) return primary;
      return a.gmail.localeCompare(b.gmail);
    });
  }, [activity, mode]);

  if (denied || !mountNode) return null;

  return createPortal(
    <section className={styles.panel} aria-label="Active access rankings">
      <div className={styles.heading}>
        <p className={styles.kicker}>{mode === "today" ? "Since 4:00 AM PH" : "Rolling 7 days"}</p>
        <div className={styles.headingRow}>
          <h2>{mode === "today" ? "Active access today" : "Active access — 7 days"}</h2>
          <div className={styles.tabs} role="tablist" aria-label="Active access window">
            <button type="button" className={mode === "today" ? styles.active : ""} onClick={() => setMode("today")}>Today</button>
            <button type="button" className={mode === "week" ? styles.active : ""} onClick={() => setMode("week")}>7 Days</button>
          </div>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : (
        <div className={styles.list}>
          {ranked.map((item, index) => {
            const isTrial = item.status.toLowerCase() === "google_trial";
            const uses = mode === "today" ? item.uses_today : item.uses_7d;
            const lastUsed = mode === "today" ? item.last_used_at_today : item.last_used_at_7d;
            const canvasDevices = mode === "today" ? item.canvas_devices_today : item.canvas_devices_7d;
            return (
              <button type="button" className={styles.item} key={item.member_id} onClick={() => focusMember(item)}>
                <span className={styles.rank}>{index + 1}</span>
                <span className={styles.copy}>
                  <strong title={isTrial ? item.access_code : item.gmail}>{isTrial ? item.access_code : item.gmail}</strong>
                  <small>{isTrial ? "Trial" : item.tier}{lastUsed ? ` • Last ${phTime(lastUsed)}` : ""}</small>
                  {canvasDevices >= 4 && <em>{canvasDevices} Canvas registrations{mode === "today" ? " today" : " / 7 days"}{canvasDevices >= 6 ? " • Check" : ""}</em>}
                </span>
                <span className={styles.count}><strong>{uses}</strong><small>{uses === 1 ? "use" : "uses"}</small></span>
              </button>
            );
          })}
          {!ranked.length && <p className={styles.empty}>No successful access activity in this window yet.</p>}
        </div>
      )}
    </section>,
    mountNode,
  );
}
