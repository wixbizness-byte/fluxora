import type { HTMLAttributes, ReactNode } from "react";
import styles from "./fluxora.module.css";

type PageContainerProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };
export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return <div className={[styles.pageContainer, className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}
