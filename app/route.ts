import { homeHtml } from "./home-html";

export const dynamic = "force-static";

export function GET() {
  return new Response(homeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
