/** Public canonical origin used for metadata, robots and sitemap output. */
export function getPublicSiteUrl(): URL {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!configured) return new URL("http://localhost:3015");
  return new URL(
    configured.startsWith("http") ? configured : `https://${configured}`,
  );
}

/** Local, preview and demo deployments should not compete with production in search. */
export function isPublicIndexingEnabled(): boolean {
  if (process.env.DEMO_DATA === "true") return false;
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.PUBLIC_INDEXING_ENABLED === "true";
}
