"use client";

import dynamic from "next/dynamic";
import { MemberOverview } from "./member-overview";
import MemberSectionTabs from "./member-section-tabs";

const MembersPortal = dynamic(() => import("../members/members-portal"));
const CommunityProfilePortal = dynamic(() => import("./community-profile-portal"));
const SmartExpiryRetentionPanel = dynamic(() => import("./smart-expiry-retention-panel"));
const ProgressHub = dynamic(() => import("./progress-hub"));
const MemberAdmin = dynamic(() => import("./member-admin"));

export default function MemberSections() {
  return (
    <MemberSectionTabs
      overview={<MemberOverview />}
      profile={
        <div id="community-profile">
          <CommunityProfilePortal />
        </div>
      }
      progress={<ProgressHub />}
      access={
        <div id="membership">
          <SmartExpiryRetentionPanel />
          <MembersPortal />
        </div>
      }
      admin={<MemberAdmin />}
    />
  );
}
