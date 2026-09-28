import type { MetadataRoute } from "next";
import { getDraws } from "@/lib/db";
import type { Draw } from "@/lib/lottery";
import { getPublicSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getPublicSiteUrl().origin;
  if (!isPublicIndexingEnabled()) return [];
  let draws: Draw[] = [];
  try {
    draws = await getDraws();
  } catch {
    // Keep static public pages available in the sitemap during a temporary DB outage.
  }
  return [
    ...(
      [
        ["", 1],
        ["/resultados", 0.9],
        ["/como-funciona", 0.6],
        ["/contacto", 0.3],
        ["/privacidad", 0.2],
        ["/terminos", 0.2],
      ] as const
    ).map(([path, priority]) => ({ url: `${url}${path}`, priority })),
    ...draws
      .filter((d) => d.status === "published" && !d.isDemo)
      .map((d) => ({
        url: `${url}/resultados/${d.id}`,
        lastModified: new Date(d.updatedAt),
      })),
  ];
}
