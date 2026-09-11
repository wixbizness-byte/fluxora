import type { ReactNode } from "react";
import styles from "./fluxora.module.css";

type FooterLink = { href: string; label: string; target?: "_blank" | "_self" };
type SiteFooterProps = { brandHref?: string; brandLabel?: string; brandTarget?: "_blank" | "_self"; links?: FooterLink[]; meta?: ReactNode };

const SOCIAL_LINKS = [
  { href: "mailto:wixbizness@gmail.com", eyebrow: "Contact Us", value: "wixbizness@gmail.com" },
  { href: "https://www.facebook.com/fluxora01", eyebrow: "Facebook", value: "Fluxora", target: "_blank" as const },
  { href: "https://www.tiktok.com/@luiswixz?_r=1", eyebrow: "TikTok", value: "@luiswixz", target: "_blank" as const },
];

export function SiteFooter({ brandHref = "/", brandLabel = "Fluxora", brandTarget, links = [], meta = "Create. Ideate. Generate." }: SiteFooterProps) {
  return <footer className={styles.siteFooter}><div className={styles.siteFooterInner}>
    <div className={styles.footerBrand}>
      <a className={styles.brand} href={brandHref} target={brandTarget} rel={brandTarget === "_blank" ? "noopener noreferrer" : undefined} aria-label={`${brandLabel} home`}><img className={styles.brandMark} src="/fluxora-logo.svg" alt="" width={28} height={28} /><span className={styles.brandLabel}>{brandLabel}</span></a>
      {meta ? <span className={styles.footerMeta}>· {meta}</span> : null}
    </div>
    {links.length ? <nav className={styles.footerNav} aria-label="Footer navigation">{links.map((link) => <a className={styles.footerLink} href={link.href} key={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined}>{link.label}</a>)}</nav>
      : <nav className={styles.footerLinks} aria-label="Fluxora contact and social links">{SOCIAL_LINKS.map((link) => <a href={link.href} key={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined}><span>{link.eyebrow}</span><strong>{link.value}</strong></a>)}</nav>}
  </div></footer>;
}
