"use client";

import MemberManager from "./member-manager";
import MemberResourceAccessAdmin from "./member-resource-access-admin";
import AffiliateAdmin from "./affiliate-admin";
import TrialAdmin from "./trial-admin";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import ProgressionFeatureControls from "./progression-feature-controls";
import styles from "./member-admin.module.css";

export default function MemberAdmin() {
  return (
    <section className={styles.shell} aria-labelledby="member-admin-heading">
      <header className={styles.header}>
        <p className={styles.kicker}>Fluxora administration</p>
        <h2 id="member-admin-heading">Admin</h2>
        <p>Manage members, referrals, access analytics, resource usage, and trial administration from one protected workspace.</p>
      </header>
      <MemberManager />
      <div id="member-access-admin" className={styles.shortcutTarget}>
        <MemberResourceAccessAdmin />
      </div>
      <div id="tool-access-admin" className={`${styles.analyticsGrid} ${styles.shortcutTarget}`}>
        <ResourceUsagePortal />
        <ActiveAccessPortal />
      </div>
      <AffiliateAdmin />
      <div id="custom-trial-links-admin" className={styles.shortcutTarget}>
        <TrialAdmin />
      </div>
      <ProgressionFeatureControls />
    </section>
  );
}
