"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./start-guide.module.css";
import lightStyles from "./start-guide-light.module.css";

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
  { tag: "COMMUNITY", title: "Fluxora Community", copy: "Join the Community, and grow with Fluxora.", href: "https://t.me/PHAICommunity" },
  { tag: "TOOLS", title: "Fluxora Tools", copy: "Access Fluxora Tools, built to accommodate all ideas possible.", href: "/tools" },
  { tag: "PROMPTS", title: "Fluxora Prompts", copy: "Need prompts? Browse our prompt gallery, community-driven and constantly growing.", href: "/prompts" },
  { tag: "MEMBER", title: "Manage my access", copy: "Check your membership, profile, progress, devices, and other account-related information.", href: "/member" },
  { tag: "SELL", title: "Build a product storefront", copy: "Use Karousel to organize and share the products or links you want people to see.", href: "https://karousel.shop" },
  { tag: "GROW", title: "Refer and earn", copy: "Open your referral hub, share your link, and follow your referral progression.", href: "/refer" },
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

function MoonMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M31.8 6.8A17.8 17.8 0 1 0 41.2 34C29 38 17.2 25.6 22.5 13.7c1.9-4.2 5.4-6.1 9.3-6.9Z" />
    </svg>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function StartGuide() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <main className={`${styles.page} ${lightStyles.lightTheme}`}>
      <header className={styles.nav}>
        <a className={styles.brand} href="/" aria-label="Fluxora home">
          <MoonMark />
          <span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span>
        </a>

        <nav className={`${styles.navLinks} ${lightStyles.mobileNav} ${menuOpen ? styles.open : ""}`} aria-label="Start guide navigation">
          <a href="#guide" onClick={() => setMenuOpen(false)}>Guide</a>
          <a href="/prompts" onClick={() => setMenuOpen(false)}>Prompts</a>
          <a href="/tools" onClick={() => setMenuOpen(false)}>Tools</a>
          <a href="/member" onClick={() => setMenuOpen(false)}>Member</a>
        </nav>

        <a className={styles.navCta} href="/tools">Explore tools</a>
        <button className={styles.menuButton} type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          <i /><i />
        </button>
      </header>

      <section className={styles.hero}>
        <div className={`${styles.heroGlow} ${lightStyles.heroGlow}`} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span />START WITH FLUXORA</p>
          <h1>Your guide to <em>creating</em> with Fluxora.</h1>
          <p className={styles.lede}>Choose what you want to make, learn the basic workflow, open the right tool, and get your first Fluxora creation moving without digging through documentation.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#guide">Start the guide</a>
            <a className={styles.secondaryButton} href="/tools">Explore tools</a>
          </div>
          <div className={`${styles.progressCard} ${lightStyles.progressCard}`} aria-label={`Guide progress ${progress}%`}>
            <div>
              <span>YOUR START GUIDE</span>
              <b>{completed.length} / {steps.length} complete</b>
            </div>
            <div className={`${styles.progressTrack} ${lightStyles.progressTrack}`}><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="guide">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}><span />CHOOSE A DIRECTION</p>
          <h2>What do you want to <em>do?</em></h2>
          <p>You do not need to learn every part of Fluxora first. Start with the outcome you want.</p>
        </div>
        <div className={styles.goalGrid}>
          {goals.map((goal) => {
            const external = goal.href.startsWith("http");
            return (
              <a className={`${styles.goalCard} ${lightStyles.goalCard}`} href={goal.href} key={goal.title} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                <div className={styles.cardTop}><span>{goal.tag}</span><Arrow /></div>
                <h3>{goal.title}</h3>
                <p>{goal.copy}</p>
              </a>
            );
          })}
        </div>
      </section>

      <section className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}><span />5-MINUTE SETUP</p>
          <h2>Your first <em>Fluxora journey.</em></h2>
          <p>Complete these in any order. Your checkmarks are saved on this device so you can come back later.</p>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => {
            const done = completed.includes(step.id);
            return (
              <article className={`${styles.step} ${done ? styles.done : ""}`} key={step.id}>
                <button className={styles.check} type="button" onClick={() => toggleStep(step.id)} aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${step.title}`}>
                  {done ? "✓" : step.number}
                </button>
                <div className={styles.stepCopy}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <a className={styles.stepAction} href={step.href}>{step.action}<Arrow /></a>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${styles.section} ${styles.workflowSection}`}>
        <div className={`${styles.workflowPanel} ${lightStyles.workflowPanel}`}>
          <div className={styles.workflowIntro}>
            <p className={styles.eyebrow}><span />HOW IT WORKS</p>
            <h2>Fluxora is the layer between your <em>idea</em> and the AI model.</h2>
            <p>Most Fluxora workflows help you structure the creative direction first, then produce a prompt, storyboard, or content package that you can use with the AI generator suited to the job.</p>
          </div>
          <div className={styles.flow} aria-label="Fluxora creation workflow">
            {[
              ["01", "Your idea", "Start with a product, topic, reference, or creative goal."],
              ["02", "Fluxora", "Choose a workflow and configure the inputs you need."],
              ["03", "Structured output", "Get the prompt, storyboard, caption, hashtags, or content plan."],
              ["04", "AI generator", "Use the output in the image or video model appropriate for the task."],
              ["05", "Final content", "Review, refine, generate again if needed, then publish or share."],
            ].map(([number, title, copy]) => (
              <div className={styles.flowItem} key={number}>
                <span>{number}</span>
                <div><b>{title}</b><p>{copy}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}><span />TOOL ROUTER</p>
          <h2>Which tool should I <em>use?</em></h2>
          <p>Use this as the fast route when you already know the result you want.</p>
        </div>
        <div className={`${styles.router} ${lightStyles.router}`}>
          {toolRoutes.map(([intent, tool, href]) => {
            const external = href.startsWith("http");
            return (
              <a href={href} key={intent} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                <span>{intent}</span>
                <b>{tool}</b>
                <Arrow />
              </a>
            );
          })}
        </div>
      </section>

      <section className={`${styles.section} ${styles.firstCreation} ${lightStyles.firstCreation}`}>
        <div>
          <p className={styles.eyebrow}><span />FIRST CREATION</p>
          <h2>Keep the first one <em>simple.</em></h2>
          <p>Start with one clear reference image or one clear idea. Pick the relevant Fluxora tool, provide only the inputs it asks for, generate the structured output, then move that output into your chosen AI generator.</p>
          <div className={styles.miniFlow}><span>REFERENCE</span><i>→</i><span>CONFIGURE</span><i>→</i><span>GENERATE</span><i>→</i><span>CREATE</span></div>
        </div>
        <div className={styles.creationActions}>
          <a className={styles.primaryButton} href="/tools">Choose a tool</a>
          <a className={styles.secondaryButton} href="/prompts">Browse prompts</a>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.quickGrid}>
          <a className={styles.quickCard} href="https://karousel.shop" target="_blank" rel="noopener noreferrer">
            <span>KAROUSEL</span>
            <h3>Build a storefront for the products you want to share.</h3>
            <p>Create a clean, shareable product page and only show the information you choose to add.</p>
            <b>Open Karousel <Arrow /></b>
          </a>
          <a className={styles.quickCard} href="/refer">
            <span>REFERRALS</span>
            <h3>Ready to share Fluxora with someone else?</h3>
            <p>Use the referral hub for your referral link and related referral progression.</p>
            <b>Open referrals <Arrow /></b>
          </a>
          <a className={styles.quickCard} href="/member">
            <span>MEMBER HUB</span>
            <h3>Need to check your account or access?</h3>
            <p>Your member hub is the home for profile, progress, membership, access, and device information.</p>
            <b>Open member hub <Arrow /></b>
          </a>
        </div>
      </section>

      <section className={styles.help}>
        <div className={styles.section}>
          <p className={styles.eyebrow}><span />NEED HELP?</p>
          <h2>You can always come back to <em>/start.</em></h2>
          <p>Use this page as your map whenever you are unsure where a Fluxora workflow lives.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="/tools">Open tools</a>
            <a className={styles.secondaryButton} href="/member">Member hub</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <a className={styles.brand} href="/">
          <MoonMark />
          <span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span>
        </a>
        <p>Start simple. Create something. Build from there.</p>
      </footer>
    </main>
  );
}