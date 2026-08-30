import type { ReactNode } from "react";
import styles from "./fluxora.module.css";

type SectionHeadingProps = { align?: "left" | "center"; description?: ReactNode; eyebrow?: ReactNode; title: ReactNode };
export function SectionHeading({ align = "left", description, eyebrow, title }: SectionHeadingProps) {
  return <div className={[styles.sectionHeading, align === "center" ? styles.sectionHeadingCenter : ""].filter(Boolean).join(" ")}>
    {eyebrow ? <p className={styles.sectionEyebrow}>{eyebrow}</p> : null}
    <h2 className={styles.sectionTitle}>{title}</h2>
    {description ? <p className={styles.sectionDescription}>{description}</p> : null}
  </div>;
}
