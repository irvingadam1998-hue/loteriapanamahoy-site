"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Key } from "@phosphor-icons/react/dist/ssr/Key";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { SignOut } from "@phosphor-icons/react/dist/ssr/SignOut";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { FloppyDisk } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import Link from "next/link";
import type { StorageStatus } from "@/lib/db";
import {
  KINDS,
  matchNames,
  emptyDraw,
  defaultRules,
  completeDrawRules,
  dateLabel,
  type Draw,
  type DrawInput,
  type Rule,
  type Kind,
} from "@/lib/lottery";
import { DrawIcon } from "./draw-card";
const statusLabels = {
  draft: "Borrador",
  scheduled: "Programado",
  published: "Publicado",
};
export function AdminLogin({
  configured,
  storage,
}: {
  configured: boolean;
  storage: StorageStatus;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="admin-login">
      <Key size={29} weight="duotone" />
      <span className="eyebrow">TU ESPACIO DE PUBLICACIÓN</span>
      <h1>Bienvenido de nuevo.</h1>
      <p>Administra los sorteos y mantén a Panamá al día con sus resultados.</p>
      <div
        className={`storage-status ${storage.ready ? "is-ready" : "is-error"}`}
        role="status"
      >
        <span className="storage-indicator" />
        <div>
          <strong>
            {storage.provider === "supabase"
              ? "Base de datos · Supabase"
              : "Base de datos · SQLite local"}
          </strong>
          <small>{storage.message}</small>
        </div>
      </div>
      {!configured && (
        <p className="notice notice-amber">
          Ejecuta <code>npm run setup</code> o configura ADMIN_PASSWORD y
          SESSION_SECRET en el servidor.
        </p>
      )}
      <form onSubmit={login}>
        <label htmlFor="admin-password">Contraseña de administración</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={loading || !configured}
          className="button button-dark full-width"
        >
          {loading ? (
            <CircleNotch size={16} className="spin" weight="duotone" />
          ) : (
            <ShieldCheck size={16} weight="duotone" />
          )}{" "}
          Entrar al panel
        </button>
      </form>
      <Link href="/" className="text-link">
        <ArrowLeft size={14} weight="duotone" /> Volver al inicio
      </Link>
    </div>
  );
}
export function AdminPanel({
  initialDraws,
  storage,
}: {
  initialDraws: Draw[];
  storage: StorageStatus;
}) {
  const router = useRouter();
  const [draws, setDraws] = useState(initialDraws.filter((d) => !d.isDemo));
  const [form, setForm] = useState<DrawInput>(() => emptyDraw());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showRules, setShowRules] = useState(false);
  function patch(value: Partial<DrawInput>) {
    setForm((prev) => ({
      ...prev,
      ...value,
      ...(value.kind || value.billDigits
        ? {
            rules: defaultRules(
              value.kind || prev.kind,
              value.billDigits || prev.billDigits,
            ),
          }
        : {}),
      ...(value.rules ||
      value.kind ||
      value.billDigits ||
      value.first !== undefined ||
      value.second !== undefined ||
      value.third !== undefined ||
      value.letters !== undefined ||
      value.series !== undefined ||
      value.folio !== undefined ||
      value.date !== undefined ||
      value.number !== undefined ||
      value.sourceUrl !== undefined
        ? { rulesVerified: false }
        : {}),
    }));
    setDirty(true);
    setSuccess("");
  }
  function select(draw?: Draw) {
    if (
      dirty &&
      !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
    )
      return;
    setForm(
      draw
        ? completeDrawRules(draw)
        : {
            ...emptyDraw(),
          },
    );
    setDirty(false);
    setError("");
    setSuccess("");
    setShowRules(false);
  }
  function updateRule(index: number, value: Partial<Rule>) {
    patch({
      rules: form.rules.map((r, i) => (i === index ? { ...r, ...value } : r)),
    });
  }
  function addRule() {
    patch({
      rules: [
        ...form.rules,
        {
          id: crypto.randomUUID(),
          label: "",
          ticket: "billete",
          match: "exact",
          prize: 0,
          digits: 1,
          amountCents: 100,
          group: "numero-1",
          requiresExact: false,
          wrap: false,
        },
      ],
    });
    setShowRules(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setForm(data.draw);
      setDraws((prev) =>
        [data.draw, ...prev.filter((d) => d.id !== data.draw.id)].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      );
      setDirty(false);
      setSuccess(
        form.status === "published"
          ? "Sorteo publicado. Ya está disponible en la web y en el comprobador."
          : form.status === "scheduled"
            ? "Sorteo programado. Se mostrará en el calendario de próximos sorteos."
            : "Borrador guardado. Puedes seguir editándolo antes de publicar.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Salir del panel?"))
      return;
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  }
  return (
    <div className="container">
      <div className="admin-title">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN · SUERTE PANAMÁ</span>
          <h1>Tus sorteos, al día.</h1>
          <p>Publica resultados y configura los premios de cada sorteo.</p>
        </div>
        <div className="admin-title-actions">
          <Link href="/" className="button button-outline">
            Ver mi web <ArrowUpRight size={15} weight="duotone" />
          </Link>
          <button className="button button-outline" onClick={logout}>
            <SignOut size={15} weight="duotone" /> Salir
          </button>
          <button className="button button-dark" onClick={() => select()}>
            <Plus size={16} weight="duotone" /> Nuevo sorteo
          </button>
        </div>
      </div>
      <div
        className={`storage-status ${storage.ready ? "is-ready" : "is-error"}`}
        role="status"
      >
        <span className="storage-indicator" />
        <div>
          <strong>
            {storage.provider === "supabase"
              ? "Base de datos · Supabase"
              : "Base de datos · SQLite local"}
          </strong>
          <small>{storage.message}</small>
        </div>
      </div>
      <div className="admin-stats">
        {[
          { key: "published", label: "Sorteos publicados", icon: CheckCircle },
          { key: "draft", label: "Borradores", icon: NotePencil },
          { key: "scheduled", label: "Próximos sorteos", icon: CalendarBlank },
        ].map((item) => (
          <div className="admin-stat" key={item.key}>
            <div>
              <span>{item.label}</span>
              <strong>
                {draws.filter((d) => d.status === item.key).length}
              </strong>
            </div>
            <item.icon size={25} />
          </div>
        ))}
      </div>
      <div className="admin-workspace">
        <aside className="admin-list">
          <h2>Todos tus sorteos</h2>
          {draws.length ? (
            draws.map((draw) => (
              <button
                key={draw.id}
                className={form.id === draw.id ? "active" : ""}
                onClick={() => select(draw)}
              >
                <DrawIcon kind={draw.kind} size={18} />
                <span>
                  <strong>{draw.title || KINDS[draw.kind].name}</strong>
                  <small>
                    {dateLabel(draw.date, true)} · N.º {draw.number}
                  </small>
                </span>
                <span className={`status-pill status-${draw.status}`}>
                  {statusLabels[draw.status]}
                </span>
              </button>
            ))
          ) : (
            <div className="admin-list-empty">
              Tu primer sorteo empieza aquí. Completa los datos de la derecha
              para crearlo.
            </div>
          )}
          {initialDraws.some((d) => d.isDemo) && (
            <p className="admin-demo-note">
              Los ejemplos DEMO no son editables. Para ocultarlos, cambia
              DEMO_DATA a false y reinicia el servidor.
            </p>
          )}
        </aside>
        <form className="admin-editor" onSubmit={save}>
          <div className="editor-heading">
            <div>
              <h2>{form.id ? "Editar sorteo" : "Un nuevo resultado"}</h2>
              <p>
                {form.id
                  ? `Sorteo N.º ${form.number}`
                  : "Completa la información y elige cuándo publicarla."}
              </p>
            </div>
            <span className={`status-pill status-${form.status}`}>
              {statusLabels[form.status]}
            </span>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <div className="save-message" role="status">
              {success}
              {form.status === "published" && (
                <Link href={`/resultados/${form.id}`} className="text-link">
                  Ver resultado <ArrowUpRight size={14} weight="duotone" />
                </Link>
              )}
            </div>
          )}
          <div className="admin-form-grid">
            <label>
              Modalidad
              <select
                value={form.kind}
                onChange={(e) =>
                  patch({
                    kind: e.target.value as Kind,
                    billDigits: e.target.value === "extraordinario" ? 5 : 4,
                  })
                }
              >
                {Object.entries(KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Número de sorteo
              <input
                value={form.number}
                onChange={(e) => patch({ number: e.target.value })}
                placeholder="Ej. 5571"
                maxLength={30}
                required
              />
            </label>
            <label>
              Fecha del sorteo
              <input
                type="date"
                value={form.date}
                onChange={(e) => patch({ date: e.target.value })}
                required
              />
            </label>
            <label>
              Hora de Panamá
              <input
                type="time"
                value={form.time}
                onChange={(e) => patch({ time: e.target.value })}
                required
              />
            </label>
            <label>
              Nombre personalizado (opcional)
              <input
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Ej. Extraordinario de Navidad"
                maxLength={80}
              />
            </label>
            <label>
              Cifras del billete
              <select
                value={form.billDigits}
                onChange={(e) =>
                  patch({ billDigits: Number(e.target.value) as 4 | 5 })
                }
              >
                <option value="4">4 cifras</option>
                <option value="5">5 cifras</option>
              </select>
            </label>
          </div>
          <h3>Los números ganadores</h3>
          <div className="prize-input-grid">
            {(["first", "second", "third"] as const).map((field, i) => {
              const digits =
                form.kind === "zodiaco" && i > 0 ? 2 : form.billDigits;
              return (
                <label key={field}>
                  {i + 1}.º premio
                  <input
                    aria-label={`${i + 1}.º premio`}
                    inputMode="numeric"
                    value={form[field]}
                    placeholder={"0".repeat(digits)}
                    maxLength={digits}
                    onChange={(e) =>
                      patch({ [field]: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </label>
              );
            })}
          </div>
          <div className="admin-form-grid admin-extra-grid">
            <label>
              Letras
              <input
                value={form.letters}
                placeholder="ABCD"
                maxLength={4}
                onChange={(e) =>
                  patch({
                    letters: e.target.value
                      .toUpperCase()
                      .replace(/[^A-D]/g, ""),
                  })
                }
              />
            </label>
            <label>
              Serie
              <input
                value={form.series}
                inputMode="numeric"
                maxLength={3}
                placeholder="00"
                onChange={(e) =>
                  patch({ series: e.target.value.replace(/\D/g, "") })
                }
              />
            </label>
            <label>
              Folio
              <input
                value={form.folio}
                inputMode="numeric"
                maxLength={3}
                placeholder="00"
                onChange={(e) =>
                  patch({ folio: e.target.value.replace(/\D/g, "") })
                }
              />
            </label>
          </div>
          <h3>Fuente y observaciones</h3>
          <div className="admin-form-grid">
            <label className="span-two">
              Enlace de la fuente
              <input
                type="url"
                value={form.sourceUrl}
                placeholder="https://www.lnb.gob.pa/…"
                onChange={(e) => patch({ sourceUrl: e.target.value })}
              />
              <span className="editor-source-hint">
                Obligatorio al publicar. Usa el{" "}
                <a
                  href="https://www.lnb.gob.pa/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  resultado o plan oficial de la LNB
                </a>
                .
              </span>
            </label>
            <label className="span-two">
              Nota visible para tus visitantes
              <textarea
                value={form.notes}
                placeholder="Información adicional sobre este sorteo…"
                onChange={(e) => patch({ notes: e.target.value })}
                maxLength={1000}
                rows={2}
              />
            </label>
          </div>
          <details
            open={showRules}
            onToggle={(e) => setShowRules(e.currentTarget.open)}
          >
            <summary>Plan de premios · {form.rules.length} reglas</summary>
            <p className="rule-help">
              Las reglas base de billetes y chances cambian automáticamente
              según la modalidad elegida. Revisa los importes de las ediciones
              especiales contra el reverso del billete y completa sus incentivos
              por letras, serie y folio. Puedes añadir coincidencias exactas,
              primeras o últimas cifras, aproximaciones e incentivos. Las reglas
              con el mismo grupo pagan solo el importe mayor; grupos distintos
              se suman. Deja el grupo vacío para sumar siempre esa regla.
            </p>
            {form.rules.map((rule, index) => (
              <div key={rule.id} className="rule-row">
                <div className="rule-row-top">
                  <input
                    aria-label={`Nombre de regla ${index + 1}`}
                    placeholder="Ej. Primer premio · número exacto"
                    value={rule.label}
                    onChange={(e) =>
                      updateRule(index, { label: e.target.value })
                    }
                    maxLength={120}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Eliminar regla ${index + 1}`}
                    onClick={() =>
                      patch({ rules: form.rules.filter((_, i) => i !== index) })
                    }
                  >
                    <Trash size={14} weight="duotone" />
                  </button>
                </div>
                <div className="rule-row-fields">
                  <label>
                    Tipo de boleto
                    <select
                      value={rule.ticket}
                      onChange={(e) =>
                        updateRule(index, {
                          ticket: e.target.value as Rule["ticket"],
                        })
                      }
                    >
                      <option value="billete">Billete</option>
                      <option value="chance">Chance</option>
                    </select>
                  </label>
                  <label>
                    Coincidencia
                    <select
                      value={rule.match}
                      onChange={(e) =>
                        updateRule(index, {
                          match: e.target.value as Rule["match"],
                        })
                      }
                    >
                      {Object.entries(matchNames).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Premio de referencia
                    <select
                      value={rule.prize}
                      onChange={(e) =>
                        updateRule(index, { prize: Number(e.target.value) })
                      }
                    >
                      <option value={0}>Primer premio</option>
                      <option value={1}>Segundo premio</option>
                      <option value={2}>Tercer premio</option>
                    </select>
                  </label>
                  <label>
                    B/. por fracción
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10000000"
                      value={rule.amountCents / 100}
                      onChange={(e) =>
                        updateRule(index, {
                          amountCents: Math.round(Number(e.target.value) * 100),
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    {rule.match === "approximation"
                      ? "Distancia ±"
                      : "Cantidad de cifras"}
                    <input
                      type="number"
                      min="1"
                      max={
                        rule.match === "approximation" ? 99 : form.billDigits
                      }
                      disabled={
                        !["prefix", "suffix", "approximation"].includes(
                          rule.match,
                        )
                      }
                      value={rule.digits}
                      onChange={(e) =>
                        updateRule(index, { digits: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Grupo (opcional)
                    <input
                      value={rule.group}
                      onChange={(e) =>
                        updateRule(index, { group: e.target.value })
                      }
                      placeholder="Ej. numero-1"
                      maxLength={80}
                    />
                  </label>
                </div>
                <div className="rule-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={rule.requiresExact}
                      onChange={(e) =>
                        updateRule(index, { requiresExact: e.target.checked })
                      }
                    />
                    Exige también el número exacto
                  </label>
                  {rule.match === "approximation" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={rule.wrap}
                        onChange={(e) =>
                          updateRule(index, { wrap: e.target.checked })
                        }
                      />
                      Aproximación circular (0000 ↔ 9999)
                    </label>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button button-outline"
              onClick={addRule}
            >
              <Plus size={15} weight="duotone" /> Añadir regla de premio
            </button>
          </details>
          <label className="verify-plan">
            <input
              type="checkbox"
              checked={form.rulesVerified}
              onChange={(e) => patch({ rulesVerified: e.target.checked })}
            />
            <span>
              <strong>He verificado el plan completo de este sorteo</strong>
              Confirmo que revisé los premios base precargados y añadí todos los
              incentivos especiales de este sorteo. Sin esta confirmación, el
              comprobador mostrará las coincidencias conocidas y dejará como
              pendiente confirmar un posible premio adicional.
            </span>
          </label>
          <div className="editor-actions">
            <label>
              Estado
              <select
                aria-label="Estado de publicación"
                value={form.status}
                onChange={(e) =>
                  patch({ status: e.target.value as DrawInput["status"] })
                }
              >
                <option value="draft">Borrador privado</option>
                <option value="scheduled">Programar sorteo</option>
                <option value="published">Publicar resultados</option>
              </select>
            </label>
            <button
              className="button button-dark"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <CircleNotch size={16} className="spin" weight="duotone" />
              ) : (
                <FloppyDisk size={16} weight="duotone" />
              )}
              {saving
                ? "Guardando…"
                : form.status === "published"
                  ? "Guardar y publicar"
                  : "Guardar sorteo"}
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
