import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";
import { Checker } from "@/components/checker";
import { ResultsBrowser } from "@/components/results-browser";
import { AdSlot } from "@/components/ads";
import { NumberBalls, DrawIcon } from "@/components/draw-card";
import { getDraws, StorageError } from "@/lib/db";
import { KINDS, dateLabel, type Draw } from "@/lib/lottery";
export const dynamic = "force-dynamic";
export default async function Home() {
  let draws: Draw[] = [];
  let unavailable = false;
  try {
    draws = await getDraws();
  } catch (error) {
    if (!(error instanceof StorageError)) throw error;
    unavailable = true;
  }
  const latest = draws.find((d) => d.status === "published");
  const demo = draws.some((d) => d.isDemo);
  return (
    <main id="contenido">
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-heading">
            <span className="home-kicker">
              <span className="live-dot" /> LA LOTERÍA PANAMEÑA, A MANO
            </span>
            <h1>
              Comprueba tu número. <span>Y sigue soñando.</span>
            </h1>
            <p>
              Resultados claros de la Lotería de Panamá y una forma sencilla de
              revisar tu billete o chance.
            </p>
            <div className="home-hero-proof">
              <span>
                <ShieldCheck size={16} weight="duotone" /> Gratis y sin registro
              </span>
              <span>
                <CheckCircle size={16} weight="duotone" /> Datos revisados
              </span>
            </div>
          </div>
          <div className="home-hero-grid">
            <Checker draws={draws} wide />
            <aside className="latest-draw-card">
              <div className="latest-draw-header">
                <span className="latest-draw-icon">
                  {latest ? (
                    <DrawIcon kind={latest.kind} size={19} />
                  ) : (
                    <CalendarBlank size={19} weight="duotone" />
                  )}
                </span>
                <div>
                  <small>EL ÚLTIMO SORTEO</small>
                  <strong>
                    {latest ? KINDS[latest.kind].name : "Resultados"}
                  </strong>
                </div>
                <span className="latest-draw-status">
                  {latest ? (latest.isDemo ? "DEMO" : "PUBLICADO") : "PRONTO"}
                </span>
              </div>
              {latest ? (
                <>
                  <p className="latest-draw-date">
                    Sorteo N.º {latest.number}
                    <span />
                    {dateLabel(latest.date, true)}
                  </p>
                  <div className="latest-draw-prize-label">PRIMER PREMIO</div>
                  <NumberBalls number={latest.first} />
                  <div className="latest-draw-other-prizes">
                    <span>
                      <small>2.º premio</small>
                      <b>{latest.second}</b>
                    </span>
                    <span>
                      <small>3.º premio</small>
                      <b>{latest.third}</b>
                    </span>
                  </div>
                  <p className="latest-draw-extras">
                    {latest.letters && (
                      <span>
                        Letras <b>{latest.letters}</b>
                      </span>
                    )}
                    {latest.series && (
                      <span>
                        Serie <b>{latest.series}</b>
                      </span>
                    )}
                    {latest.folio && (
                      <span>
                        Folio <b>{latest.folio}</b>
                      </span>
                    )}
                  </p>
                  <Link
                    href={`/resultados/${latest.id}`}
                    className="latest-draw-link"
                  >
                    Ver resultado completo{" "}
                    <ArrowUpRight size={16} weight="duotone" />
                  </Link>
                </>
              ) : (
                <>
                  <h2>Aún no hay sorteos publicados</h2>
                  <p className="latest-draw-date">
                    Cuando agreguemos un resultado, podrás comprobar aquí tu
                    número.
                  </p>
                  <a
                    className="latest-draw-link"
                    href="https://www.lnb.gob.pa/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar la LNB <ArrowUpRight size={16} weight="duotone" />
                  </a>
                </>
              )}
            </aside>
          </div>
          <div className="home-hero-disclaimer">
            <span>
              <ShieldCheck size={15} weight="duotone" /> Tu número no se guarda
            </span>
            <span>
              Somos un servicio independiente. Confirma los premios con la LNB.
            </span>
            <a href="https://www.lnb.gob.pa/" target="_blank" rel="noreferrer">
              Fuente oficial <ArrowUpRight size={14} weight="duotone" />
            </a>
          </div>
        </div>
      </section>
      <div className="container home-content">
        {unavailable && (
          <p className="storage-public-error" role="status">
            No podemos consultar los resultados en este momento. Vuelve a
            intentarlo pronto.
          </p>
        )}
        {demo && (
          <div className="demo-notice">
            <span className="demo-tag">MODO DEMOSTRACIÓN</span>
            <span>
              Los números visibles son ejemplos. Activa datos reales desde el
              panel al publicar.
            </span>
          </div>
        )}
        <AdSlot />
        <section className="results-section" id="resultados">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SORTEOS PUBLICADOS</span>
              <h2>
                Resultados recientes<span className="text-blue">.</span>
              </h2>
            </div>
            <Link href="/resultados" className="history-link">
              Ver todos <ArrowRight size={15} weight="duotone" />
            </Link>
          </div>
          <ResultsBrowser draws={draws} compact />
        </section>
        <AdSlot position="bottom" />
        <section className="how-section">
          <div className="how-intro">
            <span className="eyebrow">FÁCIL Y TRANSPARENTE</span>
            <h2>Revisar tu número toma un momento.</h2>
            <p>Prepara tu boleto y elige el sorteo correcto.</p>
            <Link href="/como-funciona" className="text-link">
              Cómo funciona <ArrowRight size={16} weight="duotone" />
            </Link>
          </div>
          <div className="how-steps">
            {[
              {
                icon: Ticket,
                title: "Elige tu sorteo",
                text: "Selecciona la fecha y modalidad indicadas en tu boleto.",
              },
              {
                icon: MagnifyingGlass,
                title: "Escribe tu número",
                text: "Conserva los ceros al inicio e incluye fracción si aplica.",
              },
              {
                icon: CheckCircle,
                title: "Consulta el resultado",
                text: "Te mostramos las coincidencias y los premios publicados.",
              },
            ].map((item, i) => (
              <div className="how-step" key={item.title}>
                <span className={`step-icon step-${i}`}>
                  <item.icon size={25} weight="duotone" />
                </span>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="kind-strip">
          <div>
            <span className="eyebrow">SORTEOS DE PANAMÁ</span>
            <h2>Encuentra tu modalidad</h2>
          </div>
          <div className="kind-list">
            {Object.entries(KINDS).map(([id, kind]) => (
              <Link href="/resultados" key={id}>
                <span className={`kind-mark theme-${kind.color}`}>
                  <DrawIcon kind={id as keyof typeof KINDS} size={20} />
                </span>
                <span>
                  <b>{kind.name}</b>
                  <small>Ver resultados</small>
                </span>
                <ArrowUpRight size={15} weight="duotone" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
