"use client";

import { useEffect } from "react";
import styles from "./pricing-draft.module.css";

type TierCopy = {
  intro: string;
  benefits: string[];
  footer: string;
};

type CountEntry = {
  label: string;
  count: string;
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

function getActiveTier(root: HTMLElement) {
  return root.querySelector<HTMLButtonElement>(".pricing-tier-tabs button.active")?.textContent?.trim() || "Tools";
}

function tierContext(tier: string) {
  if (tier.toLowerCase().includes("creator")) {
    return "The complete Fluxora stack — Workflows first, then CustomGPTs and Tools.";
  }
  if (tier.toLowerCase().includes("premium")) {
    return "Everything in Tools, plus the CustomGPT library for deeper guided creation.";
  }
  return "Focused access to the Fluxora Tools library without CustomGPT or Workflow access.";
}

function collectCounts(root: HTMLElement): CountEntry[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".pricing-resource-group"))
    .map((group) => {
      const label = group.querySelector<HTMLElement>(".pricing-resource-heading span")?.textContent?.trim() || "";
      const count = group.querySelector<HTMLElement>(".pricing-resource-heading strong")?.textContent?.trim() || "";
      return label && count ? { label, count } : null;
    })
    .filter((entry): entry is CountEntry => Boolean(entry));
}

function buildStructuredCopy(paragraph: HTMLParagraphElement) {
  if (paragraph.querySelector(`.${styles.copyBlock}`)) return;
  const raw = paragraph.textContent?.trim() || "";
  if (!raw) return;

  const parsed = parseTierCopy(raw);
  const block = document.createElement("div");
  block.className = styles.copyBlock;

  if (parsed.intro) {
    const intro = document.createElement("p");
    intro.className = styles.copyIntro;
    intro.textContent = parsed.intro;
    block.appendChild(intro);
  }

  if (parsed.benefits.length) {
    const list = document.createElement("ol");
    list.className = styles.benefitList;
    parsed.benefits.forEach((benefit) => {
      const item = document.createElement("li");
      item.textContent = benefit;
      list.appendChild(item);
    });
    block.appendChild(list);
  }

  if (parsed.footer) {
    const footer = document.createElement("p");
    footer.className = styles.copyFooter;
    footer.textContent = parsed.footer;
    block.appendChild(footer);
  }

  if (!parsed.benefits.length && !parsed.footer && parsed.intro) {
    block.classList.add(styles.copyBlockSimple);
  }

  paragraph.textContent = "";
  paragraph.appendChild(block);
}

function buildPlanHeader(summary: HTMLElement, root: HTMLElement) {
  const tier = getActiveTier(root);
  const buyButton = summary.querySelector<HTMLAnchorElement>(".pricing-buy-button");
  const price = buyButton?.textContent?.match(/₱[\d,]+/)?.[0] || "";

  let header = summary.querySelector<HTMLElement>("[data-pricing-plan-header]");
  if (!header) {
    header = document.createElement("div");
    header.dataset.pricingPlanHeader = "true";
    header.className = styles.planHeader;
    summary.prepend(header);
  }

  const signature = `${tier}|${price}`;
  if (header.dataset.signature === signature) return;
  header.dataset.signature = signature;
  header.textContent = "";

  const left = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = styles.planEyebrow;
  eyebrow.textContent = "Selected access";
  const title = document.createElement("strong");
  title.className = styles.planTitle;
  title.textContent = tier === "Tools" ? "Tools Access" : `${tier} Access`;
  left.append(eyebrow, title);

  const priceNode = document.createElement("div");
  priceNode.className = styles.planPrice;
  const priceValue = document.createElement("strong");
  priceValue.textContent = price || "—";
  const priceLabel = document.createElement("span");
  priceLabel.textContent = "one-time access";
  priceNode.append(priceValue, priceLabel);

  header.append(left, priceNode);
}

function buildTierContext(summary: HTMLElement, root: HTMLElement) {
  const tier = getActiveTier(root);
  let context = summary.querySelector<HTMLElement>("[data-pricing-tier-context]");
  if (!context) {
    context = document.createElement("div");
    context.dataset.pricingTierContext = "true";
    context.className = styles.tierContext;
  }

  const copy = tierContext(tier);
  if (context.textContent !== copy) context.textContent = copy;

  const paragraph = summary.querySelector<HTMLParagraphElement>(":scope > p");
  if (paragraph) paragraph.insertAdjacentElement("afterend", context);
  else summary.appendChild(context);
}

function buildCounts(summary: HTMLElement, root: HTMLElement) {
  const entries = collectCounts(root);
  const signature = entries.map((entry) => `${entry.label}:${entry.count}`).join("|");
  let counts = summary.querySelector<HTMLElement>("[data-pricing-auto-counts]");

  if (!counts) {
    counts = document.createElement("div");
    counts.dataset.pricingAutoCounts = "true";
    counts.className = styles.counts;
  }

  if (counts.dataset.signature !== signature) {
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
  }

  const buyButton = summary.querySelector<HTMLElement>(".pricing-buy-button");
  if (buyButton) buyButton.before(counts);
  else summary.appendChild(counts);
}

function decorateResourceCards(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".pricing-resource-card").forEach((card) => {
    if (card.dataset.previewReady === "true") return;
    card.dataset.previewReady = "true";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Preview ${card.querySelector("h3")?.textContent?.trim() || "resource"}`);

    const copy = card.querySelector<HTMLElement>(".pricing-resource-copy");
    if (copy && !copy.querySelector(`.${styles.previewCue}`)) {
      const cue = document.createElement("small");
      cue.className = styles.previewCue;
      cue.textContent = "View preview →";
      copy.appendChild(cue);
    }
  });
}

function createPreviewModal(root: HTMLElement) {
  const backdrop = document.createElement("div");
  backdrop.className = styles.modalBackdrop;
  backdrop.setAttribute("aria-hidden", "true");

  const modal = document.createElement("section");
  modal.className = styles.modal;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Resource preview");

  const close = document.createElement("button");
  close.type = "button";
  close.className = styles.modalClose;
  close.textContent = "×";
  close.setAttribute("aria-label", "Close resource preview");

  const media = document.createElement("div");
  media.className = styles.modalMedia;
  const body = document.createElement("div");
  body.className = styles.modalBody;
  const kicker = document.createElement("span");
  kicker.className = styles.modalKicker;
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const included = document.createElement("div");
  included.className = styles.modalIncluded;
  const cta = document.createElement("a");
  cta.className = styles.modalCta;

  body.append(kicker, title, description, included, cta);
  modal.append(close, media, body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const hide = () => {
    backdrop.classList.remove(styles.modalVisible);
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.removeProperty("overflow");
  };

  const show = (card: HTMLElement) => {
    const tier = getActiveTier(root);
    const cardImage = card.querySelector<HTMLImageElement>(".pricing-resource-image img");
    const cardTitle = card.querySelector<HTMLElement>("h3")?.textContent?.trim() || "Fluxora resource";
    const cardDescription = card.querySelector<HTMLElement>(".pricing-resource-copy p")?.textContent?.trim() || "Included with this Fluxora access tier.";
    const cardIncluded = card.querySelector<HTMLElement>(".pricing-resource-copy > span")?.textContent?.trim() || `Included with ${tier}`;
    const buyButton = root.querySelector<HTMLAnchorElement>(".pricing-buy-button");

    media.textContent = "";
    if (cardImage?.src) {
      const image = document.createElement("img");
      image.src = cardImage.src;
      image.alt = cardImage.alt || cardTitle;
      media.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = styles.modalPlaceholder;
      media.appendChild(placeholder);
    }

    kicker.textContent = "Resource preview";
    title.textContent = cardTitle;
    description.textContent = cardDescription;
    included.textContent = cardIncluded;
    cta.textContent = buyButton?.textContent?.trim() || `Choose ${tier}`;
    cta.href = buyButton?.href || "/pricing";

    backdrop.classList.add(styles.modalVisible);
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    close.focus();
  };

  close.addEventListener("click", hide);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && backdrop.classList.contains(styles.modalVisible)) hide();
  });

  return { backdrop, show, hide };
}

function createMobileDock(root: HTMLElement) {
  const dock = document.createElement("div");
  dock.className = styles.mobileDock;

  const copy = document.createElement("div");
  const tier = document.createElement("strong");
  const price = document.createElement("span");
  copy.append(tier, price);

  const cta = document.createElement("a");
  cta.className = styles.mobileDockCta;
  cta.textContent = "Buy access";

  dock.append(copy, cta);
  document.body.appendChild(dock);

  const updateContent = () => {
    const activeTier = getActiveTier(root);
    const buyButton = root.querySelector<HTMLAnchorElement>(".pricing-buy-button");
    tier.textContent = activeTier === "Tools" ? "Tools Access" : activeTier;
    price.textContent = buyButton?.textContent?.match(/₱[\d,]+/)?.[0] || "";
    cta.href = buyButton?.href || "/pricing";
  };

  let frame = 0;
  const updateVisibility = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      updateContent();
      const pricing = root.closest<HTMLElement>(".pricing-catalog");
      const buyButton = root.querySelector<HTMLElement>(".pricing-buy-button");
      if (!pricing || !buyButton || window.innerWidth > 760) {
        dock.classList.remove(styles.mobileDockVisible);
        return;
      }
      const pricingRect = pricing.getBoundingClientRect();
      const buyRect = buyButton.getBoundingClientRect();
      const shouldShow = pricingRect.top < 80 && pricingRect.bottom > 90 && buyRect.bottom < 76;
      dock.classList.toggle(styles.mobileDockVisible, shouldShow);
    });
  };

  window.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility);
  updateVisibility();

  return {
    dock,
    updateVisibility,
    destroy() {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      cancelAnimationFrame(frame);
      dock.remove();
    },
  };
}

export default function PricingDraftEnhancer() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".pricing-catalog-wrap");
    if (!root) return;

    const modal = createPreviewModal(root);
    const dock = createMobileDock(root);

    const openCard = (card: HTMLElement) => modal.show(card);
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const card = target.closest<HTMLElement>(".pricing-resource-card");
      if (!card || target.closest("a")) return;
      openCard(card);
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(".pricing-resource-card");
      if (!card) return;
      event.preventDefault();
      openCard(card);
    };

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeydown);

    let scheduled = false;
    const enhance = () => {
      scheduled = false;
      const summary = root.querySelector<HTMLElement>(".pricing-tier-summary");
      const paragraph = summary?.querySelector<HTMLParagraphElement>(":scope > p");
      if (paragraph) buildStructuredCopy(paragraph);
      if (summary) {
        buildPlanHeader(summary, root);
        buildTierContext(summary, root);
        buildCounts(summary, root);
      }
      decorateResourceCards(root);
      dock.updateVisibility();
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(enhance);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    enhance();

    return () => {
      observer.disconnect();
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeydown);
      modal.hide();
      modal.backdrop.remove();
      dock.destroy();
    };
  }, []);

  return null;
}
