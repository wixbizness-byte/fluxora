"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./member-section-tabs.module.css";

type Section = "overview" | "progress" | "profile" | "access";

type Props = {
  overview: ReactNode;
  progress: ReactNode;
  profile: ReactNode;
  access: ReactNode;
};

const sections: Array<{ id: Section; label: string; note: string }> = [
  { id: "overview", label: "Overview", note: "Account at a glance" },
  { id: "progress", label: "Progress", note: "XP, missions & season" },
  { id: "profile", label: "Profile", note: "Creator identity" },
  { id: "access", label: "Access", note: "Membership & devices" },
];

function sectionFromLocation(): Section {
  if (typeof window === "undefined") return "overview";

  const requested = new URLSearchParams(window.location.search).get("section");
  if (requested === "overview" || requested === "progress" || requested === "profile" || requested === "access") return requested;
  if (requested === "membership") return "access";

  if (window.location.hash === "#community-profile") return "profile";
  if (window.location.hash === "#progress-hub") return "progress";
  if (window.location.hash === "#membership") return "access";
  return "overview";
}

export default function MemberSectionTabs({ overview, progress, profile, access }: Props) {
  const [active, setActive] = useState<Section>("overview");

  useEffect(() => {
    const sync = () => {
      const next = sectionFromLocation();
      setActive(next);

      if (window.location.hash === "#community-profile") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            document.getElementById("community-profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    };

    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  function select(next: Section) {
    if (next === active) return;
    setActive(next);

    const url = new URL(window.location.href);
    url.searchParams.set("section", next);
    url.hash = "";
    window.history.pushState({}, "", url);

    window.requestAnimationFrame(() => {
      document.getElementById("member-section-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const content = active === "overview" ? overview : active === "progress" ? progress : active === "profile" ? profile : access;

  return (
    <main className={styles.shell}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Fluxora member hub</p>
        <h1>Everything about your Fluxora account, in one place.</h1>
        <p>Manage your access, progress, creator profile, rewards, and the next useful thing to do.</p>
      </section>

      <div className={styles.navWrap} id="member-section-tabs">
        <nav className={styles.tabs} role="tablist" aria-label="Member sections">
          {sections.map((section) => (
            <button
              key={section.id}
              id={`${section.id}-tab`}
              type="button"
              role="tab"
              aria-selected={active === section.id}
              aria-controls="member-section-panel"
              className={`${styles.tab} ${active === section.id ? styles.active : ""}`}
              onClick={() => select(section.id)}
            >
              <strong>{section.label}</strong>
              <span>{section.note}</span>
            </button>
          ))}
        </nav>
      </div>

      <section
        id="member-section-panel"
        className={styles.panel}
        role="tabpanel"
        aria-labelledby={`${active}-tab`}
      >
        {content}
      </section>
    </main>
  );
}
