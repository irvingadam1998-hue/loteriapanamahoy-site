import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { type Draw, KINDS } from "@/lib/lottery";
import { DrawTicket } from "@/components/draw-ticket";
export function DrawCard({ draw }: { draw: Draw }) {
  const info = KINDS[draw.kind];
  return (
    <article className={`draw-card theme-${info.color}`}>
      <DrawTicket draw={draw} />
      {!draw.isDemo && <span className="badge badge-soft badge-sm draw-views">{new Intl.NumberFormat("es-PA").format(draw.views || 0)} {draw.views === 1 ? "vista" : "vistas"}</span>}
      <Link className="draw-card-link" href={`/resultados/${draw.id}`}>
        Abrir este resultado <ArrowUpRight size={17} weight="duotone" />
      </Link>
    </article>
  );
}
