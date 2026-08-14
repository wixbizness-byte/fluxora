"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./resource-usage-portal.module.css";

type UsageRow = {
  resource_key: string;
  resource_name: string;
  resource_type: "Tool" | "CustomGPT";
  opens_today: number;
  unique_members_today: number;
  last_opened_at: string | null;
  opens_7d: number;
  unique_members_7d: number;
};

type UsageResponse = {
  usage?: UsageRow[];
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

export default function ResourceUsagePortal() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [mode, setMode] = useState<WindowMode>("today");
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/prompts/api/resource-usage", {
          cache: "no-store",
          credentials: "include",
        });
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) {
          setDenied(true);
          return;
        }
        const body = (await response.json().catch(() => ({}))) as UsageResponse;
        if (!response.ok) throw new Error(body.error || "Could not load resource usage.");
        setDenied(false);
        setError("");
        setUsage(body.usage || []);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load resource usage.");
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

    const attach = () => {
      if (host?.isConnected) return true;
      const rail = document.querySelector<HTMLElement>('aside[class*="activityRail"]');
      const parent = rail?.parentElement;
      if (!rail || !parent) return false;

      host = document.createElement("div");
      host.dataset.resourceUsageHost = "true";
      host.className = styles.portalHost;
      const activeHost = parent.querySelector<HTMLElement>("[data-active-access-host]");
      parent.insertBefore(host, activeHost || rail);
      setMountNode(host);
      return true;
    };

    if (attach()) {
      return () => {
        setMountNode(null);
        host?.remove();
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
    };
  }, [denied]);

  const ranked = useMemo(() => {
    const rows = mode === "today" ? usage.filter((item) => item.opens_today > 0) : [...usage];
    return rows.sort((a, b) => {
      const primary = mode === "today" ? b.opens_today - a.opens_today : b.opens_7d - a.opens_7d;
      if (primary) return primary;
      return a.resource_name.localeCompare(b.resource_name);
    });
  }, [mode, usage]);

  if (denied || !mountNode) return null;

  return createPortal(
    <section className={styles.panel} aria-label="Resource open rankings">
      <div className={styles.heading}>
        <p className={styles.kicker}>{mode === "today" ? "Since 4:00 AM PH" : "Rolling 7 days"}</p>
        <div className={styles.headingRow}>
          <h2>Resource opens</h2>
          <div className={styles.tabs} role="tablist" aria-label="Usage window">
            <button type="button" className={mode === "today" ? styles.active : ""} onClick={() => setMode("today")}>Today</button>
            <button type="button" className={mode === "week" ? styles.active : ""} onClick={() => setMode("week")}>7 Days</button>
          </div>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : (
        <div className={styles.list}>
          {ranked.map((item, index) => {
            const opens = mode === "today" ? item.opens_today : item.opens_7d;
            const users = mode === "today" ? item.unique_members_today : item.unique_members_7d;
            return (
              <div className={styles.item} key={item.resource_key}>
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.copy}>
                  <strong title={item.resource_name}>{item.resource_name}</strong>
                  <small>{item.resource_type}{users > 0 ? ` • ${users} user${users === 1 ? "" : "s"}` : ""}{item.last_opened_at ? ` • Last ${phTime(item.last_opened_at)}` : ""}</small>
                </div>
                <div className={styles.count}><strong>{opens}</strong><small>{opens === 1 ? "open" : "opens"}</small></div>
              </div>
            );
          })}
          {!ranked.length && <p className={styles.empty}>No tracked resource opens in this window yet.</p>}
        </div>
      )}
    </section>,
    mountNode,
  );
}
