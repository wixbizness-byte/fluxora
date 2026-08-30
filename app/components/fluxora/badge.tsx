import type { HTMLAttributes, ReactNode } from "react";
import styles from "./fluxora.module.css";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
type BadgeProps = HTMLAttributes<HTMLSpanElement> & { children: ReactNode; variant?: BadgeVariant };
const variantClassNames: Record<BadgeVariant, string> = { neutral: "", brand: styles.badgeBrand, success: styles.badgeSuccess, warning: styles.badgeWarning, danger: styles.badgeDanger, info: styles.badgeInfo };
export function Badge({ children, className, variant = "neutral", ...props }: BadgeProps) {
  return <span className={[styles.badge, variantClassNames[variant], className].filter(Boolean).join(" ")} {...props}>{children}</span>;
}
