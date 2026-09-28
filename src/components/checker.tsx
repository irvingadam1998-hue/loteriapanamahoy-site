"use client";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Select } from "@radix-ui/themes";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { Gift } from "@phosphor-icons/react/dist/ssr/Gift";
import { Info } from "@phosphor-icons/react/dist/ssr/Info";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { Question } from "@phosphor-icons/react/dist/ssr/Question";
import {
  type CheckResult,
  type Draw,
  type Kind,
  KINDS,
  dateLabel,
  money,
} from "@/lib/lottery";
import { DrawIcon } from "./draw-card";

function GiftAnimation() {
  return (
    <div
      className="gift-scene"
      role="img"
      aria-label="Regalo animado con confeti"
    >
      <div className="gift-halo" />
      {Array.from({ length: 16 }, (_, i) => (
        <i
          key={i}
          className="confetti"
          style={
            {
              "--i": i,
              "--color": ["#c7ed75", "#9584e9", "#f8ba72", "#319279"][i % 4],
            } as React.CSSProperties
          }
        />
      ))}
      <div className="gift-box">
        <div className="gift-ribbon" />
        <div className="gift-lid">
          <span />
          <span />
        </div>
        <StarBurst />
      </div>
    </div>
  );
}
function StarBurst() {
  return (
    <svg
      className="gift-star"
      viewBox="0 0 40 40"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m20 0 5 14 15 6-15 5-5 15-5-15L0 20l15-6Z" />
    </svg>
  );
}
function ResultDialog({
  result,
  onClose,
}: {
  result: CheckResult;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  const won = result.status === "won";
  const partial = !result.verified || result.missing.length > 0;
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      className="result-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="result-heading"
    >
      <button
        onClick={onClose}
        className="dialog-close"
        aria-label="Cerrar resultado"
      >
        <X size={20} weight="duotone" />
      </button>
      {won ? (
        <GiftAnimation />
      ) : (
        <div className="result-neutral-icon">
          {result.status === "no_win" ? (
            <Ticket size={40} weight="duotone" />
          ) : (
            <Question size={40} weight="duotone" />
          )}
        </div>
      )}
      {result.isDemo && (
        <span className="demo-tag">SIMULACIÓN · DATOS DE EJEMPLO</span>
      )}
      <p className="result-number">
        Tu {result.number.length === 2 ? "chance" : "billete"}{" "}
        <strong>{result.number}</strong>
      </p>
      <h2 id="result-heading">
        {won
          ? result.verified
            ? "¡Tu número tiene premio!"
            : "Encontramos una coincidencia"
          : result.status === "no_win"
            ? "Esta vez no hubo premio"
            : result.status === "unavailable"
              ? "Aún falta el resultado"
              : "Falta completar la revisión"}
      </h2>
      <p className="result-description">
        {won
          ? result.isDemo
            ? "Así celebramos contigo. Este es un premio de demostración."
            : "Encontramos estas coincidencias en el sorteo seleccionado."
          : result.status === "no_win"
            ? "Tu número no coincide con los premios del plan registrado para este sorteo."
            : result.status === "unavailable"
              ? "Vuelve cuando se publiquen los números de este sorteo."
              : "Todavía no podemos confirmar si tu boleto tiene algún premio."}
      </p>
      {won && (
        <>
          {result.matches.length > 0 && (
            <div className="result-amount">
              <span>
                {result.isDemo
                  ? "PREMIO DE EJEMPLO"
                  : result.unknownPrizes.length
                    ? "IMPORTE PARCIAL ORIENTATIVO"
                    : "IMPORTE ORIENTATIVO"}
              </span>
              <strong>{money(result.totalCents)}</strong>
              <small>
                {result.fractions}{" "}
                {result.fractions === 1 ? "fracción" : "fracciones"}
              </small>
            </div>
          )}
          <div className="result-breakdown">
            {result.matches.map((m, i) => (
              <div key={i}>
                <span>
                  <Check size={15} weight="duotone" />
                  {m.label}
                </span>
                <b>{money(m.amountCents)}</b>
              </div>
            ))}
            {result.unknownPrizes.map((label) => (
              <div key={label}>
                <span>
                  <Check size={15} weight="duotone" />
                  {label}
                </span>
                <b>Monto por confirmar</b>
              </div>
            ))}
          </div>
        </>
      )}
      {partial && (
        <p className="notice notice-amber">
          {!result.verified
            ? "El plan de premios de este sorteo está pendiente de verificación. Esta consulta no es definitiva. "
            : ""}
          {result.missing.length > 0 &&
            `Añade ${result.missing.join(", ")} para revisar todos los incentivos.`}
        </p>
      )}
      <p className="result-meta">
        {result.drawTitle} · {dateLabel(result.date)}
      </p>
      <p className="fine-print">
        {result.isDemo
          ? "Estos números y montos son ficticios y no sirven para reclamar premios."
          : "Conserva tu boleto y confirma el premio y su importe con la LNB."}
      </p>
      <button className="button button-dark full-width" onClick={onClose}>
        Comprobar otro número <ArrowRight size={17} weight="duotone" />
      </button>
    </dialog>
  );
}
export function Checker({
  draws,
  initialDrawId,
  wide = false,
}: {
  draws: Draw[];
  initialDrawId?: string;
  wide?: boolean;
}) {
  const published = draws.filter((d) => d.status === "published");
  const initial =
    published.find((d) => d.id === initialDrawId) ||
    published.find((d) => d.kind === "dominical") ||
    published[0];
  const [kind, setKind] = useState<Kind>(initial?.kind || "dominical");
  const [drawId, setDrawId] = useState(initial?.id || "");
  const [ticket, setTicket] = useState<"billete" | "chance">("billete");
  const [number, setNumber] = useState("");
  const [fractions, setFractions] = useState(1);
  const [letters, setLetters] = useState("");
  const [series, setSeries] = useState("");
  const [folio, setFolio] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const available = published.filter((draw) => draw.kind === kind);
  const selected = available.find((draw) => draw.id === drawId);
  const digits = ticket === "chance" ? 2 : selected?.billDigits || 4;
  const hasExtras = selected?.rules.some(
    (r) => r.ticket === ticket && ["letters", "series-folio"].includes(r.match),
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (number.length !== digits) {
      setError(
        `Introduce las ${digits} cifras de tu ${ticket}, incluyendo los ceros iniciales.`,
      );
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawId,
          ticket,
          number,
          fractions,
          letters,
          series,
          folio,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo conectar. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <section
      className={`checker-card ${wide ? "checker-wide" : ""}`}
      id="comprobar"
      aria-label="Comprobar mi número"
    >
      <div className="checker-heading">
        <span className="checker-heading-icon">
          <MagnifyingGlass size={23} weight="duotone" />
        </span>
        <div>
          <h2>Comprueba tu número</h2>
          <p>Selecciona tu boleto y el sorteo para empezar.</p>
        </div>
        <Badge className="free-badge" variant="soft" color="blue" radius="full">
          GRATIS
        </Badge>
      </div>
      <form onSubmit={submit}>
        <div className="ticket-tabs" role="group" aria-label="Tipo de boleto">
          <button
            type="button"
            aria-pressed={ticket === "billete"}
            className={ticket === "billete" ? "selected" : ""}
            onClick={() => {
              setTicket("billete");
              setNumber("");
              setError("");
            }}
          >
            <Ticket size={17} weight="duotone" /> Billete{" "}
            <span>4–5 cifras</span>
          </button>
          <button
            type="button"
            aria-pressed={ticket === "chance"}
            className={ticket === "chance" ? "selected" : ""}
            onClick={() => {
              setTicket("chance");
              setNumber("");
              setError("");
            }}
          >
            <Gift size={17} weight="duotone" /> Chance <span>2 cifras</span>
          </button>
        </div>
        <div className="form-grid">
          <label>
            Sorteo
            <div className="select-wrap select-wrap-radix select-wrap-kind">
              <span className="select-leading-icon" aria-hidden="true">
                <DrawIcon kind={kind} size={19} />
              </span>
              <Select.Root
                value={kind}
                onValueChange={(value) => {
                  const nextKind = value as Kind;
                  setKind(nextKind);
                  setDrawId(
                    published.find((d) => d.kind === nextKind)?.id || "",
                  );
                  setNumber("");
                  setError("");
                }}
              >
                <Select.Trigger
                  className="checker-select-trigger"
                  aria-label="Tipo de sorteo"
                  variant="ghost"
                  radius="large"
                />
                <Select.Content
                  className="checker-select-content"
                  position="popper"
                  sideOffset={8}
                >
                  {Object.entries(KINDS).map(([key, value]) => (
                    <Select.Item key={key} value={key}>
                      {value.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          </label>
          <label>
            Fecha del sorteo
            <div className="select-wrap select-wrap-radix select-wrap-date">
              <Select.Root value={drawId} onValueChange={setDrawId}>
                <Select.Trigger
                  className="checker-select-trigger"
                  aria-label="Fecha del sorteo"
                  placeholder="Sin resultados"
                  disabled={!available.length}
                  variant="ghost"
                  radius="large"
                />
                <Select.Content
                  className="checker-select-content"
                  position="popper"
                  sideOffset={8}
                >
                  {available.map((d) => (
                    <Select.Item key={d.id} value={d.id}>
                      {dateLabel(d.date, true)}
                      {d.isDemo ? " · demo" : ""}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          </label>
        </div>
        <label className="number-label" htmlFor="ticket-number">
          El número de tu {ticket}
          <span>{digits} cifras</span>
        </label>
        <input
          className="ticket-number-input"
          id="ticket-number"
          name="number"
          inputMode="numeric"
          autoComplete="off"
          placeholder={"0".repeat(digits)}
          maxLength={digits}
          pattern={`[0-9]{${digits}}`}
          value={number}
          aria-describedby={error ? "checker-error" : "number-help"}
          onChange={(e) => {
            setNumber(e.target.value.replace(/\D/g, "").slice(0, digits));
            setError("");
          }}
          required
        />
        <div className="number-hint" id="number-help">
          <span>Incluye los ceros al inicio.</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "Menos opciones" : "Fracciones, letras y más"}
            <CaretDown
              size={13}
              className={expanded ? "rotate" : ""}
              weight="duotone"
            />
          </button>
        </div>
        {(expanded || hasExtras) && (
          <div className="extra-fields">
            <label>
              Fracciones
              <input
                type="number"
                min="1"
                max="10000"
                value={fractions}
                onChange={(e) => setFractions(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Letras
              <input
                placeholder="ABCD"
                value={letters}
                maxLength={4}
                pattern="[A-D]{4}|"
                onChange={(e) =>
                  setLetters(
                    e.target.value.toUpperCase().replace(/[^A-D]/g, ""),
                  )
                }
              />
            </label>
            <label>
              Serie
              <input
                inputMode="numeric"
                placeholder="00"
                value={series}
                maxLength={3}
                onChange={(e) => setSeries(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label>
              Folio
              <input
                inputMode="numeric"
                placeholder="00"
                value={folio}
                maxLength={3}
                onChange={(e) => setFolio(e.target.value.replace(/\D/g, ""))}
              />
            </label>
          </div>
        )}
        {error && (
          <p className="form-error" id="checker-error" role="alert">
            {error}
          </p>
        )}
        {!selected && (
          <p className="notice">
            Aún no hay resultados publicados para este sorteo.
          </p>
        )}
        <Button
          className="button button-lime checker-submit"
          disabled={loading || !selected}
          type="submit"
          variant="solid"
          color="blue"
          size="3"
        >
          {loading ? (
            <>
              <CircleNotch className="spin" size={20} weight="duotone" />{" "}
              Comprobando…
            </>
          ) : (
            <>
              Comprobar mi número <ArrowRight size={20} weight="duotone" />
            </>
          )}
        </Button>
        <div className="checker-footnote">
          <ShieldCheck size={14} weight="duotone" />
          {selected?.isDemo
            ? "Modo demo: números y premios de ejemplo."
            : "Consulta orientativa. Confirma tu premio con la LNB."}
        </div>
      </form>
      {result && (
        <ResultDialog result={result} onClose={() => setResult(null)} />
      )}
    </section>
  );
}
