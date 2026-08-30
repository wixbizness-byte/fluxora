import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const homepageStyles = String.raw`
    /* Fluxora compact launcher */
    body {
      font-family: "Inter", Arial, sans-serif;
      background:
        radial-gradient(circle at 82% 8%, rgba(207, 118, 148, 0.10), transparent 28rem),
        #fbf7f4;
    }

    .page-shell {
      width: min(1120px, calc(100% - 32px));
      padding: 12px 0 34px;
    }

    .hero {
      padding: 24px 10px 30px;
      text-align: center;
    }

    .hero::after {
      display: none;
    }

    h1 {
      max-width: 620px;
      margin: 0 auto;
      padding: 0;
      font-family: "Inter", Arial, sans-serif;
      font-size: clamp(38px, 4vw, 52px);
      font-weight: 650;
      line-height: 1.02;
      letter-spacing: -0.055em;
      color: var(--ink);
    }

    h1 em {
      display: inline;
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
      width: min(100%, 250px);
      min-height: 46px;
      margin: 18px auto 0;
      padding: 11px 18px;
      border: 1px solid var(--wine);
      border-radius: 12px;
      background: var(--wine);
      color: #fff;
      font-family: "Inter", Arial, sans-serif;
      font-size: 13px;
      font-weight: 650;
      letter-spacing: -0.015em;
      box-shadow: 0 7px 18px rgba(124, 29, 61, 0.11);
      transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
      animation: reveal-up 600ms 100ms ease both;
    }

    .start-fluxora-button::after {
      content: "→";
      margin-left: 8px;
      font-size: 14px;
    }

    .start-fluxora-button:hover,
    .start-fluxora-button:focus-visible {
      background: var(--wine-dark);
      transform: translateY(-1px);
      box-shadow: 0 9px 22px rgba(38, 13, 23, 0.14);
      outline: none;
    }

    .destination-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      perspective: none;
    }

    .destination-card {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 164px;
      padding: 17px;
      border: 1px solid rgba(75, 16, 36, 0.10);
      border-radius: 15px;
      background: rgba(255, 253, 251, 0.96);
      box-shadow: 0 3px 12px rgba(73, 17, 36, 0.035);
      backdrop-filter: none;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, background 150ms ease;
    }

    .destination-card::before,
    .destination-card::after {
      display: none;
    }

    .destination-card:hover,
    .destination-card:focus-within,
    .destination-card:focus-visible {
      transform: translateY(-2px);
      border-color: rgba(124, 29, 61, 0.20);
      background: #fff;
      box-shadow: 0 7px 20px rgba(73, 17, 36, 0.055);
      outline: none;
    }

    .card-number {
      display: block;
      width: auto;
      height: auto;
      margin: 0 0 12px;
      padding: 0;
      border: 0;
      border-radius: 0;
      color: rgba(124, 29, 61, 0.48);
      background: transparent;
      box-shadow: none;
      font-family: "Inter", Arial, sans-serif;
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
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
      flex: 1;
    }

    .card-label {
      display: block;
      margin: 0 0 5px;
      color: rgba(75, 16, 36, 0.48);
      font-family: "Inter", Arial, sans-serif;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .destination-card:hover .card-label {
      letter-spacing: 0.14em;
    }

    .card-content h2 {
      margin: 0;
      color: var(--ink);
      font-family: "Inter", Arial, sans-serif;
      font-size: clamp(18px, 1.7vw, 22px);
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
      margin: 7px 0 0;
      overflow: hidden;
      color: rgba(75, 16, 36, 0.50);
      font-family: "Inter", Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.42;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .card-button {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      width: auto;
      min-width: 0;
      min-height: 0;
      margin: 13px 0 0;
      padding: 0;
      border-radius: 0;
      background: transparent;
      color: var(--wine);
      box-shadow: none;
      font-family: "Inter", Arial, sans-serif;
      font-size: 10.5px;
      font-weight: 650;
      letter-spacing: -0.01em;
      text-transform: none;
    }

    .card-button::after {
      content: "→";
      margin-left: 5px;
      font-size: 12px;
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
      padding: 26px 0 6px;
      color: rgba(75, 16, 36, 0.36);
      font-size: 10px;
      letter-spacing: 0.02em;
    }

    @media (max-width: 760px) {
      .page-shell {
        width: calc(100% - 20px);
        padding: 6px 0 24px;
      }

      .hero {
        padding: 12px 2px 20px;
      }

      h1 {
        max-width: 360px;
        font-size: clamp(30px, 8.4vw, 36px);
        line-height: 1.04;
        letter-spacing: -0.05em;
      }

      .start-fluxora-button {
        width: min(100%, 235px);
        min-height: 44px;
        margin-top: 14px;
        border-radius: 11px;
        font-size: 12.5px;
      }

      .destination-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .destination-card {
        min-height: 126px;
        padding: 13px;
        border-radius: 13px;
      }

      .card-number {
        margin-bottom: 9px;
        font-size: 8px;
      }

      .card-label {
        margin-bottom: 4px;
        font-size: 7px;
        letter-spacing: 0.12em;
      }

      .card-content h2 {
        font-size: clamp(15px, 4.5vw, 18px);
        line-height: 1.08;
      }

      .card-content p {
        display: none;
      }

      .card-button {
        margin-top: 10px;
        font-size: 9.5px;
      }
    }

    @media (max-width: 340px) {
      .destination-list {
        grid-template-columns: 1fr;
      }

      .destination-card {
        min-height: 112px;
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
    '>Open</a>',
  )
  .replace(
    '<div class="card-content"><span class="card-label">Tools</span><h2>Automation Tools</h2><p>Explore practical tools and creator-focused systems designed to make your workflow faster and easier.</p></div>',
    '<div class="card-content"><span class="card-label">Tools</span><h2>Fluxora Tools</h2><p>Access creator-focused tools and systems built to make ideas faster to execute.</p></div>',
  )
  .replace(
    '>View Tools</a>',
    '>Open</a>',
  )
  .replace(
    '<div class="card-content"><span class="card-label">Gallery</span><h2>Prompt Gallery</h2><p>Discover, study, copy, and adapt prompts behind standout AI visuals and creator-ready concepts.</p></div>',
    '<div class="card-content"><span class="card-label">Prompts</span><h2>Prompt Gallery</h2><p>Browse, study, copy, and adapt community-driven prompts for your next idea.</p></div>',
  )
  .replace(
    '<a class="card-button" href="https://fluxora-prompt-gallery.vercel.app" target="_blank" rel="noopener noreferrer">View Gallery</a>',
    '<a class="card-button" href="/prompts" target="_blank" rel="noopener noreferrer">Open</a>',
  )
  .replace(
    '>View Course</a>',
    '>Open</a>',
  )
  .replace(
    '>Follow Page</a>',
    '>Open</a>',
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
    '>Open</a>',
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
