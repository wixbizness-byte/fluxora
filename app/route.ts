import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const homepageStyles = String.raw`
    /* Fluxora premium directory */
    body {
      font-family: "Inter", Arial, sans-serif;
    }

    .page-shell {
      width: min(1180px, calc(100% - 40px));
      padding: 18px 0 44px;
    }

    .hero {
      padding: 36px 12px 42px;
      text-align: center;
    }

    .hero::after {
      display: none;
    }

    h1 {
      max-width: 720px;
      margin: 0 auto;
      padding: 0;
      font-family: "Inter", Arial, sans-serif;
      font-size: clamp(44px, 4.4vw, 58px);
      font-weight: 650;
      line-height: 1.02;
      letter-spacing: -0.055em;
      color: var(--ink);
    }

    h1 em {
      display: inline;
      padding: 0;
      margin: 0;
      color: var(--wine);
      font-family: inherit;
      font-style: normal;
      font-weight: inherit;
      background: none;
      -webkit-text-fill-color: currentColor;
    }

    .start-fluxora-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: min(100%, 320px);
      min-height: 52px;
      margin: 22px auto 0;
      padding: 13px 22px;
      border: 1px solid var(--wine);
      border-radius: 14px;
      background: var(--wine);
      color: #fff;
      font-family: "Inter", Arial, sans-serif;
      font-size: 14px;
      font-weight: 650;
      letter-spacing: -0.015em;
      box-shadow: 0 8px 22px rgba(124, 29, 61, 0.12);
      transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
      animation: reveal-up 650ms 120ms ease both;
    }

    .start-fluxora-button::after {
      content: "→";
      margin-left: 9px;
      font-size: 16px;
      font-weight: 500;
    }

    .start-fluxora-button:hover,
    .start-fluxora-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-1px);
      box-shadow: 0 10px 26px rgba(38, 13, 23, 0.16);
      outline: none;
    }

    .destination-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      perspective: none;
    }

    .destination-card {
      display: grid;
      grid-template-columns: 30px minmax(0, 1fr);
      grid-template-rows: 1fr auto;
      column-gap: 12px;
      row-gap: 14px;
      align-items: start;
      min-height: 178px;
      padding: 22px;
      border: 1px solid rgba(75, 16, 36, 0.11);
      border-radius: 17px;
      background: rgba(255, 252, 249, 0.9);
      box-shadow: 0 4px 16px rgba(73, 17, 36, 0.045);
      backdrop-filter: blur(8px);
      cursor: pointer;
      overflow: hidden;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background 160ms ease;
    }

    .destination-card::before {
      display: none;
    }

    .destination-card::after {
      display: none;
    }

    .destination-card:hover,
    .destination-card:focus-within,
    .destination-card:focus-visible {
      transform: translateY(-2px);
      border-color: rgba(124, 29, 61, 0.2);
      background: #fffdfa;
      box-shadow: 0 8px 24px rgba(73, 17, 36, 0.07);
      outline: none;
    }

    .card-number {
      display: block;
      width: auto;
      height: auto;
      padding-top: 2px;
      border: 0;
      border-radius: 0;
      color: rgba(124, 29, 61, 0.58);
      background: transparent;
      box-shadow: none;
      font-family: "Inter", Arial, sans-serif;
      font-size: 10px;
      font-weight: 650;
      line-height: 1.2;
      letter-spacing: 0.08em;
    }

    .destination-card:hover .card-number,
    .destination-card:focus-within .card-number {
      transform: none;
      background: transparent;
      box-shadow: none;
    }

    .card-content {
      min-width: 0;
    }

    .card-label {
      display: block;
      margin: 0 0 7px;
      color: rgba(75, 16, 36, 0.55);
      font-family: "Inter", Arial, sans-serif;
      font-size: 9px;
      font-weight: 650;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .destination-card:hover .card-label {
      letter-spacing: 0.16em;
    }

    .card-content h2 {
      margin: 0;
      color: var(--ink);
      font-family: "Inter", Arial, sans-serif;
      font-size: clamp(19px, 1.7vw, 23px);
      font-weight: 650;
      line-height: 1.08;
      letter-spacing: -0.04em;
      transition: none;
    }

    .destination-card:hover .card-content h2 {
      transform: none;
    }

    .card-content p {
      display: -webkit-box;
      max-width: none;
      margin: 9px 0 0;
      overflow: hidden;
      color: rgba(75, 16, 36, 0.58);
      font-family: "Inter", Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.48;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .card-button {
      grid-column: 2;
      justify-self: start;
      width: auto;
      min-width: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
      border-radius: 0;
      background: transparent;
      color: var(--wine);
      box-shadow: none;
      font-family: "Inter", Arial, sans-serif;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: -0.01em;
      text-transform: none;
      transition: color 150ms ease, gap 150ms ease;
    }

    .card-button::after {
      content: "→";
      margin-left: 6px;
      font-size: 13px;
      line-height: 1;
      transition: transform 150ms ease;
    }

    .card-button:hover,
    .card-button:focus-visible {
      background: transparent;
      color: var(--wine-dark);
      transform: none;
      box-shadow: none;
      outline: none;
    }

    .card-button:hover::after,
    .card-button:focus-visible::after {
      transform: translateX(3px);
    }

    .footer {
      padding: 34px 0 8px;
      color: rgba(75, 16, 36, 0.42);
      font-size: 11px;
      letter-spacing: 0.02em;
    }

    @media (max-width: 900px) {
      .destination-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .page-shell {
        width: calc(100% - 24px);
        padding: 8px 0 28px;
      }

      .hero {
        padding: 18px 4px 28px;
      }

      h1 {
        max-width: 430px;
        font-size: clamp(36px, 10.5vw, 43px);
        line-height: 1.04;
        letter-spacing: -0.05em;
      }

      .start-fluxora-button {
        width: min(100%, 330px);
        min-height: 52px;
        margin-top: 18px;
        border-radius: 14px;
        font-size: 14px;
      }

      .destination-list {
        grid-template-columns: 1fr;
        gap: 9px;
      }

      .destination-card {
        grid-template-columns: 28px minmax(0, 1fr);
        column-gap: 10px;
        row-gap: 12px;
        min-height: 132px;
        padding: 17px 16px;
        border-radius: 15px;
        box-shadow: 0 3px 12px rgba(73, 17, 36, 0.04);
      }

      .card-number {
        padding-top: 1px;
        font-size: 9px;
      }

      .card-label {
        margin-bottom: 5px;
        font-size: 8px;
        letter-spacing: 0.14em;
      }

      .card-content h2 {
        font-size: clamp(19px, 5.8vw, 22px);
        line-height: 1.08;
      }

      .card-content p {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.42;
        -webkit-line-clamp: 2;
      }

      .card-button {
        font-size: 10.5px;
      }
    }
`;

const directoryInteraction = String.raw`
  <script>
    (function () {
      document.querySelectorAll(".destination-card").forEach(function (card) {
        var action = card.querySelector(".card-button");
        var heading = card.querySelector("h2");
        if (!action) return;

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "link");
        if (heading) card.setAttribute("aria-label", heading.textContent || "Open destination");

        function openDestination() {
          if (action.target === "_blank") {
            window.open(action.href, "_blank", "noopener,noreferrer");
          } else {
            window.location.href = action.href;
          }
        }

        card.addEventListener("click", function (event) {
          if (event.target.closest("a")) return;
          openDestination();
        });

        card.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDestination();
          }
        });
      });
    })();
  </script>
`;

const renderedHomeHtml = homeHtml
  .replace(
    '<meta name="description" content="Choose where you want to go in the Meimei Digital and Fluxora creator ecosystem." />',
    '<meta name="description" content="Explore Fluxora community, tools, prompts, learning, updates, and creator resources." />',
  )
  .replace(
    '<title>Meimei Digital & Fluxora — Choose Your Destination</title>',
    '<title>Fluxora — Choose Your Destination</title>\n  <link rel="icon" href="/icon.svg" type="image/svg+xml" />',
  )
  .replace(
    "family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&display=swap",
    "family=Inter:wght@400;500;600;700&display=swap",
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
    '      <h1>Welcome, where do you want to <em>go?</em></h1>',
    '      <h1>Where do you want to <em>go?</em></h1>',
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
    '<div class="card-content"><span class="card-label">Community</span><h2>AI Creator Community</h2><p>Join creators sharing practical experiments, useful feedback, resources, and repeatable workflows.</p></div>',
    '<div class="card-content"><span class="card-label">Community</span><h2>Fluxora Community</h2><p>Connect with creators sharing useful workflows, resources, experiments, and practical feedback.</p></div>',
  )
  .replace(
    '>Join Community</a>',
    '>Open community</a>',
  )
  .replace(
    '<div class="card-content"><span class="card-label">Tools</span><h2>Automation Tools</h2><p>Explore practical tools and creator-focused systems designed to make your workflow faster and easier.</p></div>',
    '<div class="card-content"><span class="card-label">Tools</span><h2>Fluxora Tools</h2><p>Access creator-focused tools and systems built to make ideas faster to execute.</p></div>',
  )
  .replace(
    '>View Tools</a>',
    '>Open tools</a>',
  )
  .replace(
    '<div class="card-content"><span class="card-label">Gallery</span><h2>Prompt Gallery</h2><p>Discover, study, copy, and adapt prompts behind standout AI visuals and creator-ready concepts.</p></div>',
    '<div class="card-content"><span class="card-label">Prompts</span><h2>Prompt Gallery</h2><p>Browse, study, copy, and adapt community-driven prompts for your next idea.</p></div>',
  )
  .replace(
    '<a class="card-button" href="https://fluxora-prompt-gallery.vercel.app" target="_blank" rel="noopener noreferrer">View Gallery</a>',
    '<a class="card-button" href="/prompts" target="_blank" rel="noopener noreferrer">Open prompts</a>',
  )
  .replace(
    '>View Course</a>',
    '>Open course</a>',
  )
  .replace(
    '>Follow Page</a>',
    '>Open Facebook</a>',
  )
  .replace(
    '      <article class="destination-card" style="--delay:80ms">\n        <div class="card-number" aria-hidden="true">06</div>\n        <div class="card-content"><span class="card-label">Plans</span><h2>Fluxora Pricing</h2><p>Explore Fluxora access plans and choose the level that best matches your creative goals.</p></div>\n        <a class="card-button" href="/pricing" target="_blank" rel="noopener noreferrer">View Pricing</a>\n      </article>\n\n',
    '',
  )
  .replace(
    '<div class="card-number" aria-hidden="true">07</div>\n        <div class="card-content"><span class="card-label">Fashion</span><h2>Karousel Clothing</h2>',
    '<div class="card-number" aria-hidden="true">06</div>\n        <div class="card-content"><span class="card-label">Fashion</span><h2>Karousel</h2>',
  )
  .replace(
    '>Explore Clothing</a>',
    '>Open Karousel</a>',
  )
  .replace('  </style>', `${homepageStyles}  </style>`)
  .replace('</body>', `${directoryInteraction}</body>`);

export function GET() {
  return new Response(renderedHomeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
