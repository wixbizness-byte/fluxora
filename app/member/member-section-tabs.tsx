"use client";

import type { ReactNode } from "react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { useMemberIsAdmin } from "./member-overview";
import styles from "./member-section-tabs.module.css";

type Section = "overview" | "progress" | "profile" | "access" | "admin";

type Props = {
  overview: ReactNode;
  profile: ReactNode;
  progress: ReactNode;
  access: ReactNode;
  admin?: ReactNode;
};

const memberSections: Array<{ id: Exclude<Section, "admin">; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Progress" },
  { id: "profile", label: "Profile" },
  { id: "access", label: "Access" },
];

function sectionFromLocation(canManage: boolean): Section {
  if (typeof window === "undefined") return "overview";

  const requested = new URLSearchParams(window.location.search).get("section");
  if (requested === "overview" || requested === "profile" || requested === "progress" || requested === "access") return requested;
  if (requested === "admin") return canManage ? "admin" : "overview";
  if (requested === "membership") return "access";

  if (window.location.hash === "#community-profile") return "profile";
  if (window.location.hash === "#progress-hub") return "progress";
  if (window.location.hash === "#membership") return "access";
  return "overview";
}

function scrollToHashTarget() {
  const id = window.location.hash.slice(1);
  if (!id) return;
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function MemberSectionTabs({ overview, profile, progress, access, admin }: Props) {
  const [active, setActive] = useState<Section>("overview");
  const canManage = useMemberIsAdmin() && Boolean(admin);

  const sections = canManage && admin
    ? [...memberSections, { id: "admin" as const, label: "Admin" }]
    : memberSections;

  useEffect(() => {
    const sync = () => {
      const next = sectionFromLocation(canManage);
      setActive(next);
      scrollToHashTarget();
    };

    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [canManage]);

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

  function moveWithArrow(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + sections.length) % sections.length;
    const next = sections[nextIndex];
    select(next.id);
    document.getElementById(`${next.id}-tab`)?.focus();
  }

  const content = active === "overview" ? overview : active === "profile" ? profile : active === "progress" ? progress : active === "admin" && canManage ? admin : access;

  return (
    <section className={styles.shell}>
      <div className={styles.navWrap} id="member-section-tabs">
        <nav className={styles.tabs} role="tablist" aria-label="Member sections">
          {sections.map((section, index) => (
            <button
              key={section.id}
              id={`${section.id}-tab`}
              type="button"
              role="tab"
              aria-selected={active === section.id}
              aria-controls="member-section-panel"
              className={`${styles.tab} ${active === section.id ? styles.active : ""}`}
              onClick={() => select(section.id)}
              onKeyDown={(event) => moveWithArrow(event, index)}
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
    </section>
  );
}
