import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const renderedHomeHtml = homeHtml
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
