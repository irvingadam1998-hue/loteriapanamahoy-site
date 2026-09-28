import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
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
export function NumberBalls({
  number,
  small = false,
}: {
  number: string;
  small?: boolean;
}) {
  return (
    <span
      className={`number-balls ${small ? "small" : ""}`}
      aria-label={number}
    >
      {number.split("").map((digit, i) => (
        <span aria-hidden="true" key={i}>
          {digit}
        </span>
      ))}
    </span>
  );
}
export function DrawCard({ draw }: { draw: Draw }) {
  const info = KINDS[draw.kind];
  return (
    <article className={`draw-card theme-${info.color}`}>
      <div className="draw-ticket-masthead">
        <span className="draw-icon">
          <DrawIcon kind={draw.kind} />
        </span>
        <span className="draw-ticket-brand">
          <small>RESULTADO · LOTERÍA DE PANAMÁ</small>
          <b>{draw.title || info.name}</b>
        </span>
        {draw.isDemo && <span className="demo-tag">EJEMPLO</span>}
      </div>
      <div className="draw-ticket-meta">
        <span>{dateLabel(draw.date, true)}</span>
        <b>SORTEO N.º {draw.number}</b>
      </div>
      {draw.status === "scheduled" ? (
        <div className="pending-result">
          <CalendarBlank weight="duotone" />
          <strong>Resultado pendiente</strong>
          <span>Hora programada: {draw.time} · Panamá</span>
        </div>
      ) : (
        <>
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
      <Link className="draw-card-link" href={`/resultados/${draw.id}`}>
        Abrir este resultado <ArrowUpRight size={17} weight="duotone" />
      </Link>
    </article>
  );
}
