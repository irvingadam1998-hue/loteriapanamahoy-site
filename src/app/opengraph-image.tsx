import { ImageResponse } from "next/og";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BRAND_THEME } from "../../brand-theme";

export const alt = "Logo de Sorteos de Panamá LPH y resultados de lotería";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OpenGraphImage() {
  const { env } = await getCloudflareContext({ async: true });
  const assets = (env as typeof env & { ASSETS: { fetch: (url: URL) => Promise<Response> } }).ASSETS;
  const logoResponse = await assets.fetch(new URL("/logo-sorteos-panama.png", "https://assets.local"));
  if (!logoResponse.ok) throw new Error("No se pudo cargar el logo para la imagen Open Graph.");
  const logoData = Buffer.from(await logoResponse.arrayBuffer()).toString("base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 76px",
          color: BRAND_THEME.tone1,
          background: `linear-gradient(135deg, ${BRAND_THEME.tone5} 0%, ${BRAND_THEME.tone4} 68%, ${BRAND_THEME.tone3} 100%)`,
          fontFamily: '"DM Sans", Arial, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={logoSrc} width={132} height={132} />
          <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: 1 }}>
            LOTERIAPANAMAHOY.SITE
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              maxWidth: 980,
              fontSize: 67,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
            }}
          >
            Resultados de la lotería panameña
          </div>
          <div style={{ color: BRAND_THEME.tone2, fontSize: 27 }}>
            Consulta tu billete o chance · Información independiente
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: BRAND_THEME.tone2,
          }}
        >
          <span>Dominical · Miércolito · Gordito del Zodíaco</span>
          <span>Confirma en la web oficial de la LNB</span>
        </div>
      </div>
    ),
    size,
  );
}
