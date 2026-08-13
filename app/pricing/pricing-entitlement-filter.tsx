"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";

type PricingResourceAccess = {
  title: string;
  access_level: "All" | "Premium" | "Creator";
  tool_type: "Tool" | "CustomGPT" | "Workflow";
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function activeTier(root: HTMLElement) {
  return normalize(root.querySelector<HTMLButtonElement>(".pricing-tier-tabs button.active")?.textContent || "Tools");
}

function isAllowed(resource: PricingResourceAccess, tier: string) {
  if (tier === "tools" || tier === "tool") {
    return resource.tool_type === "Tool" && resource.access_level === "All";
  }

  if (tier === "premium") {
    return resource.tool_type !== "Workflow" && (resource.access_level === "All" || resource.access_level === "Premium");
  }

  return true;
}

function applyEntitlements(root: HTMLElement, resources: PricingResourceAccess[]) {
  const tier = activeTier(root);
  const byTitle = new Map(resources.map((resource) => [normalize(resource.title), resource]));

  root.querySelectorAll<HTMLElement>(".pricing-resource-card").forEach((card) => {
    const title = normalize(card.querySelector<HTMLElement>(".pricing-resource-copy h3")?.textContent || "");
    const resource = byTitle.get(title);
    if (!resource) return;

    const allowed = isAllowed(resource, tier);
    const display = allowed ? "" : "none";
    if (card.style.display !== display) card.style.display = display;
    card.setAttribute("aria-hidden", allowed ? "false" : "true");
    card.tabIndex = allowed ? 0 : -1;
  });

  root.querySelectorAll<HTMLElement>(".pricing-resource-group").forEach((group) => {
    const cards = Array.from(group.querySelectorAll<HTMLElement>(".pricing-resource-card"));
    const visibleCount = cards.filter((card) => card.style.display !== "none").length;
    const countNode = group.querySelector<HTMLElement>(".pricing-resource-heading strong");

    if (countNode && countNode.textContent !== String(visibleCount)) {
      countNode.textContent = String(visibleCount);
    }

    const display = visibleCount > 0 ? "" : "none";
    if (group.style.display !== display) group.style.display = display;
  });
}

export default function PricingEntitlementFilter() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const root = document.querySelector<HTMLElement>(".pricing-catalog-wrap");
    if (!root) return;

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let scheduled = false;

    const schedule = (resources: PricingResourceAccess[]) => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!cancelled) applyEntitlements(root, resources);
      });
    };

    async function initialize() {
      const result = await queryRows<PricingResourceAccess>(
        "pricing_resources_public",
        "select=title,access_level,tool_type&order=sort_order.asc,title.asc",
      );

      if (cancelled || result.error || !result.data) return;
      const resources = result.data;

      observer = new MutationObserver(() => schedule(resources));
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class"],
      });

      schedule(resources);
    }

    initialize().catch((error) => console.warn("Fluxora pricing entitlement filter fallback is being used.", error));

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
