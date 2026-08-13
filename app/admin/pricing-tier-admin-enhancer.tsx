"use client";

import { useEffect } from "react";
import styles from "./pricing-tier-admin-enhancer.module.css";

type ParsedTierCopy = {
  intro: string;
  benefits: string[];
  footer: string;
};

function parseTierCopy(raw: string): ParsedTierCopy {
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

  return {
    intro: lines.slice(0, firstBenefit).join(" "),
    benefits: lines
      .slice(firstBenefit, lastBenefit + 1)
      .filter((line) => /^(?:\d+[.)]|[-•])\s+/.test(line))
      .map((line) => line.replace(/^(?:\d+[.)]|[-•])\s+/, "").trim())
      .filter(Boolean),
    footer: lines.slice(lastBenefit + 1).join(" "),
  };
}

function serializeTierCopy(parsed: ParsedTierCopy) {
  const lines: string[] = [];
  if (parsed.intro.trim()) lines.push(parsed.intro.trim());
  parsed.benefits
    .map((benefit) => benefit.trim())
    .filter(Boolean)
    .forEach((benefit, index) => lines.push(`${index + 1}. ${benefit}`));
  if (parsed.footer.trim()) lines.push(parsed.footer.trim());
  return lines.join("\n");
}

function setReactTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function enhanceTierTextLabel(label: HTMLLabelElement) {
  if (label.dataset.pricingStructured === "true") return;
  const textarea = label.querySelector<HTMLTextAreaElement>("textarea");
  if (!textarea) return;

  const leadingText = Array.from(label.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || "")
    .join(" ")
    .trim();
  if (!leadingText.toLowerCase().startsWith("tier text")) return;

  label.dataset.pricingStructured = "true";
  const parsed = parseTierCopy(textarea.value);
  label.style.display = "none";

  const editor = document.createElement("section");
  editor.className = styles.editor;
  editor.dataset.pricingStructuredEditor = "true";

  const heading = document.createElement("div");
  heading.className = styles.heading;
  const headingCopy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = "Tier content";
  const note = document.createElement("span");
  note.textContent = "Structured editor — saved into the existing tier text field.";
  headingCopy.append(title, note);
  heading.appendChild(headingCopy);
  editor.appendChild(heading);

  const introLabel = document.createElement("label");
  introLabel.className = styles.fullField;
  introLabel.textContent = "Intro text";
  const intro = document.createElement("textarea");
  intro.value = parsed.intro;
  intro.rows = 2;
  introLabel.appendChild(intro);
  editor.appendChild(introLabel);

  const benefitsTitle = document.createElement("div");
  benefitsTitle.className = styles.benefitsHeader;
  const benefitsLabel = document.createElement("strong");
  benefitsLabel.textContent = "Benefits";
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = styles.addButton;
  addButton.textContent = "+ Add benefit";
  benefitsTitle.append(benefitsLabel, addButton);
  editor.appendChild(benefitsTitle);

  const benefitsList = document.createElement("div");
  benefitsList.className = styles.benefitsList;
  editor.appendChild(benefitsList);

  const footerLabel = document.createElement("label");
  footerLabel.className = styles.fullField;
  footerLabel.textContent = "Footer text";
  const footer = document.createElement("input");
  footer.type = "text";
  footer.value = parsed.footer;
  footerLabel.appendChild(footer);
  editor.appendChild(footerLabel);

  const benefitValues = parsed.benefits.length ? [...parsed.benefits] : [""];

  const sync = () => {
    const next = serializeTierCopy({
      intro: intro.value,
      benefits: benefitValues,
      footer: footer.value,
    });
    setReactTextareaValue(textarea, next);
  };

  const renderBenefits = () => {
    benefitsList.textContent = "";
    benefitValues.forEach((benefit, index) => {
      const row = document.createElement("div");
      row.className = styles.benefitRow;

      const number = document.createElement("span");
      number.className = styles.benefitNumber;
      number.textContent = String(index + 1);

      const input = document.createElement("input");
      input.type = "text";
      input.value = benefit;
      input.placeholder = "Benefit";
      input.addEventListener("input", () => {
        benefitValues[index] = input.value;
        sync();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = styles.removeButton;
      remove.textContent = "Remove";
      remove.disabled = benefitValues.length === 1;
      remove.addEventListener("click", () => {
        if (benefitValues.length === 1) return;
        benefitValues.splice(index, 1);
        renderBenefits();
        sync();
      });

      row.append(number, input, remove);
      benefitsList.appendChild(row);
    });
  };

  intro.addEventListener("input", sync);
  footer.addEventListener("input", sync);
  addButton.addEventListener("click", () => {
    benefitValues.push("");
    renderBenefits();
    sync();
    benefitsList.querySelector<HTMLInputElement>(".pricing-benefit-input:last-of-type")?.focus();
  });

  renderBenefits();
  label.insertAdjacentElement("afterend", editor);
}

export default function PricingTierAdminEnhancer() {
  useEffect(() => {
    let scheduled = false;

    const enhance = () => {
      scheduled = false;
      document.querySelectorAll<HTMLLabelElement>("label").forEach(enhanceTierTextLabel);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(enhance);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    enhance();

    return () => observer.disconnect();
  }, []);

  return null;
}
