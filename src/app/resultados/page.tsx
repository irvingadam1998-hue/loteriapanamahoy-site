import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ResultsBrowser } from "@/components/results-browser";
import { AdSlot } from "@/components/ads";
import { getDraws } from "@/lib/db";
import { publicSocialMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
const resultsTitle = "Resultados de la lotería de Panamá";
const resultsDescription =
  "Consulta resultados recientes de Dominical, Miércolito, Gordito del Zodíaco y otros sorteos. Revisa los datos con la fuente oficial de la LNB.";
export const metadata = {
  alternates: { canonical: "/resultados" },
  title: resultsTitle,
  description: resultsDescription,
  ...publicSocialMetadata(resultsTitle, resultsDescription, "/resultados"),
};
export default async function ResultsPage() {
  const draws = await getDraws();
  return (
    <main id="contenido" className="container page-content results-page">
      <div className="page-heading">
        <span className="eyebrow">RESULTADOS DE LOTERÍA EN PANAMÁ</span>
        <h1>
          Sorteos y resultados<span className="text-blue">.</span>
        </h1>
        <p>
          Consulta los números publicados por modalidad, fecha o número de
          sorteo.
        </p>
        <div className="results-page-meta">
          <span>
            <CalendarBlank size={16} weight="duotone" />{" "}
            {draws.filter((d) => d.status === "published").length} sorteos
            publicados
          </span>
          <span>
            <ShieldCheck size={16} weight="duotone" /> Datos ingresados y
            revisados manualmente
          </span>
        </div>
      </div>
      <AdSlot />
      <ResultsBrowser draws={draws} />
    </main>
  );
}
