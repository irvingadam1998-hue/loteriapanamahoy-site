"use client";
import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import Link from "next/link";
import { type Draw, type Kind, KINDS } from "@/lib/lottery";
import { DrawCard } from "./draw-card";
export function ResultsBrowser({
  draws,
  compact = false,
}: {
  draws: Draw[];
  compact?: boolean;
}) {
  const [kind, setKind] = useState<Kind | "all">("all");
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = draws.filter(
    (d) =>
      d.status === "published" &&
      (kind === "all" || d.kind === kind) &&
      (!date || d.date === date) &&
      (!query ||
        d.number.toLowerCase().includes(query.toLowerCase()) ||
        [d.first, d.second, d.third].some((n) => n.includes(query))),
  );
  // On the home page show the latest result of each modality.
  const distinct =
    compact && kind === "all"
      ? filtered
          .filter((d, i) => filtered.findIndex((x) => x.kind === d.kind) === i)
          .sort(
            (a, b) =>
              Object.keys(KINDS).indexOf(a.kind) -
              Object.keys(KINDS).indexOf(b.kind),
          )
      : filtered;
  const visible = distinct.slice(0, compact ? 3 : page * 9);
  return (
    <>
      <div className="results-toolbar">
        <div className="filter-tabs" aria-label="Filtrar por sorteo">
          <button
            type="button"
            className={kind === "all" ? "active" : ""}
            aria-pressed={kind === "all"}
            onClick={() => {
              setKind("all");
              setPage(1);
            }}
          >
            Todos los sorteos
          </button>
          {Object.entries(KINDS)
            .filter(
              ([key]) =>
                key !== "especial" || draws.some((d) => d.kind === key),
            )
            .map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={kind === key ? "active" : ""}
                aria-pressed={kind === key}
                onClick={() => {
                  setKind(key as Kind);
                  setPage(1);
                }}
              >
                {value.name}
              </button>
            ))}
        </div>
        {compact && (
          <Link href="/resultados" className="history-link">
            Ver historial <ArrowRight size={15} weight="duotone" />
          </Link>
        )}
      </div>
      {!compact && (
        <div className="history-filters">
          <div className="search-field">
            <MagnifyingGlass size={17} weight="duotone" />
            <input
              aria-label="Buscar número o sorteo"
              placeholder="Buscar número o sorteo…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <label className="date-filter">
            <CalendarBlank size={16} weight="duotone" />
            <span>Fecha</span>
            <input
              type="date"
              aria-label="Filtrar por fecha"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {(query || date) && (
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setDate("");
              }}
            >
              Limpiar filtros
            </button>
          )}
          <span className="results-count" aria-live="polite">
            <SlidersHorizontal size={14} weight="duotone" /> {filtered.length}{" "}
            resultados
          </span>
        </div>
      )}
      {visible.length ? (
        <div className="results-grid">
          {visible.map((draw) => (
            <DrawCard key={draw.id} draw={draw} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MagnifyingGlass size={32} weight="duotone" />
          <h3>
            {draws.length
              ? "No encontramos resultados"
              : "Los resultados llegan pronto"}
          </h3>
          <p>
            {draws.length
              ? "Prueba con otra fecha, número o modalidad."
              : "Aquí aparecerán los sorteos cuando se publiquen."}
          </p>
        </div>
      )}
      {!compact && filtered.length > visible.length && (
        <button
          type="button"
          className="button button-outline load-more"
          onClick={() => setPage(page + 1)}
        >
          Cargar más resultados <ArrowRight size={16} weight="duotone" />
        </button>
      )}
    </>
  );
}
