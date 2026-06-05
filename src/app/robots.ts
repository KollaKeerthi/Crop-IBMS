import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * TODO (do this before launch, not before):
 *
 *   1. Decide which paths should NOT be crawled (auth-gated routes, admin, search-result pages).
 *      Add them to the `disallow` array below. Defaults assume `/api/`, `/dashboard`, `/settings`
 *      are private - adjust to match your real route map.
 *   2. If you have user-generated content (profiles, posts) and want them indexed,
 *      make sure their routes are NOT in `disallow`.
 *   3. If you ever host on multiple domains (staging + prod), gate this with NODE_ENV
 *      so staging returns `Disallow: /` to keep it out of the index.
 *   4. After updating, verify with: https://search.google.com/search-console/robots-testing-tool
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
