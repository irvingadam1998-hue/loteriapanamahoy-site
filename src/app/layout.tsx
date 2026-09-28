import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdProvider } from "@/components/ads";
import { getPublicSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import "./customer-ui.css";
export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  alternates: { canonical: "/" },
  title: {
    default: "Suerte Panamá · Resultados de lotería y comprobador",
    template: "%s | Suerte Panamá",
  },
  description:
    "Consulta resultados de Dominical, Miércolito y Gordito del Zodíaco. Comprueba tu billete o chance de la lotería de Panamá, gratis y sin registro.",
  openGraph: {
    title: "Suerte Panamá · ¿Salió tu número?",
    description: "Tus resultados de lotería, en un solo lugar.",
    locale: "es_PA",
    type: "website",
    siteName: "Suerte Panamá",
    url: "/",
  },
  robots: isPublicIndexingEnabled()
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
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
  return (
    <html lang="es">
      <body>
        <Theme
          appearance="light"
          accentColor="blue"
          grayColor="slate"
          radius="large"
          scaling="100%"
        >
          <a className="skip-link" href="#contenido">
            Ir al contenido
          </a>
          <Header />
          {children}
          <Footer />
          <AdProvider />
        </Theme>
      </body>
    </html>
  );
}
