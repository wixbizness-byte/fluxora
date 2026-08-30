import type { HTMLAttributes, ReactNode } from "react";
import styles from "./fluxora.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode; elevated?: boolean };
export function Card({ children, className, elevated = false, ...props }: CardProps) {
  return <div className={[styles.card, elevated ? styles.cardElevated : "", className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}
