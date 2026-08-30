import type { ReactNode } from "react";
import styles from "./fluxora.module.css";

type FooterLink = { href: string; label: string; target?: "_blank" | "_self" };
type SiteFooterProps = { brandHref?: string; brandLabel?: string; brandTarget?: "_blank" | "_self"; links?: FooterLink[]; meta?: ReactNode };
export function SiteFooter({ brandHref = "/", brandLabel = "Fluxora", brandTarget, links = [], meta }: SiteFooterProps) {
  return <footer className={styles.siteFooter}><div className={styles.siteFooterInner}>
    <a className={styles.brand} href={brandHref} target={brandTarget} rel={brandTarget === "_blank" ? "noopener noreferrer" : undefined} aria-label={`${brandLabel} home`}><img className={styles.brandMark} src="/fluxora-logo.svg" alt="" width={28} height={28} /><span className={styles.brandLabel}>{brandLabel}</span></a>
    {links.length ? <nav className={styles.footerNav} aria-label="Footer navigation">{links.map((link) => <a className={styles.footerLink} href={link.href} key={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined}>{link.label}</a>)}</nav> : null}
    {meta ? <div className={styles.footerMeta}>{meta}</div> : null}
  </div></footer>;
}
