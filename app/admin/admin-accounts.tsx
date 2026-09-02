"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getSession, queryOne, type SupabaseSession } from "../lib/supabase";
import styles from "./admin.module.css";

type AdminAccount = {
  user_id: string;
  email: string;
  created_at: string;
};

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<{ data: T | null; error: string }> {
  const { url, key } = getConfig();
  if (!url || !key) return { data: null, error: "Supabase is not configured." };

  const session = await getSession();
  if (!session) return { data: null, error: "Your admin session has expired. Sign in again." };

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const payload = await response.json();
      return { data: null, error: payload?.message || payload?.error || `Request failed (${response.status})` };
    } catch {
      return { data: null, error: `Request failed (${response.status})` };
    }
  }

  const text = await response.text();
  return { data: (text ? JSON.parse(text) : null) as T, error: "" };
}

function formatAdded(value: string) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export default function AdminAccounts() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const currentUserId = session?.user.id || "";
  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.email.localeCompare(b.email)),
    [accounts],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const activeSession = await getSession();
      if (cancelled) return;
      setSession(activeSession);

      if (!activeSession) {
        setChecking(false);
        return;
      }

      const adminCheck = await queryOne<{ user_id: string }>(
        "site_admins",
        `select=user_id&user_id=eq.${encodeURIComponent(activeSession.user.id)}`,
        true,
      );
      if (cancelled) return;

      const isAdmin = Boolean(adminCheck.data) && !adminCheck.error;
      setAuthorized(isAdmin);
      if (!isAdmin) {
        setChecking(false);
        return;
      }

      const result = await rpc<AdminAccount[]>("list_site_admin_accounts", {});
      if (cancelled) return;
      if (result.error) setNotice(result.error);
      else setAccounts(result.data || []);
      setChecking(false);
    }

    initialize().catch((cause) => {
      if (!cancelled) {
        setNotice(cause instanceof Error ? cause.message : "Could not load admin accounts.");
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshAccounts() {
    const result = await rpc<AdminAccount[]>("list_site_admin_accounts", {});
    if (result.error) setNotice(result.error);
    else setAccounts(result.data || []);
  }

  async function addAdmin(event: FormEvent) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    setBusy(true);
    setNotice("Adding admin…");
    const result = await rpc<AdminAccount[]>("add_site_admin_by_email", { input_email: normalized });
    if (result.error) {
      setNotice(result.error);
    } else {
      setEmail("");
      setNotice(`${normalized} now has admin access.`);
      await refreshAccounts();
    }
    setBusy(false);
  }

  async function removeAdmin(account: AdminAccount) {
    const self = account.user_id === currentUserId;
    const warning = self
      ? `Remove your own admin access for ${account.email}? You will lose access to this panel after signing out or refreshing.`
      : `Remove admin access for ${account.email}?`;
    if (!window.confirm(warning)) return;

    setBusy(true);
    setNotice("Removing admin…");
    const result = await rpc<boolean>("remove_site_admin", { input_user_id: account.user_id });
    if (result.error) {
      setNotice(result.error);
    } else {
      setNotice(`${account.email} no longer has admin access.`);
      await refreshAccounts();
    }
    setBusy(false);
  }

  if (checking) {
    return (
      <section className={styles.authState} aria-live="polite" aria-busy="true">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Admin Accounts</span>
          <h1>Checking admin access</h1>
          <p>Verifying your current Fluxora Admin session…</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className={styles.authState} aria-labelledby="accounts-login-heading">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Protected workspace</span>
          <h1 id="accounts-login-heading">Admin Accounts</h1>
          <p>Sign in through the Fluxora Admin page first.</p>
          <a className={styles.primaryAction} href="/admin">Go to Admin Login</a>
        </div>
      </section>
    );
  }

  if (!authorized) {
    return (
      <section className={styles.authState} aria-labelledby="accounts-not-authorized-heading">
        <div className={styles.emptyState}>
          <span className={styles.kicker}>Restricted</span>
          <h1 id="accounts-not-authorized-heading">Not authorized</h1>
          <p>Your Google account is not listed as a Fluxora admin.</p>
          <a className={styles.secondaryAction} href="/admin">Back to Admin</a>
        </div>
      </section>
    );
  }

  const noticeIsBusy = notice === "Adding admin…" || notice === "Removing admin…";
  const noticeIsSuccess = notice.endsWith("now has admin access.") || notice.endsWith("no longer has admin access.");
  const noticeIsError = Boolean(notice) && !noticeIsBusy && !noticeIsSuccess;

  return (
    <div className={styles.adminWorkspace}>
      <section className={styles.adminIntro} aria-labelledby="admin-accounts-heading">
        <div>
          <span className={styles.kicker}>Admin</span>
          <h1 id="admin-accounts-heading">Admin Accounts</h1>
          <p>Manage Google accounts authorized to access Fluxora Admin.</p>
          <span className={styles.accountLine}>{session.user.email}</span>
        </div>
      </section>

      <section className={styles.settingsCard} aria-labelledby="authorize-admin-heading">
        <div>
          <span className={styles.kicker}>Authorize administrator</span>
          <h2 id="authorize-admin-heading">Add an administrator</h2>
          <p>The Gmail must have signed in to Fluxora at least once so it already exists in Supabase Auth.</p>
        </div>
        <form className={styles.settingsFields} onSubmit={addAdmin}>
          <label className={styles.fullField}>
            Gmail address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@gmail.com"
              required
              disabled={busy}
            />
          </label>
          <button className={styles.primaryAction} type="submit" disabled={busy}>{busy ? "Working…" : "Add Admin"}</button>
        </form>
      </section>

      <p
        className={`${styles.notice} ${noticeIsError ? styles.noticeError : ""} ${noticeIsSuccess ? styles.noticeSuccess : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice}
      </p>

      <section className={styles.editorHeader} aria-labelledby="authorized-accounts-heading">
        <div>
          <span className={styles.kicker}>Authorized accounts</span>
          <h2 id="authorized-accounts-heading">{accounts.length} Admin{accounts.length === 1 ? "" : "s"}</h2>
          <p>Removing an account revokes its admin access immediately. The last remaining admin cannot be removed.</p>
        </div>
      </section>

      <section className={styles.accountGrid} aria-label="Authorized Fluxora administrators">
        {sortedAccounts.map((account) => (
          <article className={styles.accountCard} key={account.user_id}>
            <div className={styles.accountCardHeader}>
              <div>
                <span className={styles.accountRole}>{account.user_id === currentUserId ? "Current account" : "Administrator"}</span>
                <strong>{account.email || "Email unavailable"}</strong>
              </div>
            </div>
            <p className={styles.accountMeta}>Added {formatAdded(account.created_at)}</p>
            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busy || accounts.length <= 1}
                onClick={() => removeAdmin(account)}
              >
                Remove Admin
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
