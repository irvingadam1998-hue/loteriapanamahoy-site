import type { Draw, Kind, Rule } from "./lottery";

// Illustrative fixtures only. These amounts are NOT an official payout schedule.
export function demoRules(kind: Kind): Rule[] {
  const rules: Rule[] = [];
  for (const ticket of ["billete", "chance"] as const) {
    [0, 1, 2].forEach((prize) => {
      if (kind === "zodiaco" && ticket === "billete" && prize > 0) return;
      rules.push({
        id: `${ticket}-${prize}`,
        label: `${prize + 1}.º premio · ${ticket === "billete" ? "número exacto" : "dos cifras"}`,
        ticket,
        match: "exact",
        prize,
        digits: 1,
        amountCents:
          (ticket === "billete" ? [2000, 600, 300] : [14, 3, 2])[prize] * 100,
        group: `${ticket}-${prize}`,
        requiresExact: false,
        wrap: false,
      });
    });
  }
  rules.push({
    id: "demo-terminal",
    label: "Últimas dos cifras del primer premio",
    ticket: "billete",
    match: "suffix",
    prize: 0,
    digits: 2,
    amountCents: 300,
    group: "billete-0",
    requiresExact: false,
    wrap: false,
  });
  return rules;
}
export function demoDraws(): Draw[] {
  const entries: [Kind, string, string, string, string, string][] = [
    ["dominical", "DEMO-01", "2026-09-20", "4827", "1563", "9082"],
    ["miercolito", "DEMO-02", "2026-09-23", "7391", "2046", "5810"],
    ["zodiaco", "DEMO-03", "2026-09-25", "8054", "32", "76"],
    ["extraordinario", "DEMO-04", "2026-08-16", "04827", "31563", "79082"],
    ["dominical", "DEMO-05", "2026-09-13", "3265", "7041", "1892"],
    ["miercolito", "DEMO-06", "2026-09-16", "0918", "6357", "4120"],
  ];
  return entries.map(([kind, number, date, first, second, third]) => ({
    id: number.toLowerCase(),
    kind,
    title: "",
    number,
    date,
    time: "13:00",
    status: "published",
    first,
    second,
    third,
    letters: "ABCD",
    series: "12",
    folio: "8",
    sourceUrl: "",
    notes:
      "Ejemplo ficticio para probar la web. Los números y montos no son resultados oficiales.",
    billDigits: kind === "extraordinario" ? 5 : 4,
    rulesVerified: true,
    rules: demoRules(kind),
    isDemo: true,
    createdAt: date + "T18:00:00Z",
    updatedAt: date + "T18:00:00Z",
  }));
}
