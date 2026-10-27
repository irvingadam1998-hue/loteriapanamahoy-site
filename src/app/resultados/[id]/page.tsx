import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { getDraw, getDraws } from "@/lib/db";
import { KINDS, checkerDrawData, dateLabel, money } from "@/lib/lottery";
import { Checker } from "@/components/checker";
import { DrawTicket } from "@/components/draw-ticket";
import { DrawViews } from "@/components/draw-views";
import { AdSlot } from "@/components/ads";
import { getPublicSiteUrl, publicSocialMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const draw = await getDraw(id);
  const title = draw
    ? `${draw.title || KINDS[draw.kind].name} · ${dateLabel(draw.date)}`
    : "Sorteo no encontrado";
  const description = draw
    ? `Resultados del sorteo ${draw.number} de ${draw.title || KINDS[draw.kind].name}, publicado el ${dateLabel(draw.date)}. Comprueba tu billete o chance y confirma en la LNB.`
    : "No encontramos este sorteo. Explora los resultados de lotería publicados en Panamá.";
  return {
    alternates: { canonical: `/resultados/${id}` },
    title,
    description,
    ...publicSocialMetadata(title, description, `/resultados/${id}`),
    ...(!draw || draw.isDemo || draw.status !== "published"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
export default async function DrawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const draw = await getDraw((await params).id);
  if (!draw) notFound();
  const drawUrl = `${getPublicSiteUrl().origin}/resultados/${draw.id}`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${draw.title || KINDS[draw.kind].name} · ${dateLabel(draw.date)}`,
    description: `Resultado informativo del sorteo ${draw.number}. Confirma los premios en el sitio oficial de la LNB.`,
    url: drawUrl,
    inLanguage: "es-PA",
    isPartOf: {
      "@type": "WebSite",
      name: "loteriapanamahoy.site",
      url: getPublicSiteUrl().origin,
    },
  };
  return (
    <main id="contenido" className="container page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/resultados" className="breadcrumb">
        <ArrowLeft size={14} weight="duotone" /> Todos los resultados
      </Link>
      <div className="page-heading">
        <span className="eyebrow">
          SORTEO N.º {draw.number} {draw.isDemo && "· DEMOSTRACIÓN"}
        </span>
        <h1>
          {draw.title || KINDS[draw.kind].name}
          <span className="text-green">.</span>
        </h1>
        <p>
          {dateLabel(draw.date)} · {draw.time} · Hora de Panamá
        </p>
        {!draw.isDemo && <DrawViews id={draw.id} initialViews={draw.views || 0} />}
      </div>
      {draw.isDemo && (
        <p className="notice notice-amber">
          Este sorteo es un ejemplo ficticio. Los números y premios no son
          oficiales.
        </p>
      )}
      {!draw.isDemo && draw.status === "published" && (
        <p className="notice" role="note">
          Resultado informativo publicado por loteriapanamahoy.site. No somos la
          LNB ni estamos afiliados a ella. Confirma siempre el resultado y
          cualquier premio en la{" "}
          <a
            href="https://www.lnb.gob.pa/"
            target="_blank"
            rel="noopener noreferrer"
          >
            web oficial de la LNB
          </a>
          .
        </p>
      )}
      <div className="detail-grid">
        <div>
          <section className="detail-results" aria-label="Números ganadores">
            <DrawTicket draw={draw} variant="detail" />
          </section>
          <div className="detail-source">
            <span>
              Actualizado{" "}
              {new Intl.DateTimeFormat("es-PA", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Panama",
              }).format(new Date(draw.updatedAt))}
            </span>
            {draw.sourceUrl && (
              <a
                href={draw.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver fuente del resultado{" "}
                <ArrowUpRight size={13} weight="duotone" />
              </a>
            )}
          </div>
          {draw.notes && (
            <p className="notice" style={{ marginTop: 20 }}>
              {draw.notes}
            </p>
          )}
          <section className="detail-plan">
            <h2>Plan de premios registrado</h2>
            <p className="fine-print">
              Importes por fracción.{" "}
              {draw.isDemo
                ? "Ejemplos ilustrativos para probar el comprobador."
                : draw.rulesVerified
                  ? "Plan revisado. Confirma el cobro con la LNB."
                  : "Pendiente de verificación completa."}{" "}
              Dentro de un mismo grupo se aplica el premio mayor; los distintos
              grupos se suman.
            </p>
            {draw.rules.length ? (
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Coincidencia</th>
                    <th>Boleto</th>
                    <th>Por fracción</th>
                  </tr>
                </thead>
                <tbody>
                  {draw.rules.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.label}
                        {r.requiresExact && (
                          <span className="editor-source-hint">
                            Requiere el número exacto
                          </span>
                        )}
                        {r.group && (
                          <span className="editor-source-hint">
                            Grupo: {r.group}
                          </span>
                        )}
                      </td>
                      <td>{r.ticket}</td>
                      <td>{money(r.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="notice">
                El plan de premios aún no está cargado. Puedes consultar los
                números publicados en la parte superior.
              </p>
            )}
          </section>
        </div>
        {draw.status === "published" ? (
          <Checker draws={checkerDrawData(await getDraws())} initialDrawId={draw.id} />
        ) : (
          <AdSlot position="sidebar" />
        )}
      </div>
      <AdSlot position="bottom" />
    </main>
  );
}
