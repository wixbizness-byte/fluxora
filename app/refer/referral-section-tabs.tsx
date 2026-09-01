"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { PageContainer } from "../components/fluxora";
import ReferClient from "./refer-client";
import ReferralDeepLinkBuilder from "./referral-deep-link-builder";
import ShareableRewardsPanel from "./shareable-rewards-panel";
import MilestonesPanel from "./milestones-panel";
import ReferralTiersPanel from "./referral-tiers-panel";
import RewardWalletPanel from "./reward-wallet-panel";
import styles from "./referral-section-tabs.module.css";

type ReferralTab = "rewards" | "tools" | "ranks";

const TABS: Array<{ id: ReferralTab; label: string }> = [
  { id: "rewards", label: "Rewards" },
  { id: "tools", label: "Tools" },
  { id: "ranks", label: "Ranks" },
];

export default function ReferralSectionTabs() {
  const [activeTab, setActiveTab] = useState<ReferralTab>("rewards");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectTab(index: number) {
    const next = TABS[index];
    if (!next) return;
    setActiveTab(next.id);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab((index + 1) % TABS.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab((index - 1 + TABS.length) % TABS.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(TABS.length - 1);
    }
  }

  return (
    <section className={styles.shell} aria-label="Referral dashboard">
      <div className={styles.tabsWrap}>
        <PageContainer>
          <div className={styles.tabs} role="tablist" aria-label="Referral dashboard">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`referral-tab-${tab.id}`}
                id={`referral-tab-button-${tab.id}`}
                className={activeTab === tab.id ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </PageContainer>
      </div>

      <div
        id={`referral-tab-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`referral-tab-button-${activeTab}`}
        className={styles.panel}
        tabIndex={0}
      >
        {activeTab === "rewards" && (
          <>
            <ReferClient showRecentActivity={false} />
            <div id="reward-wallet">
              <RewardWalletPanel />
            </div>
            <MilestonesPanel />
          </>
        )}

        {activeTab === "tools" && (
          <>
            <ReferralDeepLinkBuilder />
            <ShareableRewardsPanel />
          </>
        )}

        {activeTab === "ranks" && <ReferralTiersPanel />}
      </div>
    </section>
  );
}
