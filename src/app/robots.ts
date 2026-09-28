import type { MetadataRoute } from "next";
import { getPublicSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const url = getPublicSiteUrl().origin;
  const indexable = isPublicIndexingEnabled();
  return {
    rules: {
      userAgent: "*",
      ...(!indexable
        ? { disallow: "/" }
        : { allow: "/", disallow: ["/admin", "/api/"] }),
    },
    ...(indexable ? { sitemap: `${url}/sitemap.xml` } : {}),
  };
}
