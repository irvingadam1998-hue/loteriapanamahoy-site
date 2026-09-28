import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkTicket,
  drawSchema,
  checkSchema,
  completeDrawRules,
  defaultRules,
  emptyDraw,
  type Draw,
  type CheckInput,
  type Rule,
} from "../src/lib/lottery";
import { demoDraws } from "../src/lib/demo";
const draw = demoDraws()[0];
const input: CheckInput = {
  drawId: draw.id,
  ticket: "billete",
  number: "4827",
  fractions: 1,
  letters: "",
  series: "",
  folio: "",
};
const rule = (value: Partial<Rule>): Rule => ({
  id: "test",
  label: "Premio de prueba",
  ticket: "billete",
  match: "exact",
  prize: 0,
  digits: 1,
  amountCents: 100,
  group: "",
  requiresExact: false,
  wrap: false,
  ...value,
});
test("exact prize suppresses lower terminal within the same group", () => {
  const result = checkTicket(draw, input);
  assert.equal(result.status, "won");
  assert.equal(result.totalCents, 200000);
  assert.equal(result.matches.length, 1);
});
test("chance compares the last two digits and multiplies fractions in integer cents", () => {
  const result = checkTicket(draw, {
    ...input,
    ticket: "chance",
    number: "27",
    fractions: 3,
  });
  assert.equal(result.totalCents, 4200);
  assert.equal(result.status, "won");
});
test("billete terminal is distinct from the chance payment", () => {
  assert.equal(
    checkTicket(draw, { ...input, number: "0027", fractions: 2 }).totalCents,
    600,
  );
});
test("leading zeroes and exact length are preserved", () => {
  const zero = { ...draw, first: "0027" };
  assert.equal(
    checkTicket(zero, { ...input, number: "0027" }).totalCents,
    200000,
  );
  assert.throws(
    () => checkTicket(zero, { ...input, number: "27" }),
    /4 cifras/,
  );
});
test("five digit extraordinary tickets are not truncated", () => {
  const extra = demoDraws()[3];
  assert.equal(
    checkTicket(extra, { ...input, drawId: extra.id, number: "04827" })
      .totalCents,
    200000,
  );
  assert.throws(() => checkTicket(extra, input), /5 cifras/);
});
test("zodiaco uses two digit second and third chance awards", () => {
  const zodiac = demoDraws()[2];
  assert.equal(
    checkTicket(zodiac, { ...input, number: "32", ticket: "chance" })
      .totalCents,
    300,
  );
  assert.equal(
    checkTicket(zodiac, { ...input, number: "0032" }).status,
    "no_win",
  );
});
test("unverified or absent payout rules never return no_win", () => {
  assert.equal(
    checkTicket({ ...draw, rulesVerified: false }, { ...input, number: "9999" })
      .status,
    "incomplete",
  );
  assert.equal(
    checkTicket({ ...draw, rules: [] }, { ...input, number: "9999" }).status,
    "incomplete",
  );
});
test("published numbers detect an exact match before a payout schedule is entered", () => {
  const result = checkTicket(
    { ...draw, rules: [], rulesVerified: false },
    input,
  );
  assert.equal(result.status, "won");
  assert.equal(result.verified, false);
  assert.deepEqual(result.unknownPrizes, ["1.º premio · coincidencia exacta"]);
  assert.equal(result.totalCents, 0);
  assert.deepEqual(result.matches, []);
});
test("no prize only when full registered plan can be evaluated", () => {
  assert.equal(
    checkTicket(draw, { ...input, number: "9999" }).status,
    "no_win",
  );
});
test("new ordinary draws preload base prize rules for bill and chance", () => {
  const fresh = emptyDraw();
  assert.equal(fresh.rules.length, 17);
  assert.equal(fresh.rulesVerified, false);
  const drawWithPreloadedPlan: Draw = {
    ...draw,
    rules: defaultRules("miercolito"),
    rulesVerified: false,
  };
  const exactChance = checkTicket(drawWithPreloadedPlan, {
    ...input,
    ticket: "chance",
    number: "27",
  });
  assert.equal(exactChance.status, "won");
  assert.equal(exactChance.totalCents, 1400);
  assert.equal(exactChance.verified, false);
  const miss = checkTicket(drawWithPreloadedPlan, { ...input, number: "9999" });
  assert.equal(miss.status, "incomplete");
  assert.equal(defaultRules("zodiaco").length, 10);
  assert.equal(defaultRules("extraordinario", 5).length, 9);
});
test("Gordito template applies its distinct bill and two-digit prize plan", () => {
  const zodiac = demoDraws()[2];
  const plan: Draw = {
    ...zodiac,
    rules: defaultRules("zodiaco"),
    rulesVerified: false,
  };
  const exactBill = checkTicket(plan, {
    ...input,
    drawId: zodiac.id,
    number: zodiac.first,
  });
  assert.equal(exactBill.totalCents, 412900);
  const secondChance = checkTicket(plan, {
    ...input,
    drawId: zodiac.id,
    ticket: "chance",
    number: zodiac.second,
  });
  assert.equal(secondChance.totalCents, 1200);
});
test("Extraordinario template applies five-digit base and series-folio incentives", () => {
  const extraordinary = demoDraws()[3];
  const plan: Draw = {
    ...extraordinary,
    rules: defaultRules("extraordinario", 5),
    rulesVerified: false,
  };
  const result = checkTicket(plan, {
    ...input,
    drawId: extraordinary.id,
    number: extraordinary.first,
    series: extraordinary.series,
    folio: extraordinary.folio,
  });
  assert.equal(result.totalCents, 9500000);
  assert.equal(result.matches.length, 2);
});
test("editing an older ordinary draw fills only missing base rules", () => {
  const legacy = { ...draw, rules: [], rulesVerified: true };
  const completed = completeDrawRules(legacy);
  assert.equal(completed.rules.length, 17);
  assert.equal(completed.rulesVerified, false);
  assert.deepEqual(completeDrawRules(completed).rules, completed.rules);

  const customExact = rule({
    id: "legacy-first-exact",
    amountCents: 123456,
  });
  const withCustom = completeDrawRules({
    ...legacy,
    rules: [customExact],
  });
  assert.equal(
    withCustom.rules.filter(
      (entry) =>
        entry.ticket === "billete" &&
        entry.prize === 0 &&
        entry.match === "exact",
    ).length,
    1,
  );
  assert.equal(
    withCustom.rules.some((entry) => entry.id === customExact.id),
    true,
  );
});
test("missing bonus data is reported and does not hide a base prize", () => {
  const bonus = {
    ...draw,
    rules: [
      ...draw.rules,
      rule({ match: "letters", requiresExact: true, amountCents: 1000000 }),
    ],
  };
  const result = checkTicket(bonus, input);
  assert.equal(result.status, "won");
  assert.deepEqual(result.missing, ["letras"]);
  assert.equal(result.totalCents, 200000);
  const full = checkTicket(bonus, { ...input, letters: "ABCD" });
  assert.deepEqual(full.missing, []);
  assert.equal(full.totalCents, 1200000);
});
test("number-gated bonus does not require letters from an unrelated losing number", () => {
  const bonus = {
    ...draw,
    rules: [rule({ match: "letters", requiresExact: true })],
  };
  assert.equal(
    checkTicket(bonus, { ...input, number: "9999" }).status,
    "no_win",
  );
});
test("unconditional letters and series/folio require additional input", () => {
  const bonus = {
    ...draw,
    rules: [
      rule({ id: "letters", match: "letters" }),
      rule({ id: "serial", match: "series-folio" }),
    ],
  };
  const pending = checkTicket(bonus, { ...input, number: "9999" });
  assert.equal(pending.status, "incomplete");
  assert.deepEqual(pending.missing, ["letras", "serie", "folio"]);
  const full = checkTicket(bonus, {
    ...input,
    letters: "ABCD",
    series: "012",
    folio: "008",
  });
  assert.equal(full.totalCents, 200);
  assert.deepEqual(full.missing, []);
});
test("first digits and last digits can be grouped or accumulated explicitly", () => {
  const rules = [
    rule({
      id: "prefix",
      match: "prefix",
      digits: 2,
      group: "same",
      amountCents: 300,
    }),
    rule({
      id: "suffix",
      match: "suffix",
      digits: 2,
      group: "same",
      amountCents: 500,
    }),
  ];
  assert.equal(checkTicket({ ...draw, rules }, input).totalCents, 500);
  assert.equal(
    checkTicket(
      { ...draw, rules: rules.map((r) => ({ ...r, group: "" })) },
      input,
    ).totalCents,
    800,
  );
});
test("Dominical billete follows each separate derivation line on the ticket back", () => {
  const source = demoDraws()[0];
  const rules = defaultRules("dominical");
  const realDraw = {
    ...source,
    isDemo: false,
    first: "3460",
    second: "5903",
    third: "6831",
    rulesVerified: true,
    rules,
  };
  const result = checkTicket(realDraw, { ...input, number: "3460" });
  // B/. 2,000 exact + 50 + 50 + 3 + 3 + 1 derivations.
  assert.equal(result.totalCents, 210700);
  assert.equal(result.matches.length, 6);
});
test("legacy default groups still pay every separate printed derivation", () => {
  const source = demoDraws()[0];
  const realDraw = {
    ...source,
    isDemo: false,
    first: "3460",
    rulesVerified: true,
    rules: defaultRules("dominical").map((r) => ({
      ...r,
      group: `${r.ticket}-${r.prize}`,
    })),
  };
  const result = checkTicket(realDraw, { ...input, number: "3460" });
  assert.equal(result.totalCents, 210700);
});
test("approximation boundaries do not wrap unless specifically configured", () => {
  const approx = {
    ...draw,
    first: "0000",
    rules: [rule({ match: "approximation", digits: 1 })],
  };
  assert.equal(
    checkTicket(approx, { ...input, number: "9999" }).status,
    "no_win",
  );
  assert.equal(checkTicket(approx, { ...input, number: "0001" }).status, "won");
  assert.equal(
    checkTicket(approx, { ...input, number: "0000" }).status,
    "no_win",
  );
  assert.equal(
    checkTicket(
      { ...approx, rules: [{ ...approx.rules[0], wrap: true }] },
      { ...input, number: "9999" },
    ).status,
    "won",
  );
});
test("draft and future scheduled draws cannot be checked", () => {
  for (const status of ["draft", "scheduled"] as const)
    assert.equal(checkTicket({ ...draw, status }, input).status, "unavailable");
});
test("server validation rejects future publication, malformed dates and wrong widths", () => {
  const real: Draw = { ...draw, sourceUrl: "https://www.lnb.gob.pa/" };
  assert.equal(drawSchema.safeParse(real).success, true);
  for (const value of [
    { ...real, date: "2099-01-01" },
    { ...real, date: "2026-02-30" },
    { ...real, first: "123" },
    { ...real, sourceUrl: "javascript:alert(1)" },
    { ...real, sourceUrl: "" },
    { ...real, rules: [] },
    { ...real, letters: "EFGH" },
  ])
    assert.equal(drawSchema.safeParse(value).success, false);
});
test("fraction and amount validation rejects negative, fractional and unsafe values", () => {
  for (const fractions of [0, -1, 1.5, 10001])
    assert.equal(checkSchema.safeParse({ ...input, fractions }).success, false);
  assert.equal(
    drawSchema.safeParse({
      ...draw,
      sourceUrl: "https://www.lnb.gob.pa/",
      rules: [rule({ amountCents: 0 })],
    }).success,
    false,
  );
});
