"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./member-section-tabs.module.css";

type Section = "profile" | "progress" | "membership";

type Props = {
  profile: ReactNode;
  progress: ReactNode;
  membership: ReactNode;
};

const sections: Array<{ id: Section; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "progress", label: "Progress" },
  { id: "membership", label: "Membership" },
];

function sectionFromLocation(): Section {
  if (typeof window === "undefined") return "profile";

  const requested = new URLSearchParams(window.location.search).get("section");
  if (requested === "profile" || requested === "progress" || requested === "membership") return requested;

  if (window.location.hash === "#community-profile") return "profile";
  if (window.location.hash === "#progress-hub") return "progress";
  if (window.location.hash === "#membership") return "membership";
  return "profile";
}

export default function MemberSectionTabs({ profile, progress, membership }: Props) {
  const [active, setActive] = useState<Section>("profile");

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

  const content = active === "profile" ? profile : active === "progress" ? progress : membership;

  return (
    <main className={styles.shell}>
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
              {section.label}
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
