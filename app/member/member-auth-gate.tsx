"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./member-auth-gate.module.css";

type GateState = "loading" | "ready" | "signed-out" | "error";

type MemberPortalResponse = {
  role?: "admin" | "member" | "free" | "none";
  email?: string;
  error?: string;
};

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
  const [message, setMessage] = useState("");
  const [loginUrl, setLoginUrl] = useState("/prompts/member-login?returnTo=%2Fmember&auto=1");

  const moveTo = useCallback((next: GateState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const check = useCallback(async (quiet = false) => {
    if (!quiet && stateRef.current !== "ready") moveTo("loading");
    setLoginUrl(loginHref());

    try {
      const response = await fetch("/prompts/api/member-portal", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as MemberPortalResponse;

      if (response.ok && (body.role === "member" || body.role === "admin" || body.role === "free")) {
        setMessage("");
        moveTo("ready");
        return;
      }

      if (response.status === 401) {
        setMessage("");
        moveTo("signed-out");
        return;
      }

      if (quiet && stateRef.current === "ready") return;
      throw new Error(body.error || "Could not verify your Fluxora session.");
    } catch (reason) {
      if (quiet && stateRef.current === "ready") return;
      setMessage(reason instanceof Error ? reason.message : "Could not verify your Fluxora session.");
      moveTo("error");
    }
  }, [moveTo]);

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
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check]);

  if (state === "ready") return <>{children}</>;

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