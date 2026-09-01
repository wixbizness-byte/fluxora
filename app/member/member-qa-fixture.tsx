"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { PageContainer } from "../components/fluxora";
import MemberSectionTabs from "./member-section-tabs";
import { MemberAccountHero, MemberFixtureOverviewProvider, MemberOverview } from "./member-overview";
import styles from "./member-qa-fixture.module.css";

function FixturePanel({ title, description }: { title: string; description: string }) {
  return <section className={styles.placeholder}>
    <p className={styles.placeholderKicker}>QA fixture</p>
    <h2>{title}</h2>
    <p>{description}</p>
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
      profile={<FixturePanel title="Profile stays protected." description="The production profile editor is deliberately not loaded in this visual fixture." />}
      progress={<FixturePanel title="Progress stays protected." description="The live progression system is not queried by this QA route." />}
      access={<FixturePanel title="Access stays protected." description="No membership records, codes, devices, or entitlement controls are available here." />}
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

  if (!resolved) return <section className={styles.checking} aria-live="polite">Preparing Member Hub…</section>;
  return showFixture ? <MemberQaFixture /> : <>{children}</>;
}
