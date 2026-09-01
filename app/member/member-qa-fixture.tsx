"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { PageContainer } from "../components/fluxora";
import MemberSectionTabs from "./member-section-tabs";
import { MemberAccountHero, MemberFixtureOverviewProvider, MemberOverview } from "./member-overview";
import CommunityProfilePortal from "./community-profile-portal";
import ProgressHub from "./progress-hub";
import styles from "./member-qa-fixture.module.css";

function AccessFixture() {
  return <section className={styles.accessFixture} aria-labelledby="qa-access-heading">
    <header><p className={styles.placeholderKicker}>Access Â· QA fixture</p><h2 id="qa-access-heading">Manage your membership, devices, access code, and available rewards.</h2><p>Preview-only data. Every action below is disabled and does not call a protected API.</p></header>
    <section className={styles.accessSummary}><article><span>Current access</span><strong>Premium</strong></article><article><span>Status</span><strong>Active</strong></article><article><span>Expires</span><strong>Sep 29, 2026</strong></article></section>
    <section className={styles.accessCard}><p className={styles.placeholderKicker}>Entitlements</p><div className={styles.entitlements}><div><strong>Creator content</strong><span>Available Â· QA Preview</span></div><div><strong>Premium workflows</strong><span>Available</span></div></div></section>
    <section className={styles.accessCard}><div className={styles.cardHeading}><div><p className={styles.placeholderKicker}>Devices</p><h3>Registered devices Â· 3 / 5</h3></div><button type="button" disabled>Clear all</button></div><div className={styles.deviceRows}><div><span><strong>Windows PC</strong><small>Chrome Â· Windows Â· Last active: Today</small></span><button type="button" disabled>Remove</button></div><div><span><strong>iPhone</strong><small>Safari Â· iOS Â· Last active: Yesterday</small></span><button type="button" disabled>Remove</button></div><div><span><strong>Tablet</strong><small>Safari Â· iPadOS Â· Last active: 3 days ago</small></span><button type="button" disabled>Remove</button></div></div><details><summary>How device tracking works</summary><p>Preview-only explanation of the existing tracking behavior.</p></details></section>
    <section className={styles.accessCard}><p className={styles.placeholderKicker}>Access code</p><div className={styles.codeRow}><code>â¢â¢â¢â¢â¢â¢â¢â¢</code><button type="button" disabled>Reveal</button><button type="button" disabled>Copy</button></div><p className={styles.warning}>Changing an access code disables the old code immediately. This QA control is disabled.</p><button type="button" className={styles.changeCode} disabled>Change access code</button></section>
    <section className={styles.retention}><p className={styles.placeholderKicker}>Available rewards</p><h3>3 reward days available</h3><p>Your Premium access is healthy. This compact QA surface represents the existing retention engine without loading or redeeming rewards.</p><div><button type="button" disabled>Use reward days</button><button type="button" disabled>See other options</button></div></section>
  </section>;
}

function MemberQaFixture() {
  return <MemberFixtureOverviewProvider>
    <PageContainer className={styles.fixtureTop}>
      <aside className={styles.notice} aria-label="QA-only visual fixture">
        <LockKeyhole size={17} aria-hidden="true" />
        <span><strong>QA-only member fixture</strong> Preview mock data only. It does not sign in, grant access, or call protected APIs.</span>
      </aside>
      <MemberAccountHero />
    </PageContainer>
    <MemberSectionTabs
      overview={<MemberOverview fixture />}
      profile={<CommunityProfilePortal fixture />}
      progress={<ProgressHub fixture />}
      access={<AccessFixture />}
    />
  </MemberFixtureOverviewProvider>;
}

export default function MemberQaFixtureGate({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [resolved, setResolved] = useState(false);
  const [showFixture, setShowFixture] = useState(false);

  useEffect(() => {
    setShowFixture(enabled && new URLSearchParams(window.location.search).get("qaMember") === "1");
    setResolved(true);
  }, [enabled]);

  if (!resolved) return <section className={styles.checking} aria-live="polite">Preparing Member Hubâ¦</section>;
  return showFixture ? <MemberQaFixture /> : <>{children}</>;
}
