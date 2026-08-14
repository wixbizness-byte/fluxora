import { homeHtml } from "./home-html";

export const dynamic = "force-static";

const homeDemoVideoUrl = "https://res.cloudinary.com/rnoci6nz/video/upload/v1786668585/1786667079035934_mwubv9.mp4";

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
    '    .destination-list {',
    `    .home-demo {\n      width: min(760px, 100%);\n      margin: 0 auto 34px;\n      animation: reveal-up 800ms 320ms ease both;\n    }\n\n    .home-demo-frame {\n      width: 100%;\n      aspect-ratio: 4 / 3;\n      overflow: hidden;\n      border: 1px solid rgba(75, 16, 36, 0.18);\n      border-radius: 26px;\n      background: #160d12;\n      box-shadow: 0 24px 60px rgba(73, 17, 36, 0.14);\n    }\n\n    .home-demo-video {\n      display: block;\n      width: 100%;\n      height: 100%;\n      object-fit: contain;\n      background: #160d12;\n    }\n\n    @media (max-width: 760px) {\n      .home-demo { margin-bottom: 24px; }\n      .home-demo-frame { border-radius: 20px; }\n    }\n\n    .destination-list {`,
  )
  .replace(
    '    <section class="destination-list" aria-label="Meimei Digital and Fluxora destinations">',
    `    <section class="home-demo" aria-label="Fluxora video introduction">\n      <div class="home-demo-frame">\n        <video class="home-demo-video" controls playsinline preload="metadata" aria-label="Fluxora introduction video">\n          <source src="${homeDemoVideoUrl}" type="video/mp4" />\n          Your browser does not support HTML video.\n        </video>\n      </div>\n    </section>\n\n    <section class="destination-list" aria-label="Meimei Digital and Fluxora destinations">`,
  );

export function GET() {
  return new Response(renderedHomeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
