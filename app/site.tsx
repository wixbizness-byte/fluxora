"use client";

import { useEffect, useState } from "react";

const products = [
  {
    number: "01",
    kind: "COMMUNITY",
    title: "AI Creator Community",
    text: "A community focused on practical AI creation, shared experiments, helpful feedback, and helping creators turn ideas into consistent output.",
    button: "Join community",
    href: "https://t.me/PHAICommunity",
    icon: "human",
    featured: false,
  },
  {
    number: "02",
    kind: "LESSONS",
    title: "AI Workshop",
    text: "Where we at Fluxora help you explore AI content creation through practical lessons, guided workshops, and repeatable creative systems.",
    button: "Enter workshop",
    href: "https://curzzo.com/communities/ai-content-creation-academy",
    icon: "notes",
    featured: true,
  },
  {
    number: "03",
    kind: "GALLERY",
    title: "Prompt Gallery",
    text: "AI creations are centered around the prompt. Explore a community-driven gallery where creators can discover, study, copy, and adapt prompts behind standout visuals.",
    button: "Check gallery",
    href: "https://fluxora-prompt-gallery.vercel.app/",
    icon: "gallery",
    featured: false,
  },
  {
    number: "04",
    kind: "TOOL",
    title: "Automation Tools",
    text: "Tools, workflows, and GPTs together—organized as one evolving creative operating system.",
    button: "View tools",
    href: "https://tool-directory-ochre.vercel.app/",
    icon: "cog",
    featured: false,
  },
];

const steps = [
  { n: "01", title: "Choose your direction", text: "Start with the outcome you need: a sharper idea, a faster process, or a finished creative asset." },
  { n: "02", title: "Use the system", text: "Follow a practical workflow with the right tool and a focused GPT already mapped to each step." },
  { n: "03", title: "Ship and improve", text: "Create the first strong version, learn from the response, then reuse the system without rebuilding it." },
];

const faqs = [
  [
    "What is included in each access plan?",
    "Explorer includes premium Prompts, Tools, CustomGPTs, and Courses. Creator includes Prompts+, Tools+, CustomGPTs+, Courses+, and the complete Workflows collection.",
  ],
  [
    "Who is behind Fluxora?",
    "Meimei Digitals is the owner of Fluxora.",
  ],
  ["Do I need technical experience?", "No. The experience is structured around clear outcomes and guided steps rather than technical complexity."],
  ["Can the library keep growing?", "Yes. The site is designed around an evolving vault, so new products, modules, proof, and updates can be added without changing the core layout."],
  ["Where does the community live?", "The current button is a placeholder. It can be connected to Telegram, Discord, Circle, Skool, or another community platform."],
];

function MoonMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M31.8 6.8A17.8 17.8 0 1 0 41.2 34C29 38 17.2 25.6 22.5 13.7c1.9-4.2 5.4-6.1 9.3-6.9Z" /></svg>;
}


function ProductIcon({ name }: { name: string }) {
  if (name === "human") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3.2" />
        <path d="M5.5 20c.4-4.2 2.5-6.4 6.5-6.4s6.1 2.2 6.5 6.4" />
        <path d="M4 10.5c1.1-1.7 2.4-2.6 4-2.8M20 10.5c-1.1-1.7-2.4-2.6-4-2.8" />
      </svg>
    );
  }

  if (name === "notes") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.5h12v17H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
        <path d="M9 2v3M15 2v3" />
      </svg>
    );
  }

  if (name === "gallery") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
        <circle cx="9" cy="9" r="1.7" />
        <path d="m5.5 17 4.1-4.2 3 2.8 2.1-2.1 3.8 3.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.3M12 18.9v2.3M2.8 12h2.3M18.9 12h2.3" />
      <path d="m5.5 5.5 1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </svg>
  );
}
function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => setTheme(document.documentElement.dataset.theme || "dark"), []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("fluxora-theme", next);
    setTheme(next);
  }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><span className="sun">☼</span><span className="moon">☾</span></button>;
}

function Orbit() {
  return <div className="orbit-stage" aria-label="Fluxora products orbiting in three dimensions">
    <div className="orbit-glow" /><div className="orbit-line line-a" /><div className="orbit-line line-b" />
    <div className="orbit-card card-a"><small>01</small><b>TOOLS</b><span>Find the right leverage</span></div>
    <div className="orbit-card card-b"><small>02</small><b>WORKFLOWS</b><span>Build repeatable motion</span></div>
    <div className="orbit-card card-c"><small>03</small><b>GPTs</b><span>Activate expertise</span></div>
    <i className="traveler" />
  </div>;
}

export default function Site() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  function closeMenu() { setMenuOpen(false); }

  return <main>
    <div className="announcement"><span>NEW PAGE</span><p>Follow our new page</p><a href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Follow us <b>-&gt;</b></a></div>

    <header className="nav-shell">
      <a className="brand" href="#top" onClick={closeMenu}><MoonMark /><span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span></a>
      <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary">
        <a href="#products" onClick={closeMenu}>Products</a><a href="#community" onClick={closeMenu}>Community</a><a href="#pricing" onClick={closeMenu}>Pricing</a><a href="#faq" onClick={closeMenu}>FAQ</a>
      </nav>
      <div className="nav-actions"><a className="nav-cta" href="#pricing">Get access</a><ThemeToggle /><button className="menu-toggle" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}><i /><i /></button></div>
    </header>

    <section className="hero section" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span /> DIGITAL SYSTEMS FOR CREATORS</p>
        <h1>Turn ideas into<br/><em>actual results.</em></h1>
        <p className="hero-lede">Curated tools, practical workflows, and purpose-built GPTs that help you move from possibility to finished work—faster.</p>
        <div className="hero-actions"><a className="button primary" href="#products">Browse the vault <span>↗</span></a><a className="button ghost" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Join community <span>↗</span></a></div>
        <div className="hero-proof"><div className="avatars"><i>F</i><i>L</i><i>X</i><i>+</i></div><p><b>Built for momentum</b><span>Clear systems. Less trial and error.</span></p></div>
      </div>
      <div className="hero-visual"><Orbit /><div className="visual-stamp">IDEAS ORBIT · PROMPTS EVOLVE</div></div>
    </section>

    <section className="stats-wrap section"><div className="stats">
      <div><strong>40<sup>+</sup></strong><span>Curated resources</span></div><div><strong>03</strong><span>Core product types</span></div><div><strong>∞</strong><span>Ways to create</span></div><div><strong>01</strong><span>Organized vault</span></div>
    </div></section>

    <section className="products section" id="products">
      <div className="section-heading"><div><p className="eyebrow"><span /> THE COLLECTION</p><h2>Everything you need to<br/><em>move with clarity.</em></h2></div></div>
      <div className="product-grid">{products.map((product) => <article className={product.featured ? "product-card featured" : "product-card"} key={product.number}>
        {product.featured && <div className="popular">MOST POPULAR</div>}<div className="product-top"><span>{product.kind}</span><i><ProductIcon name={product.icon} /></i></div><h3>{product.title}</h3><p className="card-text">{product.text}</p><a className="product-link" href={product.href} target="_blank" rel="noopener noreferrer">{product.button}<span>↗</span></a>
      </article>)}</div>
    </section>

<section className="community section" id="community">
  <div className="community-card">
    <div className="community-copy">
      <p className="eyebrow light"><span /> PRIVATE COMMUNITY</p>
      <h2>Create alongside people<br/><em>who keep moving.</em></h2>
      <p>Turn the vault into a living practice. Share experiments, compare systems, and build with a community focused on useful output.</p>
      <ul>
        <li>Focused Q&amp;A and feedback</li>
        <li>New resource drops</li>
        <li>Creator experiments</li>
        <li>Workflow breakdowns</li>
      </ul>
      <a className="button cream" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">
        Join the community <span aria-hidden="true">-&gt;</span>
      </a>
    </div>

    <div className="community-visual">
      <div className="community-orbit ring-one"/>
      <div className="community-orbit ring-two"/>
      <div className="community-core"><MoonMark/><b>FLUXORA</b><span>MEMBER SPACE</span></div>
      {["IDEATE","CREATE","REFINE","SHIP"].map((item,index) =>
        <i className={`member-dot dot-${index + 1}`} key={item}>{item}</i>
      )}
    </div>
  </div>
</section>

<section className="process section">
  <div className="center-heading">
    <p className="eyebrow"><span /> THE FLUXORA METHOD</p>
    <h2>A clear path from idea<br/>to <em>finished work.</em></h2>
  </div>

  <div className="steps">
    {steps.map(step =>
      <article key={step.n}>
        <span>{step.n}</span>
        <div className="step-icon"><i/></div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </article>
    )}
  </div>
</section>

<section className="pricing section" id="pricing">
  <div className="pricing-wrap">
    <div className="pricing-copy">
      <p className="eyebrow"><span /> SIMPLE ACCESS</p>
      <h2>Choose the level that<br/><em>fits your momentum.</em></h2>
      <p>Free access only gets you so far, explore our offers to check what suits you best.</p>
    </div>

    <div className="price-cards">
      <article className="access-plan explorer-plan">
        <div className="plan-header">STARTER</div>
        <h3>Explorer</h3>
        <p className="plan-description">Your entrypoint to AI. Get access to the premium:</p>
        <ul className="plan-features">
          <li>Prompts</li>
          <li>Tools</li>
          <li>CustomGPTs</li>
          <li>Courses</li>
        </ul>
        <a className="button ghost full plan-button" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">
          Choose Explorer <span aria-hidden="true">-&gt;</span>
        </a>
      </article>

      <article className="access-plan creator-plan">
        <div className="plan-header">ENDGAME</div>
        <h3>Creator</h3>
        <p className="plan-description">From start to finish. Get access to the entire vault containing:</p>
        <ul className="plan-features">
          <li>Prompts+</li>
          <li>Tools+</li>
          <li>CustomGPTs+</li>
          <li>Courses+</li>
          <li className="hot-feature">Workflows <span>HOT</span></li>
        </ul>
        <a className="button primary full plan-button" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">
          Choose Creator <span aria-hidden="true">-&gt;</span>
        </a>
      </article>
    </div>
  </div>
</section>

<section className="faq section" id="faq">
  <div className="faq-heading">
    <p className="eyebrow"><span /> QUESTIONS, ANSWERED</p>
    <h2>Everything you need<br/>to know.</h2>
    <p>Find the important details about Fluxora, access, and the community.</p>
  </div>

  <div className="faq-list">
    {faqs.map(([question,answer],index) =>
      <article className={openFaq === index ? "open" : ""} key={question}>
        <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
          <span>{String(index + 1).padStart(2,"0")}</span>
          <b>{question}</b>
          <i>+</i>
        </button>
        <div className="faq-answer"><p>{answer}</p></div>
      </article>
    )}
  </div>
</section>

<section className="final-cta section">
  <div className="cta-mark"><MoonMark/></div>
  <p className="eyebrow light"><span /> MAKE THE NEXT MOVE</p>
  <h2>Your ideas deserve<br/><em>a working system.</em></h2>
  <p>Start with the vault. Shape it around your process. Build what comes next.</p>
  <a className="button cream" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">
    Message us <span aria-hidden="true">-&gt;</span>
  </a>
</section>


    <footer><div className="footer-brand"><a className="brand" href="#top"><MoonMark/><span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span></a><p>Useful systems for ambitious ideas.</p></div><div><small>EXPLORE</small><a href="#products">Products</a><a href="#pricing">Pricing</a></div><div><small>CONNECT</small><a href="#community">Community</a><a href="#">Instagram</a><a href="#">TikTok</a></div><div><small>LEGAL</small><a href="#">Terms</a><a href="#">Privacy</a><a href="#faq">FAQ</a></div><p className="copyright">&copy; 2026 Fluxora. All rights reserved.</p></footer>
  </main>;
}
