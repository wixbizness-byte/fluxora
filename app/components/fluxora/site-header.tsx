"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styles from "./fluxora.module.css";

type HeaderLink = { href: string; label: string; target?: "_blank" | "_self" };
type SiteHeaderProps = { cta: HeaderLink; links: HeaderLink[]; brandHref?: string; brandLabel?: string; brandTarget?: "_blank" | "_self" };
const NAV_ID = "site-header-nav";
function externalRel(target?: string) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}
function NavLink({ className, link, onClick }: { className: string; link: HeaderLink; onClick: () => void }) {
  if (link.target === "_blank" || link.href.startsWith("http")) {
    return <a className={className} href={link.href} target={link.target} rel={externalRel(link.target)} onClick={onClick}>{link.label}</a>;
  }
  return <Link className={className} href={link.href} onClick={onClick}>{link.label}</Link>;
}
export function SiteHeader({ brandHref = "/", brandLabel = "Fluxora", brandTarget, cta, links }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <header className={styles.siteHeader}>
    <div className={styles.siteHeaderInner}>
      <a className={styles.brand} href={brandHref} target={brandTarget} rel={externalRel(brandTarget)} aria-label={`${brandLabel} home`}><img className={styles.brandMark} src="/fluxora-logo.svg" alt="" width={28} height={28} /><span className={styles.brandLabel}>{brandLabel}</span></a>
      <button className={styles.headerMenuButton} type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls={NAV_ID} aria-label="Toggle navigation">
        {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
      </button>
      <nav id={NAV_ID} className={[styles.headerNav, menuOpen ? styles.headerNavOpen : ""].filter(Boolean).join(" ")} aria-label="Primary navigation">
        {links.map((link) => <NavLink className={styles.headerLink} key={link.href} link={link} onClick={closeMenu} />)}
        <NavLink className={[styles.button, styles.buttonPrimary, styles.headerCta].join(" ")} link={cta} onClick={closeMenu} />
      </nav>
    </div>
  </header>;
}
