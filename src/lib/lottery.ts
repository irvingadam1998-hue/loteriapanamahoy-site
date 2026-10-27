import { z } from "zod";

export const KINDS = {
  dominical: {
    name: "Dominical",
    short: "Dom",
    description: "El clásico de los domingos",
    color: "green",
    icon: "sun",
  },
  miercolito: {
    name: "Miércolito",
    short: "Mié",
    description: "Una pausa a mitad de semana",
    color: "blue",
    icon: "ticket",
  },
  zodiaco: {
    name: "Gordito del Zodíaco",
    short: "Zod",
    description: "El sorteo de las estrellas",
    color: "purple",
    icon: "sparkles",
  },
  extraordinario: {
    name: "Extraordinario",
    short: "Ext",
    description: "Una fecha especial",
    color: "orange",
    icon: "star",
  },
  especial: {
    name: "Especial",
    short: "Esp",
    description: "Otros sorteos tradicionales",
    color: "pink",
    icon: "gift",
  },
} as const;
export type Kind = keyof typeof KINDS;
export const kindSchema = z.enum([
  "dominical",
  "miercolito",
  "zodiaco",
  "extraordinario",
  "especial",
]);
export const matchNames = {
  exact: "Número exacto",
  prefix: "Primeras cifras",
  suffix: "Últimas cifras",
  approximation: "Aproximación ±",
  letters: "Cuatro letras",
  "series-folio": "Serie y folio",
} as const;
export const ruleSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  ticket: z.enum(["billete", "chance"]),
  match: z.enum([
    "exact",
    "prefix",
    "suffix",
    "approximation",
    "letters",
    "series-folio",
  ]),
  prize: z.number().int().min(0).max(2),
  digits: z.number().int().min(1).max(99),
  amountCents: z.number().int().positive().max(1000000000),
  group: z.string().trim().max(80),
  requiresExact: z.boolean(),
  wrap: z.boolean().default(false),
});
export type Rule = z.infer<typeof ruleSchema>;
/** Preloaded payout templates for every supported LNB draw type. */
export function defaultRules(kind: Kind, billDigits = 4): Rule[] {
  const rules: Rule[] = [];
  const add = (
    ticket: Rule["ticket"],
    prize: number,
    match: Rule["match"],
    digits: number,
    amountCents: number,
    label: string,
    requiresExact = false,
    group = `${ticket}-${prize}`,
  ) =>
    rules.push({
      id: `base-${ticket}-${prize}-${match}-${digits}`,
      label,
      ticket,
      match,
      prize,
      digits,
      amountCents,
      // Every printed prize line is a separate award; matching several
      // derivations on one billete must add each corresponding amount.
      group: `${group}-${match}-${digits}`,
      requiresExact,
      wrap: false,
    });
  if (kind === "zodiaco" && billDigits === 4) {
    add("billete", 0, "exact", 1, 4000 * 100, "Primer premio · 4 cifras");
    add(
      "billete",
      0,
      "series-folio",
      1,
      1000000 * 100,
      "Primer premio · serie y folio (incentivo)",
      true,
      "billete-0-serie-folio",
    );
    const zodiacoDerivations: [Rule["match"], number, number, string][] = [
      ["prefix", 3, 60, "Primer premio · primeras 3 cifras"],
      ["suffix", 3, 60, "Primer premio · últimas 3 cifras"],
      ["prefix", 2, 4, "Primer premio · primeras 2 cifras"],
      ["suffix", 2, 4, "Primer premio · últimas 2 cifras"],
      ["suffix", 1, 1, "Primer premio · última cifra"],
    ];
    for (const [match, digits, amount, label] of zodiacoDerivations)
      add("billete", 0, match, digits, amount * 100, label);
    // Gordito chance pays double the regular chance base payouts.
    for (const [prize, amount] of [28, 12, 6].entries())
      add(
        "chance",
        prize,
        "exact",
        1,
        amount * 100,
        `${prize + 1}.º premio · chance Gordito`,
      );
    return rules;
  }

  if (kind === "extraordinario" && billDigits === 5) {
    // Reference plan from the August 2026 Extraordinary; the special draw's
    // printed amounts can change, so these remain editable per draw.
    const base = [20000, 8000, 3000];
    const serial = [75000, 10000, 7500];
    for (const [prize, amount] of base.entries()) {
      add(
        "billete",
        prize,
        "exact",
        1,
        amount * 100,
        `${prize + 1}.º premio · 5 cifras (base de referencia)`,
      );
      add(
        "billete",
        prize,
        "series-folio",
        1,
        serial[prize] * 100,
        `${prize + 1}.º premio · incentivo serie y folio`,
        true,
        `billete-${prize}-serie-folio`,
      );
    }
    for (const [prize, amount] of [14, 6, 3].entries())
      add(
        "chance",
        prize,
        "exact",
        1,
        amount * 100,
        `${prize + 1}.º premio · chance (base de referencia)`,
      );
    return rules;
  }

  if (
    billDigits !== 4 ||
    !["dominical", "miercolito", "especial"].includes(kind)
  )
    return [];
  for (const [prize, amount] of [2000, 600, 300].entries()) {
    add(
      "billete",
      prize,
      "exact",
      1,
      amount * 100,
      `${prize + 1}.º premio · billete exacto`,
    );
    if (prize === 0) {
      add(
        "billete",
        prize,
        "prefix",
        3,
        50 * 100,
        "Primer premio · primeras 3 cifras",
      );
      add(
        "billete",
        prize,
        "suffix",
        3,
        50 * 100,
        "Primer premio · últimas 3 cifras",
      );
      add(
        "billete",
        prize,
        "prefix",
        2,
        3 * 100,
        "Primer premio · primeras 2 cifras",
      );
      add(
        "billete",
        prize,
        "suffix",
        2,
        3 * 100,
        "Primer premio · últimas 2 cifras",
      );
      add(
        "billete",
        prize,
        "suffix",
        1,
        1 * 100,
        "Primer premio · última cifra",
      );
    } else {
      const three = prize === 1 ? 20 : 10;
      const two = prize === 1 ? 2 : 1;
      add(
        "billete",
        prize,
        "prefix",
        3,
        three * 100,
        `${prize + 1}.º premio · primeras 3 cifras`,
      );
      add(
        "billete",
        prize,
        "suffix",
        3,
        three * 100,
        `${prize + 1}.º premio · últimas 3 cifras`,
      );
      add(
        "billete",
        prize,
        "suffix",
        2,
        two * 100,
        `${prize + 1}.º premio · últimas 2 cifras`,
      );
    }
  }
  for (const [prize, amount] of [14, 6, 3].entries())
    add(
      "chance",
      prize,
      "exact",
      1,
      amount * 100,
      `${prize + 1}.º premio · chance`,
    );
  return rules;
}
export function completeDrawRules(draw: DrawInput): DrawInput {
  const rules = [...draw.rules];
  for (const base of defaultRules(draw.kind, draw.billDigits)) {
    const alreadyCovered = rules.some(
      (rule) =>
        rule.ticket === base.ticket &&
        rule.prize === base.prize &&
        rule.match === base.match &&
        rule.digits === base.digits,
    );
    if (!alreadyCovered) rules.push(base);
  }
  return {
    ...draw,
    rules,
    rulesVerified:
      rules.length === draw.rules.length ? draw.rulesVerified : false,
  };
}
const realDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
export const drawSchema = z
  .object({
    id: z.string().max(80).optional(),
    kind: kindSchema,
    title: z.string().trim().max(80),
    number: z.string().trim().min(1).max(30),
    date: z.string().refine(realDate, "Fecha inválida"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    status: z.enum(["draft", "scheduled", "published"]),
    first: z.string().max(5),
    second: z.string().max(5),
    third: z.string().max(5),
    letters: z
      .string()
      .regex(/^[A-D]{4}$|^$/, "Las letras deben ser cuatro caracteres A–D"),
    series: z.string().regex(/^\d{1,3}$|^$/),
    folio: z.string().regex(/^\d{1,3}$|^$/),
    sourceUrl: z.union([
      z.literal(""),
      z
        .url()
        .refine((url) => url.startsWith("https://"), "Usa un enlace HTTPS"),
    ]),
    notes: z.string().max(1000),
    billDigits: z.union([z.literal(4), z.literal(5)]),
    rulesVerified: z.boolean(),
    rules: z.array(ruleSchema).max(100),
  })
  .superRefine((draw, ctx) => {
    const issue = (message: string, path: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (draw.status === "published") {
      [draw.first, draw.second, draw.third].forEach((n, i) => {
        const digits = draw.kind === "zodiaco" && i > 0 ? 2 : draw.billDigits;
        if (!new RegExp(`^\\d{${digits}}$`).test(n))
          issue(
            `El ${i + 1}.º premio requiere ${digits} cifras`,
            ["first", "second", "third"][i],
          );
      });
      if (!draw.sourceUrl)
        issue("Añade la fuente del resultado antes de publicar", "sourceUrl");
      if (new Date(`${draw.date}T${draw.time}:00-05:00`).getTime() > Date.now())
        issue("No puedes publicar resultados de un sorteo futuro", "date");
    }
    if (draw.rulesVerified) {
      if (!draw.sourceUrl)
        issue("Indica una fuente para el plan de premios", "sourceUrl");
      for (const ticket of ["billete", "chance"])
        if (!draw.rules.some((r) => r.ticket === ticket))
          issue(`Faltan reglas para ${ticket}`, "rules");
      for (const rule of draw.rules) {
        if (rule.match === "letters" && !draw.letters)
          issue("Faltan las letras ganadoras", "letters");
        if (rule.match === "series-folio" && (!draw.series || !draw.folio))
          issue("Faltan la serie y el folio ganadores", "series");
      }
    }
    if (new Set(draw.rules.map((r) => r.id)).size !== draw.rules.length)
      issue("Las reglas tienen identificadores repetidos", "rules");
    for (const rule of draw.rules) {
      if (
        ["prefix", "suffix"].includes(rule.match) &&
        rule.digits > (rule.ticket === "chance" ? 2 : draw.billDigits)
      )
        issue(
          "La cantidad de cifras de una regla supera la del boleto",
          "rules",
        );
    }
  });
export type DrawInput = z.infer<typeof drawSchema>;
export type Draw = Omit<DrawInput, "id"> & {
  id: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  views?: number;
};
export type CheckerDraw = Pick<
  Draw,
  "id" | "kind" | "status" | "date" | "number" | "billDigits" | "isDemo"
> & { hasExtras: Record<Rule["ticket"], boolean> };
/** Strip ticket payout details that the browser checker never renders. */
export function checkerDrawData(draws: Draw[]): CheckerDraw[] {
  return draws
    .filter((draw) => draw.status === "published")
    .map((draw) => ({
      id: draw.id,
      kind: draw.kind,
      status: draw.status,
      date: draw.date,
      number: draw.number,
      billDigits: draw.billDigits,
      isDemo: draw.isDemo,
      hasExtras: {
        billete: draw.rules.some((rule) => rule.ticket === "billete" && ["letters", "series-folio"].includes(rule.match)),
        chance: draw.rules.some((rule) => rule.ticket === "chance" && ["letters", "series-folio"].includes(rule.match)),
      },
    }));
}
export const checkSchema = z.object({
  drawId: z.string().min(1).max(80),
  ticket: z.enum(["billete", "chance"]),
  number: z
    .string()
    .regex(
      /^\d{2}$|^\d{4,5}$/,
      "Escribe el número completo, incluyendo los ceros iniciales",
    ),
  fractions: z.number().int().min(1).max(10000),
  letters: z
    .string()
    .regex(/^[A-D]{4}$|^$/)
    .default(""),
  series: z
    .string()
    .regex(/^\d{1,3}$|^$/)
    .default(""),
  folio: z
    .string()
    .regex(/^\d{1,3}$|^$/)
    .default(""),
});
export type CheckInput = z.infer<typeof checkSchema>;
export type CheckResult = {
  status: "won" | "no_win" | "incomplete" | "unavailable";
  matches: { label: string; amountCents: number }[];
  unknownPrizes: string[];
  totalCents: number;
  missing: string[];
  verified: boolean;
  isDemo: boolean;
  number: string;
  fractions: number;
  drawTitle: string;
  date: string;
};
export function checkTicket(draw: Draw, input: CheckInput): CheckResult {
  const result: CheckResult = {
    status: "unavailable",
    matches: [],
    unknownPrizes: [],
    totalCents: 0,
    missing: [],
    verified: draw.rulesVerified,
    isDemo: draw.isDemo,
    number: input.number,
    fractions: input.fractions,
    drawTitle: draw.title || KINDS[draw.kind].name,
    date: draw.date,
  };
  if (draw.status !== "published") return result;
  const length = input.ticket === "chance" ? 2 : draw.billDigits;
  if (!new RegExp(`^\\d{${length}}$`).test(input.number))
    throw new Error(`Este ${input.ticket} debe tener ${length} cifras.`);
  const winners = [draw.first, draw.second, draw.third];
  const matches: Rule[] = [];
  const missing = new Set<string>();
  const rules = draw.rules.filter((r) => r.ticket === input.ticket);
  // Exact numbers can be recognized even if a payout is not in the plan.
  // Known base rules are still applied when draw-specific incentives are pending.
  if (!rules.length) {
    winners.forEach((winner, prize) => {
      const value = input.ticket === "chance" ? winner.slice(-2) : winner;
      if (input.number === value) {
        result.unknownPrizes.push(
          `${prize + 1}.º premio · coincidencia exacta`,
        );
      }
    });
  }
  if (!rules.length) {
    result.verified = false;
    result.status = result.unknownPrizes.length ? "won" : "incomplete";
    return result;
  }
  for (const rule of rules) {
    const winner =
      input.ticket === "chance"
        ? winners[rule.prize].slice(-2)
        : winners[rule.prize];
    const exact = input.number === winner;
    if (rule.requiresExact && !exact) continue;
    let match = false;
    if (rule.match === "exact") match = exact;
    if (rule.match === "prefix" && winner.length === length)
      match =
        input.number.slice(0, rule.digits) === winner.slice(0, rule.digits);
    if (rule.match === "suffix" && winner.length === length)
      match = input.number.slice(-rule.digits) === winner.slice(-rule.digits);
    if (rule.match === "approximation" && winner.length === length) {
      const delta = Math.abs(Number(input.number) - Number(winner));
      const distance = rule.wrap
        ? Math.min(delta, 10 ** length - delta)
        : delta;
      match = distance > 0 && distance <= rule.digits;
    }
    if (rule.match === "letters") {
      if (!input.letters || !draw.letters) missing.add("letras");
      else match = input.letters === draw.letters;
    }
    if (rule.match === "series-folio") {
      if (!input.series || !draw.series) missing.add("serie");
      if (!input.folio || !draw.folio) missing.add("folio");
      if (input.series && input.folio && draw.series && draw.folio)
        match =
          Number(input.series) === Number(draw.series) &&
          Number(input.folio) === Number(draw.folio);
    }
    if (match) matches.push(rule);
  }
  // A more precise prefix/suffix subsumes shorter derivations for the same
  // prize. An exact winning number also subsumes all its digit derivations.
  const exactPrizes = new Set(
    matches
      .filter((rule) => rule.match === "exact")
      .map((rule) => `${rule.ticket}:${rule.prize}`),
  );
  const precision = new Map<string, number>();
  for (const rule of matches) {
    if (rule.match !== "prefix" && rule.match !== "suffix") continue;
    const prizeKey = `${rule.ticket}:${rule.prize}`;
    if (exactPrizes.has(prizeKey)) continue;
    const key = `${prizeKey}:${rule.match}`;
    precision.set(key, Math.max(precision.get(key) ?? 0, rule.digits));
  }
  const eligibleMatches = matches.filter((rule) => {
    if (rule.match !== "prefix" && rule.match !== "suffix") return true;
    const prizeKey = `${rule.ticket}:${rule.prize}`;
    if (exactPrizes.has(prizeKey)) return false;
    return (
      rule.digits === precision.get(`${prizeKey}:${rule.match}`)
    );
  });

  // Within one configured group only the largest award applies; independent
  // matches, such as prefixes and suffixes, can accumulate.
  const grouped = new Map<string, Rule>();
  for (const rule of eligibleMatches) {
    // Old built-in plans used one group per numbered prize (e.g. billete-0),
    // which accidentally discarded printed derivation rows for real draws.
    const oldBuiltInGroup =
      !draw.isDemo && rule.group === `${rule.ticket}-${rule.prize}`;
    const key = oldBuiltInGroup
      ? `legacy-line:${rule.id}`
      : rule.group || `independent:${rule.id}`;
    if (!grouped.has(key) || grouped.get(key)!.amountCents < rule.amountCents)
      grouped.set(key, rule);
  }
  result.matches = [...grouped.values()].map((r) => ({
    label: r.label,
    amountCents: r.amountCents * input.fractions,
  }));
  result.totalCents = result.matches.reduce((sum, m) => sum + m.amountCents, 0);
  result.missing = [...missing];
  result.status =
    result.matches.length || result.unknownPrizes.length
      ? "won"
      : !draw.rulesVerified || missing.size
        ? "incomplete"
        : "no_win";
  return result;
}
export const money = (cents: number) =>
  `B/. ${new Intl.NumberFormat("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;
export const dateLabel = (date: string, short = false) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "America/Panama",
  }).format(new Date(`${date}T12:00:00-05:00`));
export const panamaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" }).format(
    new Date(),
  );
export function emptyDraw(): DrawInput {
  return {
    kind: "dominical",
    title: "",
    number: "",
    date: panamaToday(),
    time: "13:00",
    status: "draft",
    first: "",
    second: "",
    third: "",
    letters: "",
    series: "",
    folio: "",
    sourceUrl: "",
    notes: "",
    billDigits: 4,
    rulesVerified: false,
    rules: defaultRules("dominical", 4),
  };
}
