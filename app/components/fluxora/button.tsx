import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./fluxora.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonBaseProps = { children: ReactNode; fullWidth?: boolean; variant?: ButtonVariant };
type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonLinkProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
const variantClassNames: Record<ButtonVariant, string> = { primary: styles.buttonPrimary, secondary: styles.buttonSecondary, ghost: styles.buttonGhost };

export function Button({ children, className, fullWidth = false, variant = "primary", ...props }: ButtonProps | ButtonLinkProps) {
  const classes = [styles.button, variantClassNames[variant], fullWidth ? styles.buttonFull : "", className].filter(Boolean).join(" ");
  if ("href" in props) return <a className={classes} {...props}>{children}</a>;
  return <button className={classes} {...props}>{children}</button>;
}
