import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferralInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const referralCode = String(code || "").trim().toUpperCase();

  if (!/^[A-Z0-9]{8}$/.test(referralCode)) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg,#fbf4ef,#f3e3e5)",
        color: "#4b1024",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(560px,100%)",
          padding: 30,
          border: "1px solid rgba(75,16,36,.14)",
          borderRadius: 24,
          background: "#fffaf7",
          boxShadow: "0 16px 36px rgba(75,16,36,.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            textTransform: "uppercase",
            letterSpacing: ".16em",
            fontSize: 11,
            fontWeight: 800,
            color: "#7c1d3d",
          }}
        >
          Fluxora referral invite
        </p>
        <h1 style={{ margin: "0 0 12px", fontFamily: "Georgia, serif", fontSize: 40 }}>
          You were invited to Fluxora.
        </h1>
        <p style={{ lineHeight: 1.65, color: "#8a6070" }}>
          Referral code <strong>{referralCode}</strong> is attached to this invite.
          The 2-day referral trial claim flow is activated in Phase 3.
        </p>
        <Link
          href="/"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 48,
            marginTop: 18,
            borderRadius: 999,
            background: "#7c1d3d",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Explore Fluxora
        </Link>
      </section>
    </main>
  );
}
