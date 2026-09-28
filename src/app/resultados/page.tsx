import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ResultsBrowser } from "@/components/results-browser";
import { AdSlot } from "@/components/ads";
import { getDraws } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = {
  alternates: { canonical: "/resultados" },
  title: "Resultados de lotería en Panamá",
  description:
    "Consulta el historial de resultados de la Lotería Nacional de Beneficencia de Panamá por sorteo, fecha y número ganador.",
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
