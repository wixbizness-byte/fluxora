"use client";

import { useEffect, useState } from "react";
import AdminClient from "./admin-client";
import { getSession, isSupabaseConfigured, type SupabaseSession } from "../lib/supabase";
import styles from "./admin.module.css";

const SESSION_KEY = "fluxora-supabase-session";

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function consumeGoogleOAuthRedirect(): Promise<{ session: SupabaseSession | null; error: string }> {
  if (typeof window === "undefined" || !window.location.hash) return { session: null, error: "" };

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const oauthError = params.get("error_description") || params.get("error") || "";
  const accessToken = params.get("access_token") || "";
  const refreshToken = params.get("refresh_token") || "";
  const expiresIn = Number(params.get("expires_in") || 3600);
  const tokenType = params.get("token_type") || "bearer";

  if (oauthError) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    return { session: null, error: oauthError };
  }

  if (!accessToken) return { session: null, error: "" };

  const { url, key } = getConfig();
  if (!url || !key) return { session: null, error: "Supabase environment variables are missing." };

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { session: null, error: "Google sign-in completed, but the Supabase user session could not be loaded." };
  }

  const user = await response.json();
  const session: SupabaseSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: tokenType,
    user: {
      id: String(user.id || ""),
      email: String(user.email || ""),
    },
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return { session, error: "" };
}

export default function GoogleAdminGate() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setReady(true);
        return;
      }

      const oauth = await consumeGoogleOAuthRedirect();
      if (cancelled) return;
      if (oauth.error) setError(oauth.error);
      if (oauth.session) {
        setHasSession(true);
        setReady(true);
        return;
      }

      const existing = await getSession();
      if (cancelled) return;
      setHasSession(Boolean(existing));
      setReady(true);
    }

    initialize().catch((cause) => {
      if (!cancelled) {
        setError(cause instanceof Error ? cause.message : "Could not initialize Google sign-in.");
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function loginWithGoogle() {
    const { url } = getConfig();
    if (!url) {
      setError("Supabase is not configured.");
      return;
    }

    const authorize = new URL(`${url}/auth/v1/authorize`);
    authorize.searchParams.set("provider", "google");
    authorize.searchParams.set("redirect_to", `${window.location.origin}/admin`);
    window.location.assign(authorize.toString());
  }

  if (!ready) {
    return <main className={styles.adminPage}><section className={styles.emptyState}><p>Checking access…</p></section></main>;
  }

  if (hasSession) {
    return (
      <>
        <a
          href="/admin/accounts"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1000,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 42,
            padding: "0 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.18)",
            background: "#7a1d3c",
            color: "#fff7f3",
            boxShadow: "0 14px 35px rgba(0,0,0,.3)",
            fontSize: ".72rem",
            fontWeight: 800,
            letterSpacing: ".06em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          Admin Accounts
        </a>
        <AdminClient />
      </>
    );
  }

  return (
    <main className={styles.adminPage}>
      <section className={styles.loginCard}>
        <a className={styles.backLink} href="/">Back to Fluxora</a>
        <span className={styles.kicker}>Protected workspace</span>
        <h1>Fluxora Admin</h1>
        <p>Sign in with the authorized Google account. Access is still restricted by the existing <code>site_admins</code> table.</p>
        {error && <p className={styles.error}>{error}</p>}
        <button type="button" onClick={loginWithGoogle}>Sign in with Google</button>
      </section>
    </main>
  );
}
