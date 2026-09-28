import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { getDraw, getDraws } from "@/lib/db";
import { KINDS, dateLabel, money } from "@/lib/lottery";
import { Checker } from "@/components/checker";
import { NumberBalls } from "@/components/draw-card";
import { AdSlot } from "@/components/ads";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const draw = await getDraw((await params).id);
  return {
    alternates: { canonical: `/resultados/${(await params).id}` },
    title: draw
      ? `${draw.title || KINDS[draw.kind].name} · ${dateLabel(draw.date)}`
      : "Sorteo no encontrado",
    description: draw
      ? `Consulta los números del sorteo ${draw.number} de ${draw.title || KINDS[draw.kind].name}, publicado el ${dateLabel(draw.date)}. Revisa tu billete o chance gratis.`
      : "No encontramos este sorteo. Explora los resultados de lotería publicados en Panamá.",
    ...(draw?.isDemo ? { robots: { index: false, follow: false } } : {}),
  };
}
export default async function DrawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const draw = await getDraw((await params).id);
  if (!draw) notFound();
  return (
    <main id="contenido" className="container page-content">
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
      </div>
      {draw.isDemo && (
        <p className="notice notice-amber">
          Este sorteo es un ejemplo ficticio. Los números y premios no son
          oficiales.
        </p>
      )}
      <div className="detail-grid">
        <div>
          <section className="detail-results" aria-label="Números ganadores">
            {draw.status === "scheduled" ? (
              <div className="pending-result">
                <Clock size={35} weight="duotone" />
                <h2>Esperando el sorteo</h2>
                <p>Publicaremos los números después de revisar la fuente.</p>
              </div>
            ) : (
              <>
                <h2>El resultado del sorteo</h2>
                <div className="first-prize">
                  <span className="eyebrow">PRIMER PREMIO</span>
                  <NumberBalls number={draw.first} />
                </div>
                <div className="other-prizes">
                  <div>
                    <span>2.º premio</span>
                    <strong>{draw.second}</strong>
                  </div>
                  <span className="prize-divider" />
                  <div>
                    <span>3.º premio</span>
                    <strong>{draw.third}</strong>
                  </div>
                </div>
                <div className="draw-extras">
                  <span>
                    Letras <b>{draw.letters || "—"}</b>
                  </span>
                  <span>
                    Serie <b>{draw.series || "—"}</b>
                  </span>
                  <span>
                    Folio <b>{draw.folio || "—"}</b>
                  </span>
                </div>
              </>
            )}
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
                  ? "Revisado por el administrador. Confirma el cobro con la LNB."
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
          <Checker draws={await getDraws()} initialDrawId={draw.id} />
        ) : (
          <AdSlot position="sidebar" />
        )}
      </div>
      <AdSlot position="bottom" />
    </main>
  );
}
