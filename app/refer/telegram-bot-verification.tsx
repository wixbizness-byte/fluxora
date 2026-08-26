"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./telegram-bot-verification.module.css";

type ChallengeResponse = {
  gmail?: string;
  gmailVerified?: boolean;
  telegramVerified?: boolean;
  verificationCode?: string;
  expiresAt?: string;
  botUsername?: string;
  telegramUrl?: string;
  verification?: {
    telegramVerified?: boolean;
    status?: string;
    expiresAt?: string | null;
  } | null;
  error?: string;
};

export default function TelegramBotVerification({
  onVerified,
}: {
  onVerified: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [code, setCode] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const checkVerification = useCallback(async () => {
    if (!code) return;
    setChecking(true);
    try {
      const response = await fetch("/prompts/api/referrer-verification", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as ChallengeResponse;
      if (!response.ok) throw new Error(body.error || "Could not check Telegram verification.");

      if (body.verification?.telegramVerified || body.verification?.status === "completed") {
        setNotice("Telegram verified. Your referral account is ready.");
        setError("");
        await onVerified();
        return;
      }

      if (body.verification?.status === "expired") {
        setCode("");
        setTelegramUrl("");
        setExpiresAt("");
        setNotice("");
        setError("That verification code expired. Create a new code to continue.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check Telegram verification.");
    } finally {
      setChecking(false);
    }
  }, [code, onVerified]);

  useEffect(() => {
    if (!code) return;
    const onFocus = () => void checkVerification();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkVerification, code]);

  async function startVerification() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/prompts/api/referrer-verification", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as ChallengeResponse;
      if (!response.ok) throw new Error(body.error || "Could not create Telegram verification code.");

      if (body.telegramVerified) {
        await onVerified();
        return;
      }

      if (!body.verificationCode || !body.telegramUrl) {
        throw new Error("Telegram verification did not return a usable code.");
      }

      setCode(body.verificationCode);
      setTelegramUrl(body.telegramUrl);
      setExpiresAt(body.expiresAt || "");
      setNotice("Verification code created. Open the Telegram bot and tap Start.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create Telegram verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setNotice("Verification code copied.");
  }

  return (
    <div className={styles.box}>
      <strong>Verify with the Fluxora Telegram bot</strong>
      <small>
        Fluxora will link your Google-verified Gmail to the permanent Telegram numeric ID supplied directly by Telegram.
      </small>

      {(error || notice) && (
        <div className={error ? styles.inlineError : styles.inlineNotice}>
          {error || notice}
        </div>
      )}

      {!code ? (
        <button
          className={styles.primaryButton}
          type="button"
          disabled={busy}
          onClick={startVerification}
        >
          {busy ? "Creating code…" : "Create Telegram verification code"}
        </button>
      ) : (
        <>
          <div className={styles.verificationCode}>
            <span>One-time code</span>
            <strong>{code}</strong>
            <small>
              {expiresAt
                ? `Expires ${new Date(expiresAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`
                : "Expires in about 10 minutes"}
            </small>
          </div>

          <div className={styles.actions}>
            <a
              className={styles.primaryButton}
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Telegram Bot
            </a>
            <button className={styles.secondaryButton} type="button" onClick={copyCode}>
              Copy code
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={checking}
              onClick={() => void checkVerification()}
            >
              {checking ? "Checking…" : "Check verification"}
            </button>
          </div>

          <small>
            If the deep link does not pre-fill the code, send <strong>{code}</strong> to the bot manually. The code works once and expires automatically.
          </small>
        </>
      )}
    </div>
  );
}
