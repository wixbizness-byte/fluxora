"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./shareable-rewards.module.css";

type ShareCard = {
  id: string;
  kind: "achievement" | "milestone" | "rank";
  eyebrow: string;
  title: string;
  subtitle: string;
  stat: string;
  badge: string;
  unlockedAt: string | null;
  shareText: string;
  referralUrl: string;
};

type ShareableRewardsResponse = {
  ready?: boolean;
  referralCode?: string;
  referralUrl?: string | null;
  socialReferralUrl?: string | null;
  qualifiedCount?: number;
  cards?: ShareCard[];
  error?: string;
};

function unlockedDate(value: string | null) {
  if (!value) return "Permanent unlock";
  return `Unlocked ${new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

function kindLabel(kind: ShareCard["kind"]) {
  if (kind === "rank") return "Referral rank";
  if (kind === "milestone") return "Referral milestone";
  return "Referral achievement";
}

function imageUrl(card: ShareCard) {
  return `/prompts/api/shareable-rewards/card?card=${encodeURIComponent(card.id)}`;
}

function imageFilename(card: ShareCard) {
  const safe = card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  return `fluxora-${safe || "reward"}.png`;
}

async function cardImage(card: ShareCard) {
  const response = await fetch(imageUrl(card), { cache: "no-store", credentials: "include" });
  if (!response.ok) throw new Error((await response.text().catch(() => "")) || "Could not export reward card.");
  return response.blob();
}

export default function ShareableRewardsPanel() {
  const [data, setData] = useState<ShareableRewardsResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/prompts/api/shareable-rewards", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) return null;
        const body = (await response.json().catch(() => ({}))) as ShareableRewardsResponse;
        if (!response.ok) throw new Error(body.error || "Could not load shareable rewards.");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        const first = body?.cards?.[0];
        if (first) setSelectedId(first.id);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => { cancelled = true; };
  }, []);

  const cards = data?.cards || [];
  const selected = useMemo(() => cards.find((card) => card.id === selectedId) || cards[0] || null, [cards, selectedId]);

  if (!data?.ready) return null;

  async function copyText(card: ShareCard) {
    await navigator.clipboard.writeText(card.shareText);
    setNotice("Share caption copied.");
  }

  async function copyLink() {
    const value = data?.socialReferralUrl || data?.referralUrl || "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setNotice("Referral link copied.");
  }

  async function downloadCard(card: ShareCard) {
    setExporting(true);
    setNotice("");
    try {
      const blob = await cardImage(card);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = imageFilename(card);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("PNG reward card exported.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not export reward card.");
    } finally {
      setExporting(false);
    }
  }

  async function share(card: ShareCard) {
    setExporting(true);
    setNotice("");
    try {
      const blob = await cardImage(card);
      const file = new File([blob], imageFilename(card), { type: "image/png" });
      const fileShare = { files: [file], title: card.title, text: card.shareText };

      if (navigator.share && (!navigator.canShare || navigator.canShare(fileShare))) {
        await navigator.share(fileShare);
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: card.title, text: card.shareText, url: card.referralUrl });
        return;
      }

      await navigator.clipboard.writeText(card.shareText);
      setNotice("This browser cannot share files directly, so the caption was copied. Use Download PNG to attach the card.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      try {
        if (navigator.share) {
          await navigator.share({ title: card.title, text: card.shareText, url: card.referralUrl });
          return;
        }
      } catch (fallbackCause) {
        if (fallbackCause instanceof DOMException && fallbackCause.name === "AbortError") return;
      }
      setNotice(cause instanceof Error ? cause.message : "Could not share reward card.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className={styles.wrap} aria-label="Shareable Fluxora rewards">
      <div className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Shareable rewards</p>
            <h2>Turn your wins into referrals</h2>
            <p>Share unlocked achievements, referral milestones, and rank cards as real PNG graphics with your permanent 2-day referral link attached.</p>
          </div>
          <div className={styles.summary}><span>Qualified referrals</span><strong>{data.qualifiedCount || 0}</strong></div>
        </div>

        {!cards.length ? (
          <div className={styles.empty}>Your share cards appear here after you unlock a referral achievement, milestone, or referral rank.</div>
        ) : (
          <>
            <div className={styles.selector}>
              {cards.map((card) => (
                <button type="button" key={card.id} data-active={selected?.id === card.id} onClick={() => { setSelectedId(card.id); setNotice(""); }}>
                  <span>{kindLabel(card.kind)}</span><strong>{card.badge}</strong><small>{card.stat}</small>
                </button>
              ))}
            </div>

            {selected && (
              <div className={styles.workspace}>
                <article className={styles.shareCard} data-kind={selected.kind}>
                  <div className={styles.brandRow}><span className={styles.brand}>FLUXORA</span><span className={styles.cardType}>{selected.eyebrow}</span></div>
                  <div className={styles.badge}>{selected.badge}</div>
                  <div className={styles.cardCopy}><p>{selected.eyebrow}</p><h3>{selected.title}</h3><span>{selected.subtitle}</span></div>
                  <div className={styles.cardFooter}>
                    <div><span>Achievement</span><strong>{selected.stat}</strong></div>
                    <div><span>Status</span><strong>{unlockedDate(selected.unlockedAt)}</strong></div>
                  </div>
                  <div className={styles.referralStrip}><span>Try Fluxora Premium free for 2 days</span><code>{selected.referralUrl}</code></div>
                </article>

                <aside className={styles.shareBox}>
                  <p className={styles.boxKicker}>Ready to post</p>
                  <h3>{selected.title}</h3>
                  <p className={styles.caption}>{selected.shareText}</p>
                  <div className={styles.actions}>
                    <button type="button" disabled={exporting} onClick={() => share(selected)}>{exporting ? "Preparing PNG…" : "Share PNG card"}</button>
                    <button type="button" disabled={exporting} onClick={() => downloadCard(selected)}>Download PNG</button>
                    <button type="button" onClick={() => copyText(selected)}>Copy caption</button>
                    <button type="button" onClick={copyLink}>Copy referral link</button>
                  </div>
                  {notice && <p className={styles.notice}>{notice}</p>}
                  <p className={styles.note}>The exported 1080×1350 PNG is generated only for reward cards unlocked by the signed-in account. Sharing it does not change referral eligibility, rewards, or anti-abuse checks.</p>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
