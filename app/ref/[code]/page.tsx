import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer, SiteFooter, SiteHeader } from "../../components/fluxora";
import ReferralClaimClient from "./referral-claim-client";
import styles from "./referral-claim.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referral Invite | Fluxora",
  description: "Open your Fluxora referral invite and continue to your eligible Premium trial.",
};

const NAV_LINKS = [
  { href: "/start", label: "Guide" },
  { href: "/prompts", label: "Prompts" },
  { href: "/tools", label: "Tools" },
  { href: "/member", label: "Member" },
];

const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: "/pricing", label: "Pricing" },
];

function cleanCode(value: unknown) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : "";
}

function cleanAttribution(value: unknown) {
  const token = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
    ? token
    : "";
}

function cleanTool(value: unknown) {
  const tool = String(value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(tool) ? tool : "";
}

export default async function ReferralInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const referralCode = cleanCode(code);
  if (!referralCode) notFound();

  const attribution = cleanAttribution(query.attribution);
  const tool = cleanTool(query.tool);
  const shouldClaim = String(query.claim || "") === "1" && Boolean(attribution);

  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={NAV_LINKS}
        cta={{ href: "/refer", label: "Refer & Earn" }}
      />

      <main className={styles.main}>
        <PageContainer>
          <ReferralClaimClient
            code={referralCode}
            attribution={attribution}
            tool={tool}
            shouldClaim={shouldClaim}
          />
        </PageContainer>
      </main>

      <SiteFooter links={FOOTER_LINKS} meta="© 2026 Fluxora" />
    </div>
  );
}
