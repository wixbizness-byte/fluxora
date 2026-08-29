"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./referral-product-preview.module.css";

type ProductPreview = {
  key: string;
  title: string;
  description: string;
  imageUrl: string;
};

type PromptPreview = {
  id: number;
  title: string;
  previewUrl: string;
  thumbnailUrl: string;
  mediaType: "Image" | "Video";
};

type PreviewResponse = {
  tools?: ProductPreview[];
  prompts?: PromptPreview[];
};

function nextRandom(length: number, current: number) {
  if (length <= 1) return 0;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

export default function ReferralProductPreview({
  targetKey,
  title,
  description,
}: {
  targetKey: string;
  title: string;
  description: string;
}) {
  const [data, setData] = useState<PreviewResponse>({});
  const [promptIndex, setPromptIndex] = useState(0);
  const isPromptGallery = targetKey === "prompt-gallery";

  useEffect(() => {
    let cancelled = false;
    fetch("/prompts/api/referral-product-previews", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return {};
        return (await response.json().catch(() => ({}))) as PreviewResponse;
      })
      .then((body) => {
        if (cancelled) return;
        setData(body || {});
        if (body?.prompts?.length) {
          setPromptIndex(Math.floor(Math.random() * body.prompts.length));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const prompts = data.prompts || [];

  useEffect(() => {
    if (!isPromptGallery || prompts.length <= 1) return;
    const timer = window.setInterval(() => {
      setPromptIndex((current) => nextRandom(prompts.length, current));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPromptGallery, prompts.length]);

  const tool = useMemo(
    () => (data.tools || []).find((item) => item.key === targetKey) || null,
    [data.tools, targetKey]
  );
  const prompt = isPromptGallery && prompts.length
    ? prompts[Math.min(promptIndex, prompts.length - 1)]
    : null;

  const imageUrl = prompt
    ? prompt.mediaType === "Video"
      ? prompt.thumbnailUrl || prompt.previewUrl
      : prompt.previewUrl
    : tool?.imageUrl || "";
  const cardTitle = prompt?.title || tool?.title || title;
  const cardDescription = isPromptGallery
    ? "A live Prompt Gallery preview. A different prompt appears every 5 seconds."
    : tool?.description || description;
  const cta = isPromptGallery ? "VIEW PROMPT" : "VIEW WORKFLOW";

  return (
    <article className={styles.card} aria-label={`${title} preview`}>
      <div className={styles.media}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={cardTitle} decoding="async" />
        ) : (
          <div className={styles.placeholder}>Fluxora preview</div>
        )}
        {isPromptGallery && <span className={styles.liveBadge}>Rotates every 5s</span>}
      </div>
      <div className={styles.body}>
        <h3>{cardTitle}</h3>
        <p>{cardDescription}</p>
        <span className={styles.cta}>{cta} <b aria-hidden="true">↗</b></span>
      </div>
    </article>
  );
}
