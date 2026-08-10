export const dynamic = "force-static";

const html = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#160d12" /><meta name="description" content="Choose where you want to go in the Fluxora creator ecosystem." /><title>Fluxora — Choose Your Destination</title><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&display=swap" rel="stylesheet" /><style>
    :root {
      --page: #fbf4ef;
      --page-soft: #f4e5e5;
      --ink: #4b1024;
      --muted: #76545f;
      --wine: #7c1d3d;
      --wine-dark: #260d17;
      --rose: #cf7694;
      --line: rgba(75, 16, 36, 0.15);
      --white: #fffaf7;
      --shadow: 0 20px 50px rgba(73, 17, 36, 0.12);
      --radius: 28px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        radial-gradient(circle at 82% 12%, rgba(207, 118, 148, 0.22), transparent 31rem),
        radial-gradient(circle at 8% 78%, rgba(124, 29, 61, 0.10), transparent 30rem),
        var(--page);
      font-family: "DM Sans", Arial, sans-serif;
      overflow-x: hidden;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .page-shell {
      position: relative;
      width: min(920px, calc(100% - 36px));
      margin: 0 auto;
      padding: 28px 0 64px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 13px;
      padding: 12px 0;
      animation: reveal-down 650ms ease both;
    }

    .moon {
      position: relative;
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      border-radius: 50%;
      background: var(--wine);
    }

    .moon::after {
      content: "";
      position: absolute;
      width: 26px;
      height: 26px;
      top: -2px;
      left: 10px;
      border-radius: 50%;
      background: var(--page);
    }

    .brand-copy strong {
      display: block;
      font-family: "Fraunces", Georgia, serif;
      font-size: 25px;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .brand-copy span {
      display: block;
      margin-top: 5px;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .hero {
      padding: clamp(72px, 12vw, 132px) 0 clamp(46px, 7vw, 78px);
      text-align: center;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 22px;
      color: var(--wine);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      animation: reveal-up 700ms 100ms ease both;
    }

    .eyebrow::before,
    .eyebrow::after {
      content: "";
      width: 34px;
      height: 1px;
      background: currentColor;
      opacity: 0.7;
    }

    h1 {
      max-width: 800px;
      margin: 0 auto;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(54px, 9vw, 102px);
      font-weight: 500;
      line-height: 0.96;
      letter-spacing: -0.055em;
      animation: reveal-up 800ms 180ms cubic-bezier(.2,.7,.2,1) both;
    }

    h1 em {
      color: var(--wine);
      font-weight: 600;
    }

    .hero p {
      max-width: 620px;
      margin: 28px auto 0;
      color: var(--muted);
      font-size: clamp(16px, 2.2vw, 20px);
      line-height: 1.7;
      animation: reveal-up 800ms 260ms ease both;
    }

    .destination-list {
      display: grid;
      gap: 18px;
    }

    .destination-card {
      position: relative;
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr) auto;
      align-items: center;
      gap: 24px;
      min-height: 158px;
      padding: 28px 30px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 250, 247, 0.86);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      overflow: hidden;
      opacity: 0;
      transform: translateY(24px);
      animation: card-in 680ms cubic-bezier(.2,.7,.2,1) forwards;
      transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
    }

    .destination-card:nth-child(1) { animation-delay: 320ms; }
    .destination-card:nth-child(2) { animation-delay: 400ms; }
    .destination-card:nth-child(3) { animation-delay: 480ms; }
    .destination-card:nth-child(4) { animation-delay: 560ms; }
    .destination-card:nth-child(5) { animation-delay: 640ms; }
    .destination-card:nth-child(6) { animation-delay: 720ms; }
    .destination-card:nth-child(7) { animation-delay: 800ms; }

    .destination-card::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 5px;
      background: linear-gradient(var(--rose), var(--wine));
      opacity: 0;
      transition: opacity 220ms ease;
    }

    .destination-card:hover,
    .destination-card:focus-within {
      transform: translateY(-5px);
      border-color: rgba(124, 29, 61, 0.32);
      box-shadow: 0 28px 65px rgba(73, 17, 36, 0.17);
    }

    .destination-card:hover::before,
    .destination-card:focus-within::before {
      opacity: 1;
    }

    .card-number {
      display: grid;
      place-items: center;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: 1px solid rgba(124, 29, 61, 0.22);
      color: var(--wine);
      background: var(--page);
      font-family: "Fraunces", Georgia, serif;
      font-size: 22px;
    }

    .card-content {
      min-width: 0;
    }

    .card-label {
      display: block;
      margin-bottom: 8px;
      color: var(--wine);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .card-content h2 {
      margin: 0;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(27px, 4vw, 38px);
      font-weight: 500;
      line-height: 1.08;
      letter-spacing: -0.025em;
    }

    .card-content p {
      max-width: 540px;
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .card-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      min-width: 172px;
      min-height: 52px;
      padding: 14px 22px;
      border-radius: 999px;
      background: var(--wine);
      color: var(--white);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: background 180ms ease, transform 180ms ease;
    }

    .card-button:hover,
    .card-button:focus-visible {
      background: var(--wine-dark);
      transform: scale(1.025);
      outline: none;
    }

    .footer {
      padding: 46px 0 10px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.05em;
    }

    @keyframes reveal-down {
      from { opacity: 0; transform: translateY(-14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes reveal-up {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes card-in {
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 760px) {
      .page-shell {
        width: min(100% - 24px, 620px);
        padding-top: 18px;
      }

      .hero {
        padding-top: 68px;
      }

      h1 {
        font-size: clamp(50px, 15vw, 72px);
      }

      .destination-card {
        grid-template-columns: 52px minmax(0, 1fr);
        gap: 18px;
        min-height: 0;
        padding: 24px 22px;
      }

      .card-number {
        width: 50px;
        height: 50px;
        font-size: 18px;
      }

      .card-button {
        grid-column: 1 / -1;
        width: 100%;
        margin-top: 5px;
      }
    }

    @media (max-width: 420px) {
      .brand-copy strong {
        font-size: 23px;
      }

      .hero {
        padding-top: 56px;
      }

      .eyebrow::before,
      .eyebrow::after {
        width: 20px;
      }

      .destination-card {
        grid-template-columns: 1fr;
      }

      .card-number {
        margin-bottom: 2px;
      }

      .card-button {
        grid-column: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style></head><body><main class="page-shell"><a class="brand" href="#top" aria-label="Fluxora home"><span class="moon" aria-hidden="true"></span><span class="brand-copy"><strong>Fluxora</strong><span>Create. Ideate. Generate.</span></span></a><section class="hero" id="top"><div class="eyebrow">Choose your destination</div><h1>Welcome, where do you want to <em>go?</em></h1><p>Select a destination below and continue directly to the Fluxora resource that fits what you need.</p></section><section class="destination-list" aria-label="Fluxora destinations"><article class="destination-card"><div class="card-number" aria-hidden="true">01</div><div class="card-content"><span class="card-label">Community</span><h2>AI Creator Community</h2><p>Join creators sharing practical experiments, useful feedback, resources, and repeatable workflows.</p></div><a class="card-button" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Join Community</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">02</div><div class="card-content"><span class="card-label">Tools</span><h2>Automation Tools</h2><p>Explore practical tools and creator-focused systems designed to make your workflow faster and easier.</p></div><a class="card-button" href="/tools" target="_blank" rel="noopener noreferrer">View Tools</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">03</div><div class="card-content"><span class="card-label">Gallery</span><h2>Prompt Gallery</h2><p>Discover, study, copy, and adapt prompts behind standout AI visuals and creator-ready concepts.</p></div><a class="card-button" href="/prompts" target="_blank" rel="noopener noreferrer">Browse Gallery</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">04</div><div class="card-content"><span class="card-label">Learning</span><h2>AI Course</h2><p>Learn practical AI content workflows through structured lessons built for creators and online sellers.</p></div><a class="card-button" href="https://curzzo.com/communities/ai-content-creation-academy" target="_blank" rel="noopener noreferrer">View Course</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">05</div><div class="card-content"><span class="card-label">Updates</span><h2>Facebook Page</h2><p>Follow the official page for new resources, announcements, updates, and creator opportunities.</p></div><a class="card-button" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Follow Page</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">06</div><div class="card-content"><span class="card-label">Plans</span><h2>Fluxora Pricing</h2><p>Explore Fluxora access plans and choose the level that best matches your creative goals.</p></div><a class="card-button" href="/pricing" target="_blank" rel="noopener noreferrer">View Pricing</a></article><article class="destination-card"><div class="card-number" aria-hidden="true">07</div><div class="card-content"><span class="card-label">Fashion</span><h2>Karousel Clothing</h2><p>Discover curated clothing finds, outfit inspiration, and affiliate shopping recommendations.</p></div><a class="card-button" href="https://karousel.shop" target="_blank" rel="noopener noreferrer">Explore Clothing</a></article></section><footer class="footer">Fluxora · Turn ideas into actual results.</footer></main></body></html>`;

export function GET() {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
