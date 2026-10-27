import { Sun } from "@phosphor-icons/react/dist/ssr/Sun";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import { Gift } from "@phosphor-icons/react/dist/ssr/Gift";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { type Draw, KINDS, dateLabel } from "@/lib/lottery";

export function DrawIcon({
  kind,
  size = 20,
}: {
  kind: Draw["kind"];
  size?: number;
}) {
  const Icon = {
    dominical: Sun,
    miercolito: Ticket,
    zodiaco: Sparkle,
    extraordinario: Star,
    especial: Gift,
  }[kind];
  return <Icon size={size} weight="duotone" />;
}

export function NumberBalls({ number }: { number: string }) {
  return (
    <span className="number-balls" role="img" aria-label={number}>
      {number.split("").map((digit, i) => (
        <span aria-hidden="true" key={i}>
          {digit}
        </span>
      ))}
    </span>
  );
}

export function DrawTicket({
  draw,
  variant = "card",
}: {
  draw: Draw;
  variant?: "card" | "detail" | "home";
}) {
  const kind = KINDS[draw.kind];
  return (
    <article className={`draw-ticket draw-ticket--${variant}`}>
      <div className="draw-ticket__stub" aria-hidden="true">
        <span>SP</span>
        <i />
        <small>{draw.number}</small>
      </div>
      <div className="draw-ticket__body">
        <header className="draw-ticket__header">
          <div className="draw-ticket__brand-mark" aria-hidden="true">
            <DrawIcon kind={draw.kind} size={variant === "detail" ? 25 : 20} />
          </div>
          <div className="draw-ticket__heading">
            <span>LOTERÍA DE PANAMÁ · RESULTADO INFORMATIVO</span>
            <h2>{draw.title || kind.name}</h2>
          </div>
          {draw.isDemo && <span className="draw-ticket__demo">EJEMPLO</span>}
        </header>

        <div className="draw-ticket__meta">
          <span>{dateLabel(draw.date, variant !== "detail")}</span>
          <b>SORTEO N.º {draw.number}</b>
        </div>

        {draw.status === "scheduled" ? (
          <div className="draw-ticket__pending">
            <CalendarBlank size={25} weight="duotone" />
            <div>
              <strong>Resultado pendiente</strong>
              <span>Hora programada: {draw.time} · Panamá</span>
            </div>
          </div>
        ) : (
          <>
            <section className="draw-ticket__winner" aria-label="Primer premio">
              <span>PRIMER PREMIO</span>
              <NumberBalls number={draw.first} />
              <small>{draw.billDigits} CIFRAS</small>
            </section>
            <section className="draw-ticket__secondary" aria-label="Segundo y tercer premio">
              <div>
                <span>2.º PREMIO</span>
                <strong>{draw.second}</strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>3.º PREMIO</span>
                <strong>{draw.third}</strong>
              </div>
            </section>
            <section className="draw-ticket__serials" aria-label="Datos del billete">
              <div><span>LETRAS</span><b>{draw.letters || "—"}</b></div>
              <div><span>SERIE</span><b>{draw.series || "—"}</b></div>
              <div><span>FOLIO</span><b>{draw.folio || "—"}</b></div>
            </section>
          </>
        )}
        {variant === "detail" && (
          <footer className="draw-ticket__foot">
            Información independiente · Verifica tu billete en la LNB
          </footer>
        )}
      </div>
    </article>
  );
}
