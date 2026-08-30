"use client";

import { ArrowUpRight, Check, Circle, FileText, Handshake, Lightbulb, Store, UsersRound, UserRound, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, PageContainer, SectionHeading, SiteFooter, SiteHeader } from "../components/fluxora";
import styles from "./start-guide.module.css";

type Step = {
  id: string;
  number: string;
  title: string;
  description: string;
  href: string;
  action: string;
};

const steps: Step[] = [
  {
    id: "explore",
    number: "01",
    title: "Explore your tools",
    description: "See the Fluxora tools available for prompts, product content, video workflows, carousels, and more.",
    href: "/tools",
    action: "Browse tools",
  },
  {
    id: "prompt",
    number: "02",
    title: "Open a prompt",
    description: "Pick a prompt or workflow that matches what you want to create and review the inputs it needs.",
    href: "/prompts",
    action: "Open prompts",
  },
  {
    id: "create",
    number: "03",
    title: "Generate your first output",
    description: "Upload your reference, choose your settings, generate the structured prompt, then use it in your preferred AI model.",
    href: "/tools",
    action: "Create something",
  },
  {
    id: "member",
    number: "04",
    title: "Check your member hub",
    description: "Review your profile, progress, membership, active access, and registered devices from one place.",
    href: "/member",
    action: "Open member hub",
  },
  {
    id: "refer",
    number: "05",
    title: "Set up your referral link",
    description: "Visit the referral hub when you are ready to share Fluxora and track your referral progress.",
    href: "/refer",
    action: "Open referrals",
  },
];

const goals = [
  { tag: "Community", title: "Fluxora Community", copy: "Join the community and grow with Fluxora.", href: "https://t.me/PHAICommunity", icon: UsersRound },
  { tag: "Tools", title: "Fluxora Tools", copy: "Access Fluxora tools built to accommodate all ideas possible.", href: "/tools", icon: Wrench },
  { tag: "Prompts", title: "Fluxora Prompts", copy: "Browse a community-driven prompt gallery that keeps growing.", href: "/prompts", icon: FileText },
  { tag: "Member", title: "Manage my access", copy: "Check your membership, progress, devices, and account details.", href: "/member", icon: UserRound },
  { tag: "Sell", title: "Build a storefront", copy: "Use Karousel to organize and share the products or links you want people to see.", href: "https://karousel.shop", icon: Store },
  { tag: "Grow", title: "Refer and earn", copy: "Open your referral hub, share your link, and follow your progression.", href: "/refer", icon: Handshake },
];

const toolRoutes = [
  ["TikTok product or affiliate content", "Affiliate Studio", "/tools"],
  ["AI video scenes and storyboards", "Fluxora Storyboard", "/tools"],
  ["Ready-made image or video prompts", "Prompt Gallery", "/prompts"],
  ["Fashion-focused AI content", "Fashion Studio", "/tools"],
  ["Automotive educational content", "Automotive Tools", "/tools"],
  ["Skincare carousel content", "Skincare Carousel", "/tools"],
  ["A shareable product page", "Karousel", "https://karousel.shop"],
  ["My account, access, or progress", "Member Hub", "/member"],
] as const;

export default function StartGuide() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fluxora-start-progress");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCompleted(parsed.filter((value) => typeof value === "string"));
      }
    } catch {
      // Local progress is optional; the guide still works without storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("fluxora-start-progress", JSON.stringify(completed));
    } catch {
      // Ignore storage failures.
    }
  }, [completed]);

  const progress = useMemo(() => Math.round((completed.length / steps.length) * 100), [completed.length]);

  function toggleStep(id: string) {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <main className={`fluxora-theme ${styles.page}`}>
    <SiteHeader
      brandTarget="_blank"
      links={[
        { href: "#guide", label: "Guide" },
        { href: "/prompts", label: "Prompts", target: "_blank" },
        { href: "/tools", label: "Tools", target: "_blank" },
        { href: "/member", label: "Member", target: "_blank" },
      ]}
      cta={{ href: "/tools", label: "Explore tools", target: "_blank" }}
    />

    <section className={styles.hero}>
      <PageContainer className={styles.heroContent}>
        <Badge variant="brand">Start with Fluxora</Badge>
        <h1>Your guide to creating with Fluxora.</h1>
        <p>Choose an outcome, open the right workflow, and make your first creation without digging through documentation.</p>
        <div className={styles.heroActions}>
          <a className={styles.primaryLink} href="#guide">Start the guide</a>
          <a className={styles.secondaryLink} href="/tools" target="_blank" rel="noopener noreferrer">Explore tools <ArrowUpRight size={16} /></a>
        </div>
        <p className={styles.progress} aria-label={`Guide progress ${progress}%`}><Circle size={16} /> {completed.length} of {steps.length} setup steps complete</p>
      </PageContainer>
    </section>

    <PageContainer>
      <section className={styles.section} id="guide">
        <SectionHeading eyebrow="Choose a direction" title="What do you want to do?" description="You do not need to learn every part of Fluxora first. Start with the outcome you want." />
        <div className={styles.goalGrid}>
          {goals.map((goal) => {
            const Icon = goal.icon;
            return <a className={styles.goalLink} href={goal.href} key={goal.title} target="_blank" rel="noopener noreferrer">
              <Card className={styles.goalCard}>
                <div className={styles.goalIcon}><Icon size={20} strokeWidth={1.8} /></div>
                <span className={styles.goalTag}>{goal.tag}</span>
                <h3>{goal.title}</h3>
                <p>{goal.copy}</p>
                <span className={styles.goalAction}>Open <ArrowUpRight size={16} /></span>
              </Card>
            </a>;
          })}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Five-minute setup" title="Your first Fluxora journey" description="Complete these in any order. Your checkmarks are saved on this device so you can return later." />
        <ol className={styles.steps}>
          {steps.map((step) => {
            const done = completed.includes(step.id);
            return <li className={styles.step} key={step.id}>
              <Button className={`${styles.check} ${done ? styles.done : ""}`} type="button" variant={done ? "primary" : "secondary"} onClick={() => toggleStep(step.id)} aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${step.title}`}>
                {done ? <Check size={18} strokeWidth={2.5} /> : step.number}
              </Button>
              <div className={styles.stepCopy}><h3>{step.title}</h3><p>{step.description}</p></div>
              <a className={styles.stepAction} href={step.href} target="_blank" rel="noopener noreferrer">{step.action}<ArrowUpRight size={16} /></a>
            </li>;
          })}
        </ol>
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Tool router" title="Which tool should I use?" description="Use this quick match when you already know the result you want." />
        <Card className={styles.router}>
          {toolRoutes.map(([intent, tool, href]) => <a href={href} key={intent} target="_blank" rel="noopener noreferrer">
            <span>{intent}</span><strong>{tool}</strong><ArrowUpRight size={18} />
          </a>)}
        </Card>
      </section>

      <section className={`${styles.section} ${styles.tipSection}`}>
        <div className={styles.tip}><Lightbulb size={20} strokeWidth={1.8} /><p><strong>Keep the first one simple.</strong> Start with one clear reference image or idea, then give the selected workflow only the inputs it requests.</p></div>
      </section>
    </PageContainer>

    <SiteFooter brandTarget="_blank" meta="Create. Ideate. Generate." />
  </main>;
}
