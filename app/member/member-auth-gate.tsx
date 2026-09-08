"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRequestCoordinator } from "./request-coordinator";
import styles from "./member-auth-gate.module.css";

type GateState = "loading" | "ready" | "signed-out" | "error";

export type MemberPortalResponse = {
  role?: "admin" | "member" | "free" | "none";
  email?: string;
  member?: {
    tier?: string;
    status?: string;
    expires_at?: string | null;
    creator_preview_active?: boolean;
    creator_preview_expires_at?: string | null;
    effective_access?: string;
  };
  error?: string;
};

type MemberSessionContextValue = {
  account: MemberPortalResponse;
  refresh: (options?: { quiet?: boolean; supersede?: boolean }) => Promise<void>;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

export function useMemberSession() {
  const context = useContext(MemberSessionContext);
  if (!context) throw new Error("Member session must be used inside MemberAuthGate.");
  return context;
}

async function requestMemberPortal(signal: AbortSignal) {
  const response = await fetch("/prompts/api/member-portal", {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as MemberPortalResponse;
  return { ok: response.ok, status: response.status, body };
}

function currentReturnTo() {
  if (typeof window === "undefined") return "/member";
  return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/member";
}

function loginHref() {
  return `/prompts/member-login?returnTo=${encodeURIComponent(currentReturnTo())}&auto=1`;
}

export default function MemberAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const stateRef = useRef<GateState>("loading");
  const [account, setAccount] = useState<MemberPortalResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loginUrl, setLoginUrl] = useState("/prompts/member-login?returnTo=%2Fmember&auto=1");
  const [coordinator] = useState(() => createRequestCoordinator(requestMemberPortal));

  const moveTo = useCallback((next: GateState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const check = useCallback(async (quiet = false, supersede = false) => {
    if (!quiet && stateRef.current !== "ready") moveTo("loading");
    setLoginUrl(loginHref());

    const outcome = await coordinator.run({ supersede });
    if (!outcome.current) return;

    if (outcome.status === "fulfilled") {
      const { ok, status, body } = outcome.value;

      if (ok && (body.role === "member" || body.role === "admin" || body.role === "free")) {
        setAccount(body);
        setMessage("");
        moveTo("ready");
        return;
      }

      if (status === 401) {
        setAccount(null);
        setMessage("");
        moveTo("signed-out");
        return;
      }

      if (quiet && stateRef.current === "ready") return;
      setMessage(body.error || "Could not verify your Fluxora session.");
      moveTo("error");
      return;
    }

    if (quiet && stateRef.current === "ready") return;
    setMessage(outcome.reason instanceof Error ? outcome.reason.message : "Could not verify your Fluxora session.");
    moveTo("error");
  }, [coordinator, moveTo]);

  useEffect(() => {
    void check();

    const onFocus = () => void check(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check(true);
    };
    const interval = window.setInterval(() => void check(true), 120_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      coordinator.cancel();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check, coordinator]);

  const session = useMemo<MemberSessionContextValue | null>(() => account ? ({
    account,
    refresh: (options = {}) => check(options.quiet ?? true, options.supersede ?? false),
  }) : null, [account, check]);

  if (state === "ready" && session) {
    return <MemberSessionContext.Provider value={session}>{children}</MemberSessionContext.Provider>;
  }

  if (state === "loading") {
    return (
      <section className={styles.shell}>
        <section className={styles.card} aria-live="polite">
          <p className={styles.kicker}>Fluxora member</p>
          <h1>Checking your session…</h1>
          <p>Verifying your Google account.</p>
        </section>
      </section>
    );
  }

  if (state === "signed-out") {
    return (
      <section className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.kicker}>Fluxora member</p>
          <h1>Sign in to continue.</h1>
          <p>Your session is missing or has expired. Sign in again and Fluxora will return you to this member section.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href={loginUrl}>Continue with Google</a>
            <a className={styles.secondary} href="/">Back to Fluxora</a>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <section className={styles.card}>
        <p className={styles.kicker}>Connection problem</p>
        <h1>Couldn’t open the member hub.</h1>
        <p>{message || "Fluxora could not verify your session right now."}</p>
        <div className={styles.actions}>
          <button className={styles.retry} type="button" onClick={() => void check()}>Try again</button>
          <a className={styles.secondary} href="/">Back to Fluxora</a>
        </div>
      </section>
    </section>
  );
}
