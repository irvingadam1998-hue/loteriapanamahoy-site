import type { Metadata } from "next";
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdProvider } from "@/components/ads";
import { getPublicSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";
import { BRAND_THEME } from "../../brand-theme";
import "./globals.css";
import "./customer-ui.css";
const dmSans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  title: {
    default: "Resultados de la Lotería de Panamá | loteriapanamahoy.site",
    template: "%s | loteriapanamahoy.site",
  },
  description:
    "Consulta resultados de Dominical, Miércolito y Gordito del Zodíaco en Panamá. Comprueba tu billete o chance gratis y confirma premios en la fuente oficial de la LNB.",
  applicationName: "loteriapanamahoy.site",
  icons: {
    icon: [
      { url: "/icon-lph-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-lph-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-lph-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  creator: "loteriapanamahoy.site",
  publisher: "loteriapanamahoy.site",
  category: "informational",
  authors: [{ name: "loteriapanamahoy.site" }],
  alternates: { canonical: "/" },
  keywords: [
    "lotería de Panamá",
    "resultados de lotería Panamá",
    "lotería Panamá hoy",
    "resultados Dominical",
    "resultados Miércolito",
    "Gordito del Zodíaco",
    "comprobar billete de lotería",
    "comprobar chance Panamá",
  ],
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
    : undefined,
  openGraph: {
    title: "Resultados de la Lotería de Panamá | loteriapanamahoy.site",
    description:
      "Consulta resultados y comprueba billetes y chances. Información independiente; verifica premios con la LNB.",
    locale: "es_PA",
    type: "website",
    siteName: "loteriapanamahoy.site",
    url: "/",
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
    title: "Resultados de la Lotería de Panamá | loteriapanamahoy.site",
    description:
      "Resultados y comprobador de billetes y chances. Confirma premios en la web oficial de la LNB.",
    images: [
      {
        url: "/opengraph-image",
        alt: "Logo de Sorteos de Panamá LPH",
      },
    ],
  },
  robots: isPublicIndexingEnabled()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getPublicSiteUrl().origin;
  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "loteriapanamahoy.site",
    alternateName: "Sorteos de Panamá",
    url: siteUrl,
    inLanguage: "es-PA",
    image: new URL("/logo-sorteos-panama.png", siteUrl).toString(),
    publisher: {
      "@type": "Organization",
      name: "Sorteos de Panamá",
      url: siteUrl,
      logo: new URL("/logo-sorteos-panama.png", siteUrl).toString(),
    },
    description:
      "Sitio independiente con resultados informativos y herramientas de consulta de la lotería panameña. La fuente oficial es la Lotería Nacional de Beneficencia.",
  };
  return (
    <html
      lang="es"
      className={dmSans.variable}
      style={{
        "--brand-tone-1": BRAND_THEME.tone1,
        "--brand-tone-2": BRAND_THEME.tone2,
        "--brand-tone-3": BRAND_THEME.tone3,
        "--brand-tone-4": BRAND_THEME.tone4,
        "--brand-tone-5": BRAND_THEME.tone5,
        "--brand-accent": BRAND_THEME.accent,
      } as CSSProperties}
    >
      <body>
        <script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c"),
          }}
        />
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        <Header />
        {children}
        <Footer />
        <AdProvider />
      </body>
    </html>
  );
}
