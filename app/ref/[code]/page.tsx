import { notFound } from "next/navigation";
import ReferralClaimClient from "./referral-claim-client";

export const dynamic = "force-dynamic";

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
    <ReferralClaimClient
      code={referralCode}
      attribution={attribution}
      tool={tool}
      shouldClaim={shouldClaim}
    />
  );
}
