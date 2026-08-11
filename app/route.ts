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
  );

export function GET() {
  return new Response(renderedHomeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
