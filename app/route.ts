import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const homepageStyles = String.raw`
    /* Fluxora homepage responsive refinement */
    .page-shell {
      width: min(1120px, calc(100% - 32px));
      padding: 14px 0 44px;
    }

    .hero {
      padding: 28px 12px 38px;
      text-align: center;
    }

    .hero::after {
      display: none;
    }

    h1 {
      max-width: 960px;
      margin: 0 auto;
      padding: 0;
      font-family: "DM Sans", Arial, sans-serif;
      font-size: clamp(48px, 5vw, 72px);
      font-weight: 600;
      line-height: 0.98;
      letter-spacing: -0.055em;
    }

    h1 em {
      display: inline;
      padding: 0;
      margin: 0;
      color: transparent;
      font-family: inherit;
      font-style: normal;
      font-weight: 700;
      background: linear-gradient(100deg, var(--wine) 8%, #b33a64 52%, var(--wine) 92%);
      background-size: 180% 100%;
      background-clip: text;
      -webkit-background-clip: text;
    }

    .start-fluxora-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: min(100%, 380px);
      min-height: 58px;
      margin: 24px auto 0;
      padding: 14px 26px;
      border-radius: 18px;
      background: var(--wine);
      color: var(--white);
      font-family: "DM Sans", Arial, sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
      box-shadow: 0 10px 24px rgba(124, 29, 61, 0.15);
      transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
      animation: reveal-up 700ms 160ms ease both;
    }

    .start-fluxora-button:hover,
    .start-fluxora-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(38, 13, 23, 0.2);
      outline: none;
    }

    .destination-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      perspective: none;
    }

    .destination-card {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr);
      grid-template-rows: auto auto;
      column-gap: 14px;
      row-gap: 12px;
      align-items: start;
      min-height: 0;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 12px 34px rgba(73, 17, 36, 0.10);
    }

    .card-number {
      width: 48px;
      height: 48px;
      font-family: "DM Sans", Arial, sans-serif;
      font-size: 15px;
      font-weight: 700;
    }

    .card-label {
      margin-bottom: 4px;
      font-size: 8px;
      letter-spacing: 0.18em;
    }

    .card-content h2 {
      margin: 0;
      font-family: "DM Sans", Arial, sans-serif;
      font-size: clamp(22px, 2.1vw, 28px);
      font-weight: 650;
      line-height: 1.04;
      letter-spacing: -0.04em;
    }

    .card-content p {
      display: -webkit-box;
      max-width: none;
      margin: 7px 0 0;
      overflow: hidden;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .card-button {
      grid-column: 1 / -1;
      width: 100%;
      min-width: 0;
      min-height: 48px;
      margin: 0;
      padding: 11px 16px;
      border-radius: 14px;
      font-size: 11px;
      letter-spacing: 0.04em;
    }

    .card-button::after {
      content: "→";
      margin-left: 7px;
      font-size: 13px;
    }

    .footer {
      padding-top: 34px;
    }

    @media (max-width: 760px) {
      .page-shell {
        width: min(100% - 20px, 620px);
        padding: 8px 0 32px;
      }

      .hero {
        padding: 14px 6px 26px;
      }

      h1 {
        max-width: 560px;
        font-size: clamp(42px, 12.4vw, 54px);
        line-height: 0.98;
        letter-spacing: -0.052em;
      }

      .start-fluxora-button {
        width: min(92%, 380px);
        min-height: 56px;
        margin-top: 18px;
        padding: 14px 22px;
        border-radius: 17px;
        font-size: 14px;
      }

      .destination-list {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .destination-card {
        grid-template-columns: 42px minmax(0, 1fr);
        column-gap: 12px;
        row-gap: 10px;
        padding: 15px 14px 14px;
        border-radius: 18px;
      }

      .card-number {
        width: 42px;
        height: 42px;
        font-size: 14px;
      }

      .card-content h2 {
        font-size: clamp(21px, 6vw, 26px);
      }

      .card-content p {
        margin-top: 5px;
        font-size: 12.5px;
        line-height: 1.4;
      }

      .card-button {
        min-height: 46px;
        border-radius: 13px;
      }
    }

    @media (max-width: 420px) {
      .page-shell {
        width: calc(100% - 16px);
      }

      .hero {
        padding-top: 10px;
      }

      h1 {
        font-size: clamp(40px, 11.8vw, 49px);
      }
    }
`;

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
    "family=DM+Sans:wght@400;500;600;700&display=swap",
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
  )
  .replace('  </style>', `${homepageStyles}  </style>`);

export function GET() {
  return new Response(renderedHomeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
