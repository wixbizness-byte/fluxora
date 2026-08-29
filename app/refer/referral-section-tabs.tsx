"use client";

import { useState } from "react";
import ReferralDeepLinkBuilder from "./referral-deep-link-builder";
import ShareableRewardsPanel from "./shareable-rewards-panel";
import ReferralTrustPanel from "./referral-trust-panel";
import MilestonesPanel from "./milestones-panel";
import ReferralTiersPanel from "./referral-tiers-panel";
import RewardWalletPanel from "./reward-wallet-panel";
import styles from "./referral-section-tabs.module.css";

type ReferralTab = "tools" | "rewards" | "rank";

const TABS: Array<{ id: ReferralTab; label: string }> = [
  { id: "tools", label: "Tools" },
  { id: "rewards", label: "Rewards" },
  { id: "rank", label: "Rank" },
];

export default function ReferralSectionTabs() {
  const [activeTab, setActiveTab] = useState<ReferralTab>("tools");

  return (
    <section className={styles.shell} aria-label="Referral dashboard sections">
      <div className={styles.tabs} role="tablist" aria-label="Referral dashboard">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`referral-tab-${tab.id}`}
            id={`referral-tab-button-${tab.id}`}
            className={activeTab === tab.id ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`referral-tab-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`referral-tab-button-${activeTab}`}
        className={styles.panel}
      >
        {activeTab === "tools" && (
          <>
            <ReferralDeepLinkBuilder />
            <ShareableRewardsPanel />
            <ReferralTrustPanel />
          </>
        )}

        {activeTab === "rewards" && (
          <>
            <MilestonesPanel />
            <div id="reward-wallet">
              <RewardWalletPanel />
            </div>
          </>
        )}

        {activeTab === "rank" && <ReferralTiersPanel />}
      </div>
    </section>
  );
}
