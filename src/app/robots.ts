import type { MetadataRoute } from "next";
import { getPublicSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const url = getPublicSiteUrl().origin;
  const indexable = isPublicIndexingEnabled();
  return {
    rules: {
      userAgent: "*",
      ...(!indexable
        ? { disallow: "/" }
        : { allow: "/", disallow: "/api/" }),
    },
    ...(indexable ? { sitemap: `${url}/sitemap.xml` } : {}),
  };
}
