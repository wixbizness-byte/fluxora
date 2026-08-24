"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./first-win.module.css";

type FirstWinTool = {
  slug: string;
  title: string;
  description: string;
  toolType: string;
  accessLevel: string;
  launchUrl?: string;
};

type FirstWinGoal = {
  code: string;
  title: string;
  description: string;
  recommendedTool: FirstWinTool | null;
};

type FirstWin = {
  status: "not_started" | "recommended" | "launched" | "completed";
  goalCode: string | null;
  startedAt: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  verificationMethod: "verified_generation" | "user_confirmation" | null;
  memberTier: string | null;
  goals: FirstWinGoal[];
  recommendedTool: FirstWinTool | null;
};

type FirstWinResponse = {
  gmail?: string;
  firstWin?: FirstWin | null;
  message?: string;
  error?: string;
};

function cleanLaunchUrl(value: string | undefined) {
  return String(value || "").trim().replace(/["']+$/g, "");
}

export default function FirstWinPanel() {
  const [firstWin, setFirstWin] = useState<FirstWin | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/first-win", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setFirstWin(null);
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as FirstWinResponse;
      if (!response.ok) throw new Error(body.error || "Could not load your First Win.");
      setFirstWin(body.firstWin || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your First Win.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    if (firstWin?.status !== "launched") return;
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [firstWin?.status, load]);

  const selectedGoal = useMemo(
    () => firstWin?.goals.find((goal) => goal.code === firstWin.goalCode) || null,
    [firstWin]
  );

  async function post(action: string, goalCode?: string) {
    setBusy(action === "select" ? `select:${goalCode}` : action);
    setError("");
    try {
      const response = await fetch("/prompts/api/first-win", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, goalCode }),
      });
      const body = (await response.json().catch(() => ({}))) as FirstWinResponse;
      if (!response.ok) throw new Error(body.error || "Could not update your First Win.");
      if (body.firstWin) setFirstWin(body.firstWin);
      return body.firstWin || null;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update your First Win.");
      return null;
    } finally {
      setBusy("");
    }
  }

  async function launch() {
    const next = await post("launch");
    const launchUrl = cleanLaunchUrl(next?.recommendedTool?.launchUrl || firstWin?.recommendedTool?.launchUrl);
    if (!launchUrl) {
      setError("Fluxora could not find a launch URL for this tool.");
      return;
    }
    window.open(launchUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora First Win">
        <div className={styles.card}><p className={styles.loading}>Loading your First Win…</p></div>
      </section>
    );
  }

  if (!firstWin) return null;

  if (firstWin.status === "completed") {
    return (
      <section className={styles.shell} aria-labelledby="first-win-heading">
        <div className={`${styles.card} ${styles.completedCard}`}>
          <div className={styles.heading}>
            <div>
              <p className={styles.kicker}>First Win</p>
              <h2 id="first-win-heading">Your first creation is complete</h2>
              <p className={styles.copy}>
                {firstWin.verificationMethod === "verified_generation"
                  ? "Fluxora received a verified successful-generation signal from your selected tool."
                  : "You confirmed that you successfully created an output with your selected tool."}
              </p>
            </div>
            <div className={styles.winBadge}><span>✓</span><strong>First Win</strong></div>
          </div>
          {firstWin.recommendedTool && (
            <div className={styles.resultRow}>
              <div>
                <span className={styles.miniLabel}>Created with</span>
                <strong>{firstWin.recommendedTool.title}</strong>
                <small>{firstWin.recommendedTool.toolType} · {firstWin.recommendedTool.accessLevel}</small>
              </div>
              <a href="/">Explore more Fluxora tools</a>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.shell} aria-labelledby="first-win-heading">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>First Win</p>
            <h2 id="first-win-heading">
              {firstWin.status === "not_started" ? "What do you want to create first?" : "Create your first useful output"}
            </h2>
            <p className={styles.copy}>
              {firstWin.status === "not_started"
                ? "Pick an outcome. Fluxora will recommend the strongest tool your current access can use."
                : "Open the recommended tool, make one useful result, then come back here."}
            </p>
          </div>
          <div className={styles.tierPill}>{firstWin.memberTier || "Free"} access</div>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {firstWin.status === "not_started" ? (
          <div className={styles.goalGrid}>
            {firstWin.goals.map((goal) => (
              <button
                className={styles.goal}
                type="button"
                key={goal.code}
                onClick={() => void post("select", goal.code)}
                disabled={busy === `select:${goal.code}`}
              >
                <span className={styles.goalTitle}>{goal.title}</span>
                <span className={styles.goalDescription}>{goal.description}</span>
                {goal.recommendedTool && (
                  <span className={styles.recommendation}>Recommended: {goal.recommendedTool.title}</span>
                )}
                <strong>{busy === `select:${goal.code}` ? "Choosing…" : "Choose this goal"}</strong>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.recommended}>
            <div className={styles.recommendedCopy}>
              <span className={styles.miniLabel}>Your goal</span>
              <h3>{selectedGoal?.title || "First creation"}</h3>
              {firstWin.recommendedTool && (
                <>
                  <span className={styles.miniLabel}>Recommended tool</span>
                  <strong className={styles.toolName}>{firstWin.recommendedTool.title}</strong>
                  <p>{firstWin.recommendedTool.description}</p>
                  <div className={styles.tags}>
                    <span>{firstWin.recommendedTool.toolType}</span>
                    <span>{firstWin.recommendedTool.accessLevel}</span>
                  </div>
                </>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.primary} type="button" onClick={() => void launch()} disabled={busy === "launch"}>
                {busy === "launch" ? "Opening…" : firstWin.status === "launched" ? "Open tool again" : "Open recommended tool"}
              </button>
              {firstWin.status === "launched" && (
                <button type="button" onClick={() => void post("confirm")} disabled={busy === "confirm"}>
                  {busy === "confirm" ? "Confirming…" : "I created an output"}
                </button>
              )}
              <button className={styles.linkButton} type="button" onClick={() => setFirstWin({ ...firstWin, status: "not_started", goalCode: null, recommendedTool: null })}>
                Change goal
              </button>
            </div>
          </div>
        )}

        {firstWin.status === "launched" && (
          <div className={styles.waiting}>
            <strong>Tool opened.</strong>
            <span>
              If this tool reports successful generations to Fluxora, this card completes automatically. Otherwise, use “I created an output” after you have a real result.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
