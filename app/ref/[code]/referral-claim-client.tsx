"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card } from "../../components/fluxora";
import ReferralProductPreview from "../../refer/referral-product-preview";
import styles from "./referral-claim.module.css";

type ReferralTarget = {
  key: string;
  title: string;
  description: string;
  href: string;
  toolType: string;
  accessLevel: string;
  imageUrl?: string | null;
};

type Invite = {
  attributionToken: string;
  referralCode: string;
  inviter?: { name?: string | null; username?: string | null };
  trialDays?: number;
  tool?: string | null;
  target?: ReferralTarget | null;
};

type ClaimResponse = {
  success?: boolean;
  result?: string;
  message?: string;
  error?: string;
  referrerRewardApplied?: boolean;
  tool?: string | null;
  target?: ReferralTarget | null;
  member?: {
    id: string;
    accessCode: string;
    gmail: string;
    tier: string;
    expiresAt: string | null;
  } | null;
};

function validAttribution(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validTool(value: string) {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

export default function ReferralClaimClient({
  code,
  attribution,
  tool,
  shouldClaim,
}: {
  code: string;
  attribution: string;
  tool: string;
  shouldClaim: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const started = useRef(false);

  const activeAttribution = useMemo(
    () => (validAttribution(attribution) ? attribution : invite?.attributionToken || ""),
    [attribution, invite]
  );
  const target = claim?.target || invite?.target || null;

  async function createAttribution() {
    const response = await fetch("/prompts/api/referral-attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, tool }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as Invite & { error?: string };
    if (!response.ok) throw new Error(body.error || "This referral invitation could not be opened.");
    setInvite(body);
    return body.attributionToken;
  }

  async function loadAttribution(token: string) {
    const params = new URLSearchParams({ attribution: token });
    const response = await fetch(`/prompts/api/referral-attribution?${params.toString()}`, {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as Invite & { error?: string };
    if (!response.ok) throw new Error(body.error || "This referral invitation could not be reopened.");
    setInvite(body);
    return body;
  }

  async function claimTrial(token: string) {
    setClaiming(true);
    setError("");
    const response = await fetch("/prompts/api/referral-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributionToken: token }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ClaimResponse;

    if (response.status === 401) {
      window.location.href = loginUrl(token);
      return;
    }

    setClaim(body);
    if (!response.ok) setError(body.message || body.error || "This referral trial could not be claimed.");
    setClaiming(false);
  }

  function loginUrl(token: string) {
    const params = new URLSearchParams({ mode: "claim", ref: code, attribution: token });
    const targetTool = invite?.tool || (validTool(tool) ? tool : "");
    if (targetTool) params.set("tool", targetTool);
    return `/prompts/referrer-login?${params.toString()}`;
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (shouldClaim && validAttribution(attribution)) {
          await loadAttribution(attribution);
          setLoading(false);
          await claimTrial(attribution);
          return;
        }
        await createAttribution();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load this referral invitation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [attribution, code, shouldClaim, tool]);

  async function copyCode() {
    const value = claim?.member?.accessCode || "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setNotice("Access code copied.");
  }

  if (loading || claiming) {
    return (
      <section className={styles.workspace} aria-live="polite" aria-busy="true">
        <Card elevated className={styles.stateCard}>
          <div className={styles.stateHeader}>
            <span className={styles.stateIcon} aria-hidden="true">
              <LoaderCircle className={styles.spinner} size={22} strokeWidth={2} />
            </span>
            <Badge variant="brand">Referral Invite</Badge>
            <h1>{claiming ? "Activating your access…" : "Opening your invite…"}</h1>
            <p className={styles.muted}>Securely verifying the referral before continuing.</p>
          </div>
        </Card>
      </section>
    );
  }

  if (claim?.success && claim.member) {
    return (
      <section className={styles.workspace} aria-labelledby="referral-success-heading">
        <Card elevated className={styles.stateCard}>
          <div className={styles.stateHeader}>
            <span className={`${styles.stateIcon} ${styles.successIcon}`} aria-hidden="true">
              <CheckCircle2 size={22} strokeWidth={2} />
            </span>
            <Badge variant="success">2-DAY PREMIUM UNLOCKED</Badge>
            <h1 id="referral-success-heading">Your Fluxora access is active.</h1>
            <p className={styles.lead}>
              You received <strong>2 days of Premium access</strong>. Your referrer also earned their referral reward.
            </p>
          </div>

          {target && (
            <div className={styles.targetCard}>
              <span className={styles.targetLabel}>Your referral destination</span>
              <strong>{target.title}</strong>
              <p>{target.description}</p>
              <small>{target.toolType} · {target.accessLevel}</small>
            </div>
          )}

          <div className={styles.codeBox}>
            <div className={styles.codeHeader}>
              <span>Your access code</span>
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={2} />
            </div>
            <code className={styles.codeValue}>{claim.member.accessCode}</code>
            <p className={styles.memberMeta}>
              {claim.member.gmail} · expires {claim.member.expiresAt ? new Date(claim.member.expiresAt).toLocaleString() : "later"}
            </p>
            <Button type="button" variant="secondary" onClick={copyCode} className={styles.copyButton}>
              <Copy aria-hidden="true" size={15} strokeWidth={2} />
              Copy access code
            </Button>
          </div>

          <p className={styles.notice} role="status" aria-live="polite">
            {notice}
          </p>

          <div className={styles.actions}>
            <Button href={target?.href || "/tools"} fullWidth>
              {target ? `Open ${target.title}` : "Explore Fluxora Tools"}
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
            </Button>
            <Button href="/refer" variant="secondary" fullWidth>
              Get My Referral Link
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.workspace} aria-labelledby="referral-error-heading">
        <Card elevated className={styles.stateCard}>
          <div className={styles.stateHeader}>
            <span className={`${styles.stateIcon} ${styles.dangerIcon}`} aria-hidden="true">
              <TriangleAlert size={22} strokeWidth={2} />
            </span>
            <Badge variant="danger">Referral Invite</Badge>
            <h1 id="referral-error-heading">This trial can’t be claimed.</h1>
          </div>

          <div className={styles.errorPanel} role="alert">
            {error}
          </div>
          <p className={styles.muted}>
            Referral trials are limited to eligible accounts and can’t be stacked with an already-used Fluxora free trial or active membership.
          </p>
          <div className={styles.actions}>
            <Button href={target?.href || "/"} fullWidth>
              {target ? `View ${target.title}` : "Explore Fluxora"}
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
            </Button>
            <Button href="/refer" variant="secondary" fullWidth>
              Refer & Earn
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  const token = activeAttribution;
  const inviter = invite?.inviter?.username
    ? `@${invite.inviter.username}`
    : invite?.inviter?.name || "a Fluxora user";
  const primaryLabel = target ? `Continue to ${target.title}` : "Claim My 2-Day Trial";

  return (
    <section className={styles.workspace} aria-labelledby="referral-offer-heading">
      <Card elevated className={styles.stateCard}>
        <div className={styles.stateHeader}>
          <Badge variant="brand">Referral Invite</Badge>
          <p className={styles.invitedBy}>Invited by {inviter}</p>
          <h1 id="referral-offer-heading">
            {target ? `Try ${target.title} with Fluxora.` : "Unlock Fluxora Premium for 2 days."}
          </h1>
          <p className={styles.lead}>
            {target ? target.description : "Your referral invite includes a 2-day Premium trial."}{" "}
            <strong>No payment is required.</strong>
          </p>
        </div>

        {target && (
          <>
            <div className={styles.targetCard}>
              <span className={styles.targetLabel}>Referral destination</span>
              <strong>{target.title}</strong>
              <p>Your referral attribution stays attached while you continue through Google verification and trial signup.</p>
              <small>{target.toolType} · {target.accessLevel}</small>
            </div>
            <div className={styles.previewWrap}>
              <ReferralProductPreview
                targetKey={target.key}
                title={target.title}
                description={target.description}
              />
            </div>
          </>
        )}

        <div className={styles.perks} aria-label="Referral trial benefits">
          <div className={styles.perk}>
            <Clock3 className={styles.perkIcon} aria-hidden="true" size={18} strokeWidth={2} />
            <strong>2 Days</strong>
            <span>Premium access</span>
          </div>
          <div className={styles.perk}>
            <ShieldCheck className={styles.perkIcon} aria-hidden="true" size={18} strokeWidth={2} />
            <strong>Free</strong>
            <span>No payment required</span>
          </div>
          <div className={styles.perk}>
            <Gift className={styles.perkIcon} aria-hidden="true" size={18} strokeWidth={2} />
            <strong>+2 Days</strong>
            <span>Your referrer earns too</span>
          </div>
        </div>

        {token ? (
          <Button href={loginUrl(token)} fullWidth className={styles.primaryCta}>
            {primaryLabel}
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
          </Button>
        ) : (
          <Button type="button" disabled aria-disabled="true" fullWidth className={styles.primaryCta}>
            {primaryLabel}
          </Button>
        )}
      </Card>
    </section>
  );
}
