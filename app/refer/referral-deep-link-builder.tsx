"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./referral-deep-link-builder.module.css";

type PublicReferrerResponse = {
  referrer?: {
    referralUrl: string;
  } | null;
  error?: string;
};

const TARGETS = [
  {
    key: "fashion",
    title: "Fashion Studio",
    description: "Send the invite through a Fashion Studio-focused landing page.",
  },
  {
    key: "skincare",
    title: "Skincare Facts",
    description: "Send the invite through a skincare-focused Fluxora landing page.",
  },
  {
    key: "prompt-gallery",
    title: "Prompt Gallery",
    description: "Send the invite through the Fluxora Prompt Gallery landing page.",
  },
] as const;

export default function ReferralDeepLinkBuilder() {
  const [referralUrl, setReferralUrl] = useState("");
  const [selected, setSelected] = useState<(typeof TARGETS)[number]["key"]>("fashion");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/prompts/api/public-referrer", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => ({}))) as PublicReferrerResponse;
      })
      .then((body) => {
        if (!cancelled && body?.referrer?.referralUrl) setReferralUrl(body.referrer.referralUrl);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const target = TARGETS.find((item) => item.key === selected) || TARGETS[0];
  const deepLink = useMemo(() => {
    if (!referralUrl) return "";
    try {
      const url = new URL(referralUrl);
      url.searchParams.set("tool", selected);
      return url.toString();
    } catch {
      return `${referralUrl}${referralUrl.includes("?") ? "&" : "?"}tool=${encodeURIComponent(selected)}`;
    }
  }, [referralUrl, selected]);

  async function copyLink() {
    if (!deepLink) return;
    await navigator.clipboard.writeText(deepLink);
    setNotice(`${target.title} referral link copied.`);
  }

  async function shareLink() {
    if (!deepLink) return;
    const text = `Try ${target.title} on Fluxora with my 2-day Premium referral trial.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${target.title} · Fluxora`, text, url: deepLink });
        return;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(`${text} ${deepLink}`);
    setNotice("Share message copied.");
  }

  if (!referralUrl) return null;

  return (
    <section className={styles.shell} aria-labelledby="deep-referral-heading">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p>Phase 18 · Product referrals</p>
            <h2 id="deep-referral-heading">Refer a specific Fluxora product</h2>
            <span>Choose the product your friend should see first. The same referral attribution stays attached through the 2-day trial signup.</span>
          </div>
          <strong>Both still get 2 days</strong>
        </div>

        <div className={styles.targets}>
          {TARGETS.map((item) => (
            <button
              type="button"
              key={item.key}
              data-active={selected === item.key}
              onClick={() => { setSelected(item.key); setNotice(""); }}
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              <code>?tool={item.key}</code>
            </button>
          ))}
        </div>

        <div className={styles.linkBox}>
          <div>
            <span>{target.title} referral link</span>
            <code>{deepLink}</code>
          </div>
          <button type="button" onClick={copyLink}>Copy link</button>
          <button type="button" onClick={shareLink}>Share</button>
        </div>

        {notice && <p className={styles.notice}>{notice}</p>}
        <p className={styles.finePrint}>The product parameter changes the landing content only. Referral eligibility, anti-abuse checks, attribution, and trial rewards stay on the existing referral system.</p>
      </div>
    </section>
  );
}
