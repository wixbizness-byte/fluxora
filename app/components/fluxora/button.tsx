import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./fluxora.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; fullWidth?: boolean; variant?: ButtonVariant };
const variantClassNames: Record<ButtonVariant, string> = { primary: styles.buttonPrimary, secondary: styles.buttonSecondary, ghost: styles.buttonGhost };

export function Button({ children, className, fullWidth = false, variant = "primary", ...props }: ButtonProps) {
  return <button className={[styles.button, variantClassNames[variant], fullWidth ? styles.buttonFull : "", className].filter(Boolean).join(" ")} {...props}>{children}</button>;
}
