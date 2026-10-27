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
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const publishedDraws = draws.filter((draw) => draw.status === "published");
  const years = Array.from(new Set(publishedDraws.map((draw) => draw.date.slice(0, 4)))).sort((a, b) => b.localeCompare(a));
  const months = Array.from(
    new Set(publishedDraws.filter((draw) => !year || draw.date.startsWith(`${year}-`)).map((draw) => draw.date.slice(5, 7))),
  ).sort((a, b) => b.localeCompare(a));
  const availableDates = Array.from(
    new Set(publishedDraws.filter((draw) => (!year || draw.date.startsWith(`${year}-`)) && (!month || draw.date.slice(5, 7) === month)).map((draw) => draw.date)),
  ).sort((a, b) => b.localeCompare(a));
  const filtered = draws.filter(
    (d) =>
      d.status === "published" &&
      (kind === "all" || d.kind === kind) &&
      (!year || d.date.startsWith(`${year}-`)) &&
      (!month || d.date.slice(5, 7) === month) &&
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
          <div className="history-date-filter" aria-label="Filtrar resultados por fecha">
            <CalendarBlank size={17} weight="duotone" />
            <label className="sr-only" htmlFor="results-year">Año</label>
            <select id="results-year" value={year} onChange={(e) => { setYear(e.target.value); setMonth(""); setDate(""); setPage(1); }}>
              <option value="">Todos los años</option>
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <label className="sr-only" htmlFor="results-month">Mes</label>
            <select id="results-month" value={month} disabled={!year} onChange={(e) => { setMonth(e.target.value); setDate(""); setPage(1); }}>
              <option value="">Todos los meses</option>
              {months.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("es-PA", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2020, Number(value) - 1, 1)))}</option>)}
            </select>
            <label className="sr-only" htmlFor="results-day">Día con resultados</label>
            <select id="results-day" value={date} disabled={!year || !month} onChange={(e) => { setDate(e.target.value); setPage(1); }}>
              <option value="">Todos los días</option>
              {availableDates.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("es-PA", { day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))}</option>)}
            </select>
          </div>
          {(query || year || month || date) && (
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setYear("");
                setMonth("");
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
