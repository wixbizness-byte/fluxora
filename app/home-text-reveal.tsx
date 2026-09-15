"use client";

import { useEffect, useRef } from "react";
import home from "./home.module.css";
import shared from "./components/fluxora/fluxora.module.css";
import styles from "./home-text-reveal.module.css";

export function HomeTextReveal() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const page = anchor.current?.closest("main");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!page || reduced.matches || typeof IntersectionObserver === "undefined") return;
    const selectors = [
      `.${home.heroContent} h1`, `.${home.heroContent} > p`, `.${home.heroActions}`,
      `.${shared.sectionEyebrow}`, `.${shared.sectionTitle}`,
      `.${home.destinationCard} h2`, `.${home.destinationCard} p`, `.${home.cardAction}`, `.${home.communityActions}`,
      `.${home.sectionSplitHead} > a`, `.${home.toolPreviewBody} > span`, `.${home.toolPreviewBody} h2`, `.${home.toolPreviewBody} strong`,
      `.${home.faqItem}`, `.${home.finalCta} > div > span`, `.${home.finalCta} h2`, `.${home.finalCtaActions}`,
      `.${shared.footerBrand}`, `.${shared.footerLinks} a`,
    ];
    const elements = [...page.querySelectorAll<HTMLElement>(selectors.join(","))];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(styles.visible);
        observer.unobserve(entry.target);
      }
    }, { threshold: .12, rootMargin: "0px 0px -7% 0px" });

    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index % 5 * 55, 220)}ms`);
      element.classList.add(styles.reveal);
      observer.observe(element);
    });
    const revealAll = () => {
      if (!reduced.matches) return;
      observer.disconnect();
      elements.forEach(element => element.classList.add(styles.visible));
    };
    reduced.addEventListener("change", revealAll);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", revealAll);
      elements.forEach(element => {
        element.classList.remove(styles.reveal, styles.visible);
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
