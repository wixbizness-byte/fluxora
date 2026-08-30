import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const renderedHomeHtml = homeHtml
  .replace(
    '<meta name="description" content="Choose where you want to go in the Meimei Digital and Fluxora creator ecosystem." />',
    '<meta name="description" content="Choose where you want to go in the Fluxora creator ecosystem." />',
  )
  .replace(
    '<title>Meimei Digital & Fluxora — Choose Your Destination</title>',
    '<title>Fluxora — Choose Your Destination</title>\n  <link rel="icon" href="/icon.svg" type="image/svg+xml" />',
  )
  .replace(
    "family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&display=swap",
    "family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap",
  )
  .replace(
    'font-family: "Fraunces", Georgia, serif;\n      font-size: clamp(54px, 9vw, 102px);\n      font-weight: 500;\n      line-height: 0.96;\n      letter-spacing: -0.055em;',
    'font-family: "Instrument Serif", Georgia, serif;\n      font-size: clamp(50px, 8vw, 88px);\n      font-weight: 400;\n      line-height: 0.98;\n      letter-spacing: -0.04em;',
  )
  .replace(
    'h1 em {\n      display: inline-block;',
    'h1 em {\n      display: inline-block;\n      font-style: italic;',
  )
  .replace(
    '    <a class="brand" href="#top" aria-label="Meimei Digital and Fluxora home">\n      <span class="moon" aria-hidden="true"></span>\n      <span class="brand-copy"><strong>Meimei Digital &amp; Fluxora</strong><span>Create. Ideate. Generate.</span></span>\n    </a>\n\n',
    '',
  )
  .replace(
    '      <div class="eyebrow">Choose your destination</div>\n',
    '',
  )
  .replace(
    '      <p>Select a destination below and continue directly to the Fluxora resource that fits what you need.</p>',
    '      <a class="start-fluxora-button" href="/start">Start with Fluxora</a>',
  )
  .replace(
    '    <section class="destination-list" aria-label="Meimei Digital and Fluxora destinations">',
    '    <section class="destination-list" aria-label="Fluxora destinations">',
  )
  .replace(
    '      content: "↗";',
    '      content: "→";',
  )
  .replace(
    '  </style>',
    `    /* Homepage refinement layer */
    .hero {
      padding-top: clamp(36px, 6vw, 68px);
      padding-bottom: clamp(36px, 5vw, 56px);
    }

    .hero::after {
      bottom: 12px;
    }

    .start-fluxora-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: min(100%, 340px);
      min-height: 54px;
      margin: 22px auto 0;
      padding: 13px 24px;
      border-radius: 18px;
      background: var(--wine);
      color: var(--white);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.015em;
      box-shadow: 0 10px 24px rgba(124, 29, 61, 0.15);
      transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
      animation: reveal-up 800ms 230ms ease both;
    }

    .start-fluxora-button:hover,
    .start-fluxora-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(38, 13, 23, 0.2);
      outline: none;
    }

    .card-content h2 {
      font-family: "DM Sans", Arial, sans-serif;
      font-weight: 600;
      letter-spacing: -0.035em;
    }

    .card-number {
      font-family: "DM Sans", Arial, sans-serif;
      font-weight: 700;
    }

    @media (max-width: 760px) {
      .page-shell {
        width: min(100% - 20px, 620px);
        padding: 8px 0 36px;
      }

      .hero {
        padding: 18px 6px 30px;
      }

      .hero::after {
        display: none;
      }

      h1 {
        max-width: 560px;
        padding: 0;
        font-size: clamp(46px, 13vw, 58px);
        line-height: 0.98;
        letter-spacing: -0.038em;
      }

      h1 em {
        padding: 0;
        margin: 0;
      }

      .start-fluxora-button {
        width: min(90%, 360px);
        min-height: 56px;
        margin-top: 18px;
        padding: 14px 22px;
        border-radius: 17px;
        font-size: 14px;
      }

      .destination-list {
        gap: 11px;
      }

      .destination-card {
        grid-template-columns: 44px minmax(0, 1fr);
        column-gap: 13px;
        row-gap: 11px;
        min-height: 0;
        padding: 17px 16px 16px;
        border-radius: 20px;
        box-shadow: 0 12px 30px rgba(73, 17, 36, 0.10);
        backdrop-filter: blur(10px);
      }

      .card-number {
        align-self: start;
        width: 44px;
        height: 44px;
        font-size: 15px;
      }

      .card-label {
        margin-bottom: 4px;
        font-size: 8px;
        letter-spacing: 0.18em;
      }

      .card-content h2 {
        font-size: clamp(22px, 6.3vw, 27px);
        line-height: 1.04;
      }

      .card-content p {
        display: -webkit-box;
        max-width: none;
        margin-top: 6px;
        overflow: hidden;
        font-size: 13px;
        line-height: 1.42;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .card-button {
        grid-column: 1 / -1;
        width: 100%;
        min-width: 0;
        min-height: 47px;
        margin-top: 1px;
        padding: 11px 16px;
        border-radius: 14px;
        font-size: 11px;
        letter-spacing: 0.045em;
      }

      .card-button::after {
        margin-left: 7px;
        font-size: 13px;
      }
    }

    @media (max-width: 420px) {
      .hero {
        padding-top: 14px;
      }

      h1 {
        font-size: clamp(43px, 12.6vw, 53px);
      }

      .destination-card {
        grid-template-columns: 42px minmax(0, 1fr);
        padding: 15px 14px 14px;
        border-radius: 18px;
      }

      .card-number {
        width: 42px;
        height: 42px;
      }

      .card-button {
        grid-column: 1 / -1;
      }
    }

  </style>`,
  )
  .replace(
    '<a class="card-button" href="https://fluxora-prompt-gallery.vercel.app" target="_blank" rel="noopener noreferrer">View Gallery</a>',
    '<a class="card-button" href="/prompts" target="_blank" rel="noopener noreferrer">View Gallery</a>',
  )
  .replace(
    '      <article class="destination-card" style="--delay:80ms">\n        <div class="card-number" aria-hidden="true">06</div>\n        <div class="card-content"><span class="card-label">Plans</span><h2>Fluxora Pricing</h2><p>Explore Fluxora access plans and choose the level that best matches your creative goals.</p></div>\n        <a class="card-button" href="/pricing" target="_blank" rel="noopener noreferrer">View Pricing</a>\n      </article>\n\n',
    '',
  )
  .replace(
    '<div class="card-number" aria-hidden="true">07</div>\n        <div class="card-content"><span class="card-label">Fashion</span><h2>Karousel Clothing</h2>',
    '<div class="card-number" aria-hidden="true">06</div>\n        <div class="card-content"><span class="card-label">Fashion</span><h2>Karousel Clothing</h2>',
  );

export function GET() {
  return new Response(renderedHomeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
