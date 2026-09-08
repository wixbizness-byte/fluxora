"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadNextBestActionDecision } from "./next-best-action-loader";
import { createRequestCoordinator } from "./request-coordinator";
import styles from "./next-best-action.module.css";

type RecommendedTool = {
  slug?: string;
  title?: string;
  description?: string;
  toolType?: string;
  accessLevel?: string;
};

type Milestone = {
  threshold?: number;
  bonusDays?: number;
  remaining?: number;
};

type NextAction = {
  code: string;
  category: string;
  priority: number;
  title: string;
  description: string;
  cta: string;
  href: string;
  reason: string;
  walletDays?: number;
  expiresAt?: string;
  progress?: { completed?: number; required?: number };
  tool?: RecommendedTool;
  milestone?: Milestone;
};

type NextBestAction = {
  action: NextAction;
  signals: {
    starterComplete?: boolean;
    firstWinComplete?: boolean;
    memberActive?: boolean;
    memberTier?: string | null;
    memberStatus?: string | null;
    expiresAt?: string | null;
    expiryHours?: number | null;
    isTrial?: boolean;
    walletDays?: number;
    referrer?: boolean;
    nextMilestoneRemaining?: number | null;
  };
  generatedAt?: string;
};

const categoryLabels: Record<string, string> = {
  access: "Access",
  onboarding: "Onboarding",
  activation: "First Win",
  trial: "Trial",
  referral: "Refer & Earn",
  discovery: "Discovery",
  wallet: "Rewards",
};

export default function NextBestActionPanel() {
  const [data, setData] = useState<NextBestAction | null>(null);
  const [retentionActive, setRetentionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coordinator] = useState(() => createRequestCoordinator((signal) => loadNextBestActionDecision<NextBestAction>(fetch, signal)));

  const load = useCallback(async () => {
    const outcome = await coordinator.run();
    if (!outcome.current) return;
    if (outcome.status === "rejected") {
      setError(outcome.reason instanceof Error ? outcome.reason.message : "Could not choose your next action.");
      setLoading(false);
      return;
    }

    const decision = outcome.value;
    if (decision.kind === "retention") {
      setRetentionActive(true);
      setData(null);
      setError("");
      setLoading(false);
      return;
    }
    setRetentionActive(false);
    if (decision.kind === "unauthorized") {
      setData(null);
      setError("");
    } else if (decision.kind === "error") {
      setError(decision.message);
    } else {
      setData(decision.data);
      setError("");
    }
    setLoading(false);
  }, [coordinator]);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      coordinator.cancel();
      window.removeEventListener("focus", onFocus);
    };
  }, [coordinator, load]);

  const context = useMemo(() => {
    const action = data?.action;
    if (!action) return [] as string[];
    const items: string[] = [];

    if (action.progress?.required) {
      items.push(`${action.progress.completed || 0}/${action.progress.required} Starter Journey`);
    }
    if (action.tool?.toolType) {
      items.push(`${action.tool.toolType}${action.tool.accessLevel ? ` · ${action.tool.accessLevel}` : ""}`);
    }
    if (action.milestone?.remaining) {
      items.push(`${action.milestone.remaining} to next milestone`);
    }
    if (Number(action.walletDays || 0) > 0) {
      items.push(`${action.walletDays} wallet ${Number(action.walletDays) === 1 ? "day" : "days"}`);
    }
    if (data?.signals.memberTier) {
      items.push(`${data.signals.memberTier} access`);
    }
    return items.slice(0, 3);
  }, [data]);

  if (retentionActive) return null;

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Next Best Action">
        <div className={styles.card}><p className={styles.loading}>Choosing your next best action…</p></div>
      </section>
    );
  }

  if (!data?.action) {
    return error ? (
      <section className={styles.shell} aria-label="Fluxora Next Best Action">
        <div className={styles.card}><p className={styles.error}>{error}</p></div>
      </section>
    ) : null;
  }

  const action = data.action;

  return (
    <section className={styles.shell} aria-labelledby="next-best-action-heading">
      <div className={styles.card}>
        <div className={styles.topline}>
          <div>
            <p className={styles.kicker}>What should I do next?</p>
            <span className={styles.category}>{categoryLabels[action.category] || "Recommended"}</span>
          </div>
          <span className={styles.smartLabel}>Based on your Fluxora progress</span>
        </div>

        <div className={styles.main}>
          <div className={styles.copy}>
            <h2 id="next-best-action-heading">{action.title}</h2>
            <p>{action.description}</p>
            {context.length > 0 && (
              <div className={styles.context} aria-label="Recommendation context">
                {context.map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </div>

          <div className={styles.actionBox}>
            <span>Recommended now</span>
            <a href={action.href}>{action.cta}</a>
            <button type="button" onClick={() => void load()}>Refresh recommendation</button>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </section>
  );
}
