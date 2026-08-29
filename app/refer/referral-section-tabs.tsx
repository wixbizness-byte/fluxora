"use client";

import { useState } from "react";
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

  return (
    <main className={styles.shell}>
      <div className={styles.tabsWrap}>
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
      </div>

      <div
        id={`referral-tab-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`referral-tab-button-${activeTab}`}
        className={styles.panel}
      >
        {activeTab === "rewards" && (
          <>
            <div id="reward-wallet">
              <RewardWalletPanel />
            </div>
            <div className={styles.dashboardHost}>
              <ReferClient />
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
    </main>
  );
}
