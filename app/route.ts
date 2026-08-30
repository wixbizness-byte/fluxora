import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const renderedHomeHtml = homeHtml
  .replace(
    '<meta name="description" content="Choose where you want to go in the Meimei Digital and Fluxora creator ecosystem." />',
    '<meta name="description" content="Choose where you want to go in the Fluxora creator ecosystem." />',
  )
  .replace(
    '<title>Meimei Digital & Fluxora — Choose Your Destination</title>',
    '<title>Fluxora — Choose Your Destination</title>',
  )
  .replace(
    "family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&display=swap",
    "family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Playfair+Display:ital,wght@0,500;1,600&display=swap",
  )
  .replace(
    'font-family: "Fraunces", Georgia, serif;\n      font-size: clamp(54px, 9vw, 102px);\n      font-weight: 500;\n      line-height: 0.96;\n      letter-spacing: -0.055em;',
    'font-family: "Playfair Display", Georgia, serif;\n      font-size: clamp(52px, 8.6vw, 98px);\n      font-weight: 500;\n      line-height: 1.08;\n      letter-spacing: -0.045em;\n      padding: 0.04em 0 0.12em;',
  )
  .replace(
    'h1 em {\n      display: inline-block;',
    'h1 em {\n      display: inline-block;\n      padding: 0 0.04em 0.08em;\n      margin-bottom: -0.08em;\n      font-style: italic;',
  )
  .replace(
    '    <a class="brand" href="#top" aria-label="Meimei Digital and Fluxora home">\n      <span class="moon" aria-hidden="true"></span>\n      <span class="brand-copy"><strong>Meimei Digital &amp; Fluxora</strong><span>Create. Ideate. Generate.</span></span>\n    </a>\n\n',
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
    '  </style>',
    `    .start-fluxora-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      margin: 28px auto 0;
      padding: 10px 18px;
      border-radius: 999px;
      background: var(--wine);
      color: var(--white);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      box-shadow: 0 9px 22px rgba(124, 29, 61, 0.14);
      transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
      animation: reveal-up 800ms 260ms ease both;
    }

    .start-fluxora-button:hover,
    .start-fluxora-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-2px);
      box-shadow: 0 12px 26px rgba(38, 13, 23, 0.2);
      outline: none;
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
