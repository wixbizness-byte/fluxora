"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import styles from "./member-auth-gate.module.css";

type GateState = "loading" | "ready" | "signed-out" | "no-membership" | "error";

type MemberPortalResponse = {
  role?: "admin" | "member" | "none";
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
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loginUrl, setLoginUrl] = useState("/prompts/member-login?returnTo=%2Fmember&auto=1");

  const check = useCallback(async (quiet = false) => {
    if (!quiet) setState((current) => current === "ready" ? current : "loading");
    setMessage("");
    setLoginUrl(loginHref());

    try {
      const response = await fetch("/prompts/api/member-portal", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as MemberPortalResponse;
      setEmail(String(body.email || ""));

      if (response.ok && (body.role === "member" || body.role === "admin")) {
        setState("ready");
        return;
      }

      if (response.status === 401) {
        setState("signed-out");
        return;
      }

      if (response.status === 403 || body.role === "none") {
        setMessage(body.error || "This Google account is not connected to a Fluxora membership.");
        setState("no-membership");
        return;
      }

      throw new Error(body.error || "Could not verify your Fluxora session.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not verify your Fluxora session.");
      setState("error");
    }
  }, []);

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
      <main className={styles.shell}>
        <section className={styles.card} aria-live="polite">
          <p className={styles.kicker}>Fluxora member</p>
          <h1>Checking your session…</h1>
          <p>Verifying your Google account and Fluxora membership.</p>
        </section>
      </main>
    );
  }

  if (state === "signed-out") {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.kicker}>Fluxora member</p>
          <h1>Sign in to continue.</h1>
          <p>Your session is missing or has expired. Sign in again and Fluxora will return you to this member section.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href={loginUrl}>Continue with Google</a>
            <a className={styles.secondary} href="/">Back to Fluxora</a>
          </div>
        </section>
      </main>
    );
  }

  if (state === "no-membership") {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.kicker}>Access required</p>
          <h1>No membership found.</h1>
          <p>{message}</p>
          {email ? <p className={styles.status}>Signed in as {email}</p> : null}
          <div className={styles.actions}>
            <a className={styles.primary} href={loginUrl}>Use another Google account</a>
            <a className={styles.secondary} href="/pricing">View Fluxora access</a>
            <a className={styles.secondary} href="/">Back to Fluxora</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <p className={styles.kicker}>Connection problem</p>
        <h1>Couldn’t open the member hub.</h1>
        <p>{message || "Fluxora could not verify your session right now."}</p>
        <div className={styles.actions}>
          <button className={styles.retry} type="button" onClick={() => void check()}>Try again</button>
          <a className={styles.secondary} href="/">Back to Fluxora</a>
        </div>
      </section>
    </main>
  );
}
