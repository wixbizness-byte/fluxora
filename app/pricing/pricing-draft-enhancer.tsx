"use client";

import { useEffect } from "react";
import styles from "./pricing-draft.module.css";

type TierCopy = {
  intro: string;
  benefits: string[];
  footer: string;
};

function parseTierCopy(raw: string): TierCopy {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { intro: "", benefits: [], footer: "" };

  const benefitIndexes = lines
    .map((line, index) => (/^(?:\d+[.)]|[-•])\s+/.test(line) ? index : -1))
    .filter((index) => index >= 0);

  if (!benefitIndexes.length) {
    return { intro: lines.join(" "), benefits: [], footer: "" };
  }

  const firstBenefit = benefitIndexes[0];
  const lastBenefit = benefitIndexes[benefitIndexes.length - 1];
  const benefits = lines
    .slice(firstBenefit, lastBenefit + 1)
    .filter((line) => /^(?:\d+[.)]|[-•])\s+/.test(line))
    .map((line) => line.replace(/^(?:\d+[.)]|[-•])\s+/, "").trim())
    .filter(Boolean);

  return {
    intro: lines.slice(0, firstBenefit).join(" "),
    benefits,
    footer: lines.slice(lastBenefit + 1).join(" "),
  };
}

function buildStructuredCopy(paragraph: HTMLParagraphElement) {
  if (paragraph.querySelector(`.${styles.copyBlock}`)) return;
  const raw = paragraph.textContent?.trim() || "";
  if (!raw) return;

  const parsed = parseTierCopy(raw);
  if (!parsed.benefits.length) return;

  const block = document.createElement("div");
  block.className = styles.copyBlock;

  if (parsed.intro) {
    const intro = document.createElement("p");
    intro.className = styles.copyIntro;
    intro.textContent = parsed.intro;
    block.appendChild(intro);
  }

  const list = document.createElement("ol");
  list.className = styles.benefitList;
  parsed.benefits.forEach((benefit) => {
    const item = document.createElement("li");
    item.textContent = benefit;
    list.appendChild(item);
  });
  block.appendChild(list);

  if (parsed.footer) {
    const footer = document.createElement("p");
    footer.className = styles.copyFooter;
    footer.textContent = parsed.footer;
    block.appendChild(footer);
  }

  paragraph.textContent = "";
  paragraph.appendChild(block);
}

function buildCounts(summary: HTMLElement, root: HTMLElement) {
  const groups = Array.from(root.querySelectorAll<HTMLElement>(".pricing-resource-group"));
  const entries = groups
    .map((group) => {
      const label = group.querySelector<HTMLElement>(".pricing-resource-heading span")?.textContent?.trim() || "";
      const count = group.querySelector<HTMLElement>(".pricing-resource-heading strong")?.textContent?.trim() || "";
      return label && count ? { label, count } : null;
    })
    .filter((entry): entry is { label: string; count: string } => Boolean(entry));

  const signature = entries.map((entry) => `${entry.label}:${entry.count}`).join("|");
  let counts = summary.querySelector<HTMLElement>("[data-pricing-auto-counts]");
  if (counts?.dataset.signature === signature) return;

  if (!counts) {
    counts = document.createElement("div");
    counts.dataset.pricingAutoCounts = "true";
    counts.className = styles.counts;
  }

  counts.dataset.signature = signature;
  counts.textContent = "";

  entries.forEach((entry) => {
    const chip = document.createElement("div");
    chip.className = styles.countChip;
    const number = document.createElement("strong");
    number.textContent = entry.count;
    const label = document.createElement("span");
    label.textContent = entry.label;
    chip.append(number, label);
    counts!.appendChild(chip);
  });

  const buyButton = summary.querySelector<HTMLElement>(".pricing-buy-button");
  if (buyButton) buyButton.before(counts);
  else summary.appendChild(counts);
}

export default function PricingDraftEnhancer() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".pricing-catalog-wrap");
    if (!root) return;

    let scheduled = false;
    const enhance = () => {
      scheduled = false;
      const summary = root.querySelector<HTMLElement>(".pricing-tier-summary");
      const paragraph = summary?.querySelector<HTMLParagraphElement>(":scope > p");
      if (paragraph) buildStructuredCopy(paragraph);
      if (summary) buildCounts(summary, root);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(enhance);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    enhance();

    return () => observer.disconnect();
  }, []);

  return null;
}
