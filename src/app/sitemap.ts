import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * TODO (do this before launch, not before):
 *
 *   1. Replace the placeholder static routes below with your real public route map.
 *      Only include URLs that should appear in search engines - skip auth-gated routes.
 *   2. For dynamic routes (e.g. `/farms/[id]`, `/crops/[slug]`), fetch the IDs/slugs from
 *      the DB inside this function and map them into the array. Example:
 *
 *        import { db } from "@/db";
 *        const farms = await db.query.farms.findMany({ columns: { slug: true, updatedAt: true } });
 *        const dynamic = farms.map((f) => ({
 *          url: `${APP_URL}/farms/${f.slug}`,
 *          lastModified: f.updatedAt,
 *          changeFrequency: "weekly" as const,
 *          priority: 0.6,
 *        }));
 *
 *   3. Tune `changeFrequency` and `priority` to reflect how often each page actually changes.
 *      Don't over-promise - search engines treat these as hints, not guarantees.
 *   4. After updating, submit `https://your-domain.com/sitemap.xml` to Google Search Console.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    // TODO: add public marketing pages (/about, /pricing, /blog, etc.)
    // TODO: add dynamic routes (fetch IDs/slugs from the DB)
  ];
}
