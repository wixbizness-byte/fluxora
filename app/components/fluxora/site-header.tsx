"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import styles from "./fluxora.module.css";

type HeaderLink = { href: string; label: string; target?: "_blank" | "_self" };
type SiteHeaderProps = { cta: HeaderLink; links: HeaderLink[]; brandHref?: string; brandLabel?: string; brandTarget?: "_blank" | "_self" };
export function SiteHeader({ brandHref = "/", brandLabel = "Fluxora", brandTarget, cta, links }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className={styles.siteHeader}>
    <div className={styles.siteHeaderInner}>
      <a className={styles.brand} href={brandHref} target={brandTarget} rel={brandTarget === "_blank" ? "noopener noreferrer" : undefined} aria-label={`${brandLabel} home`}><img className={styles.brandMark} src="/fluxora-logo.svg" alt="" width={28} height={28} /><span className={styles.brandLabel}>{brandLabel}</span></a>
      <button className={styles.headerMenuButton} type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
        {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
      </button>
      <nav className={[styles.headerNav, menuOpen ? styles.headerNavOpen : ""].filter(Boolean).join(" ")} aria-label="Primary navigation">
        {links.map((link) => <a className={styles.headerLink} href={link.href} key={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
        <a className={[styles.button, styles.buttonPrimary, styles.headerCta].join(" ")} href={cta.href} target={cta.target} rel={cta.target === "_blank" ? "noopener noreferrer" : undefined} onClick={() => setMenuOpen(false)}>{cta.label}</a>
      </nav>
    </div>
  </header>;
}
