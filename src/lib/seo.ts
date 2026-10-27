import type { Metadata } from "next";

const PRODUCTION_SITE_URL = "https://loteriapanamahoy.site";

/** Public canonical origin used for metadata, robots and sitemap output. */
export function getPublicSiteUrl(): URL {
  const production = process.env.NODE_ENV === "production";
  const candidates = [
    process.env.PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
  ];
  for (const candidate of candidates) {
    const configured = candidate?.trim();
    if (!configured) continue;
    const url = new URL(
      configured.startsWith("http") ? configured : `https://${configured}`,
    );
    if (
      production &&
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)
    )
      continue;
    if (production) {
      url.protocol = "https:";
      url.port = "";
    }
    return url;
  }
  return new URL(production ? PRODUCTION_SITE_URL : "http://localhost:3015");
}

/** Local, preview and demo deployments should not compete with production in search. */
export function isPublicIndexingEnabled(): boolean {
  if (process.env.DEMO_DATA === "true") return false;
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  if (process.env.NODE_ENV === "development") return false;
  if (process.env.PUBLIC_INDEXING_ENABLED)
    return process.env.PUBLIC_INDEXING_ENABLED === "true";
  return process.env.NODE_ENV === "production";
}

export function publicSocialMetadata(
  title: string,
  description: string,
  path: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const socialTitle = `${title} | loteriapanamahoy.site`;
  return {
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: "loteriapanamahoy.site",
      locale: "es_PA",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Logo de Sorteos de Panamá LPH",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: "/opengraph-image",
          alt: "Logo de Sorteos de Panamá LPH",
        },
      ],
    },
  };
}
