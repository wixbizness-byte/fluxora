export const homeHtml = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#fbf4ef" />
  <meta name="description" content="Choose where you want to go in the Meimei Digital and Fluxora creator ecosystem." />
  <title>Meimei Digital & Fluxora — Choose Your Destination</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&display=swap" rel="stylesheet" />
  <script>document.documentElement.classList.add("motion");</script>
  <style>
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

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      position: relative;
      isolation: isolate;
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        radial-gradient(circle at 82% 12%, rgba(207, 118, 148, 0.18), transparent 31rem),
        radial-gradient(circle at 8% 78%, rgba(124, 29, 61, 0.08), transparent 30rem),
        var(--page);
      font-family: "DM Sans", Arial, sans-serif;
      overflow-x: hidden;
    }

    body::before,
    body::after {
      content: "";
      position: fixed;
      z-index: 0;
      width: min(48vw, 680px);
      aspect-ratio: 1;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(18px);
      opacity: 0.42;
      will-change: transform;
    }

    body::before {
      top: -20vw;
      right: -14vw;
      background: radial-gradient(circle, rgba(207, 118, 148, 0.32), rgba(207, 118, 148, 0.08) 48%, transparent 72%);
      animation: ambient-one 16s ease-in-out infinite alternate;
    }

    body::after {
      left: -18vw;
      top: 48vh;
      background: radial-gradient(circle, rgba(124, 29, 61, 0.17), rgba(207, 118, 148, 0.07) 45%, transparent 72%);
      animation: ambient-two 20s ease-in-out infinite alternate;
    }

    a { color: inherit; text-decoration: none; }

    .page-shell {
      position: relative;
      z-index: 1;
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
      box-shadow: 0 0 0 0 rgba(124, 29, 61, 0.14);
      animation: moon-breathe 5.5s ease-in-out infinite;
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
      letter-spacing: -0.025em;
    }

    .brand-copy span {
      display: block;
      margin-top: 6px;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .hero {
      position: relative;
      padding: clamp(72px, 12vw, 132px) 0 clamp(54px, 8vw, 88px);
      text-align: center;
    }

    .hero::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: 28px;
      width: 86px;
      height: 1px;
      transform: translateX(-50%);
      background: linear-gradient(90deg, transparent, rgba(124, 29, 61, 0.65), transparent);
      animation: line-breathe 4s ease-in-out infinite;
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
      transform-origin: center;
      animation: eyebrow-line 4.5s ease-in-out infinite;
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
      display: inline-block;
      color: transparent;
      font-weight: 600;
      background: linear-gradient(100deg, var(--wine) 10%, #a83c62 45%, var(--wine) 80%);
      background-size: 220% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      animation: headline-ink 7s ease-in-out infinite;
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
      perspective: 1200px;
    }

    .destination-card {
      --mx: 50%;
      --my: 50%;
      position: relative;
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr) auto;
      align-items: center;
      gap: 24px;
      min-height: 158px;
      padding: 28px 30px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 250, 247, 0.84);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      overflow: hidden;
      transform: translateZ(0);
      transition: transform 260ms cubic-bezier(.2,.7,.2,1), border-color 220ms ease, box-shadow 260ms ease, background 260ms ease;
    }

    html.motion .destination-card {
      opacity: 0;
      transform: translateY(34px) scale(0.985);
    }

    html.motion .destination-card.is-visible {
      animation: card-in 760ms var(--delay, 0ms) cubic-bezier(.18,.72,.22,1) forwards;
    }

    .destination-card::before {
      content: "";
      position: absolute;
      z-index: 2;
      inset: 0 auto 0 0;
      width: 5px;
      background: linear-gradient(var(--rose), var(--wine));
      opacity: 0;
      transform: scaleY(0.3);
      transition: opacity 220ms ease, transform 300ms cubic-bezier(.2,.7,.2,1);
    }

    .destination-card::after {
      content: "";
      position: absolute;
      z-index: 0;
      inset: -1px;
      border-radius: inherit;
      background: radial-gradient(circle 230px at var(--mx) var(--my), rgba(207, 118, 148, 0.20), rgba(207, 118, 148, 0.04) 45%, transparent 72%);
      opacity: 0;
      transition: opacity 260ms ease;
      pointer-events: none;
    }

    .destination-card > * {
      position: relative;
      z-index: 1;
    }

    .destination-card:hover,
    .destination-card:focus-within {
      transform: translateY(-7px) scale(1.006);
      border-color: rgba(124, 29, 61, 0.32);
      background: rgba(255, 250, 247, 0.94);
      box-shadow: 0 32px 72px rgba(73, 17, 36, 0.18);
    }

    .destination-card:hover::before,
    .destination-card:focus-within::before {
      opacity: 1;
      transform: scaleY(1);
    }

    .destination-card:hover::after,
    .destination-card:focus-within::after { opacity: 1; }

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
      transition: transform 300ms cubic-bezier(.2,.7,.2,1), background 260ms ease, box-shadow 260ms ease;
    }

    .destination-card:hover .card-number,
    .destination-card:focus-within .card-number {
      transform: rotate(-5deg) scale(1.07);
      background: #fffaf7;
      box-shadow: 0 10px 28px rgba(124, 29, 61, 0.12);
    }

    .card-content { min-width: 0; }

    .card-label {
      display: block;
      margin-bottom: 8px;
      color: var(--wine);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      transition: letter-spacing 240ms ease;
    }

    .card-content h2 {
      margin: 0;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(27px, 4vw, 38px);
      font-weight: 500;
      line-height: 1.08;
      letter-spacing: -0.025em;
      transition: transform 260ms cubic-bezier(.2,.7,.2,1);
    }

    .card-content p {
      max-width: 540px;
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .destination-card:hover .card-label { letter-spacing: 0.26em; }
    .destination-card:hover .card-content h2 { transform: translateX(4px); }

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
      box-shadow: 0 10px 24px rgba(124, 29, 61, 0.13);
      transition: background 180ms ease, transform 220ms cubic-bezier(.2,.7,.2,1), box-shadow 220ms ease;
    }

    .card-button::after {
      content: "↗";
      margin-left: 8px;
      font-size: 14px;
      line-height: 1;
      transition: transform 220ms ease;
    }

    .card-button:hover,
    .card-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-2px) scale(1.025);
      box-shadow: 0 14px 30px rgba(38, 13, 23, 0.22);
      outline: none;
    }

    .card-button:hover::after,
    .card-button:focus-visible::after { transform: translate(3px, -3px); }

    .card-button.disabled {
      opacity: 0.58;
      cursor: not-allowed;
      user-select: none;
      pointer-events: none;
      box-shadow: none;
    }

    .card-button.disabled::after {
      content: "";
      margin-left: 0;
    }

    .footer {
      padding: 52px 0 10px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.05em;
      animation: reveal-up 700ms 500ms ease both;
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
      from { opacity: 0; transform: translateY(34px) scale(0.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes ambient-one {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to { transform: translate3d(-7vw, 9vh, 0) scale(1.13); }
    }

    @keyframes ambient-two {
      from { transform: translate3d(0, 0, 0) scale(1.06); }
      to { transform: translate3d(9vw, -8vh, 0) scale(0.94); }
    }

    @keyframes moon-breathe {
      0%, 100% { box-shadow: 0 0 0 0 rgba(124, 29, 61, 0.10); transform: translateY(0); }
      50% { box-shadow: 0 0 0 8px rgba(124, 29, 61, 0.035); transform: translateY(-1px); }
    }

    @keyframes headline-ink {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes eyebrow-line {
      0%, 100% { transform: scaleX(0.78); opacity: 0.52; }
      50% { transform: scaleX(1.08); opacity: 0.85; }
    }

    @keyframes line-breathe {
      0%, 100% { opacity: 0.28; transform: translateX(-50%) scaleX(0.72); }
      50% { opacity: 0.8; transform: translateX(-50%) scaleX(1.2); }
    }

    @media (max-width: 760px) {
      .page-shell {
        width: min(100% - 24px, 620px);
        padding-top: 18px;
      }

      .hero { padding-top: 68px; }
      h1 { font-size: clamp(50px, 15vw, 72px); }

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

    @media (max-width: 520px) {
      .brand-copy strong { font-size: 20px; }
      .brand-copy span { font-size: 7px; letter-spacing: 0.18em; }
    }

    @media (max-width: 420px) {
      .hero { padding-top: 56px; }
      .eyebrow::before, .eyebrow::after { width: 20px; }
      .destination-card { grid-template-columns: 1fr; }
      .card-number { margin-bottom: 2px; }
      .card-button { grid-column: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
      html.motion .destination-card {
        opacity: 1;
        transform: none;
      }
    }
  </style>
</head>
<body>
  <main class="page-shell">
    <a class="brand" href="#top" aria-label="Meimei Digital and Fluxora home">
      <span class="moon" aria-hidden="true"></span>
      <span class="brand-copy"><strong>Meimei Digital &amp; Fluxora</strong><span>Create. Ideate. Generate.</span></span>
    </a>

    <section class="hero" id="top">
      <div class="eyebrow">Choose your destination</div>
      <h1>Welcome, where do you want to <em>go?</em></h1>
      <p>Select a destination below and continue directly to the Fluxora resource that fits what you need.</p>
    </section>

    <section class="destination-list" aria-label="Meimei Digital and Fluxora destinations">
      <article class="destination-card" style="--delay:0ms">
        <div class="card-number" aria-hidden="true">01</div>
        <div class="card-content"><span class="card-label">Community</span><h2>AI Creator Community</h2><p>Join creators sharing practical experiments, useful feedback, resources, and repeatable workflows.</p></div>
        <a class="card-button" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Join Community</a>
      </article>

      <article class="destination-card" style="--delay:60ms">
        <div class="card-number" aria-hidden="true">02</div>
        <div class="card-content"><span class="card-label">Tools</span><h2>Automation Tools</h2><p>Explore practical tools and creator-focused systems designed to make your workflow faster and easier.</p></div>
        <a class="card-button" href="/tools" target="_blank" rel="noopener noreferrer">View Tools</a>
      </article>

      <article class="destination-card" style="--delay:80ms">
        <div class="card-number" aria-hidden="true">03</div>
        <div class="card-content"><span class="card-label">Gallery</span><h2>Prompt Gallery</h2><p>Discover, study, copy, and adapt prompts behind standout AI visuals and creator-ready concepts.</p></div>
        <a class="card-button" href="https://fluxora-prompt-gallery.vercel.app" target="_blank" rel="noopener noreferrer">View Gallery</a>
      </article>

      <article class="destination-card" style="--delay:80ms">
        <div class="card-number" aria-hidden="true">04</div>
        <div class="card-content"><span class="card-label">Learning</span><h2>AI Course</h2><p>Learn practical AI content workflows through structured lessons built for creators and online sellers.</p></div>
        <a class="card-button" href="https://curzzo.com/communities/ai-content-creation-academy" target="_blank" rel="noopener noreferrer">View Course</a>
      </article>

      <article class="destination-card" style="--delay:80ms">
        <div class="card-number" aria-hidden="true">05</div>
        <div class="card-content"><span class="card-label">Updates</span><h2>Facebook Page</h2><p>Follow the official page for new resources, announcements, updates, and creator opportunities.</p></div>
        <a class="card-button" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Follow Page</a>
      </article>

      <article class="destination-card" style="--delay:80ms">
        <div class="card-number" aria-hidden="true">06</div>
        <div class="card-content"><span class="card-label">Plans</span><h2>Fluxora Pricing</h2><p>Explore Fluxora access plans and choose the level that best matches your creative goals.</p></div>
        <a class="card-button" href="/pricing" target="_blank" rel="noopener noreferrer">View Pricing</a>
      </article>

      <article class="destination-card" style="--delay:80ms">
        <div class="card-number" aria-hidden="true">07</div>
        <div class="card-content"><span class="card-label">Fashion</span><h2>Karousel Clothing</h2><p>Discover curated clothing finds, outfit inspiration, and affiliate shopping recommendations.</p></div>
        <a class="card-button" href="https://karousel.shop" target="_blank" rel="noopener noreferrer">Explore Clothing</a>
      </article>
    </section>

    <footer class="footer">Fluxora · Turn ideas into actual results.</footer>
  </main>

  <script>
    (function () {
      var cards = Array.prototype.slice.call(document.querySelectorAll(".destination-card"));
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || !("IntersectionObserver" in window)) {
        cards.forEach(function (card) { card.classList.add("is-visible"); });
      } else {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.16, rootMargin: "0px 0px -5% 0px" });

        cards.forEach(function (card) { observer.observe(card); });
      }

      if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
        cards.forEach(function (card) {
          card.addEventListener("pointermove", function (event) {
            var rect = card.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 100;
            var y = ((event.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty("--mx", x + "%");
            card.style.setProperty("--my", y + "%");
          });
        });
      }
    })();
  </script>
</body>
</html>`;