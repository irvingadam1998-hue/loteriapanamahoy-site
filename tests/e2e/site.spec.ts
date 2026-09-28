import { test, expect } from "@playwright/test";

test("desktop: demo win, losing number, chance and filtering", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Resultados recientes." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("El número de tu billete").fill("4827");
  await page.getByRole("button", { name: "Comprobar mi número" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "¡Tu número tiene premio!" }),
  ).toBeVisible();
  await expect(page.locator(".result-amount strong")).toHaveText(
    "B/. 2,000.00",
  );
  await page.screenshot({ path: "test-results/prize-desktop.png" });
  await page.getByRole("button", { name: "Comprobar otro número" }).click();
  await page.getByLabel("El número de tu billete").fill("9999");
  await page.getByRole("button", { name: "Comprobar mi número" }).click();
  await expect(
    page.getByRole("heading", { name: "Esta vez no hubo premio" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Chance 2 cifras" }).click();
  await page.getByLabel("El número de tu chance").fill("27");
  await page.getByRole("button", { name: "Comprobar mi número" }).click();
  await expect(page.locator(".result-amount strong")).toHaveText("B/. 14.00");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Gordito del Zodíaco", exact: true })
    .click();
  await expect(page.locator(".draw-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Abrir este resultado" }).click();
  await expect(
    page.getByRole("heading", { name: "Gordito del Zodíaco." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Plan de premios registrado" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile: no horizontal overflow and full checker flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const width of [320, 360, 390, 480, 760, 820, 980, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => {
      const card = document
        .querySelector(".checker-card")!
        .getBoundingClientRect();
      const controls = Array.from(
        document.querySelectorAll(
          ".select-wrap-radix, .checker-select-trigger, .rt-SelectTriggerInner, .ticket-number-input, .checker-submit",
        ),
      ).map((element) => {
        const { left, right } = element.getBoundingClientRect();
        const parent = element
          .closest(".select-wrap-radix")
          ?.getBoundingClientRect();
        return {
          name: element.className,
          left,
          right,
          parentLeft: parent?.left,
          parentRight: parent?.right,
          fits:
            left >= card.left - 1 &&
            right <= card.right + 1 &&
            (!parent || (left >= parent.left - 1 && right <= parent.right + 1)),
        };
      });
      return {
        noPageOverflow:
          document.documentElement.scrollWidth <= window.innerWidth,
        controlsFit: controls.every((control) => control.fits),
        overflowingControls: controls.filter((control) => !control.fits),
      };
    });
    expect(layout.noPageOverflow, `page overflow at ${width}px`).toBe(true);
    expect(
      layout.controlsFit,
      `checker overflow at ${width}px: ${JSON.stringify(layout.overflowingControls)}`,
    ).toBe(true);
    if (width === 320) {
      for (const index of [0, 1]) {
        await page.locator(".checker-select-trigger").nth(index).click();
        const menu = page.locator(".checker-select-content").last();
        await expect(menu).toBeVisible();
        const bounds = await menu.boundingBox();
        expect(
          bounds!.x,
          `select menu ${index} is clipped on the left`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          bounds!.x + bounds!.width,
          `select menu ${index} is clipped on the right`,
        ).toBeLessThanOrEqual(width);
        await page.keyboard.press("Escape");
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.screenshot({ path: "test-results/home-mobile-top.png" });
  await page.getByLabel("El número de tu billete").fill("0027");
  await page.getByRole("button", { name: "Fracciones, letras y más" }).click();
  await page.getByLabel("Fracciones", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Comprobar mi número" }).click();
  await expect(page.locator(".result-amount strong")).toHaveText("B/. 9.00");
  const dialogBounds = await page.getByRole("dialog").boundingBox();
  expect(dialogBounds!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.y + dialogBounds!.height).toBeLessThanOrEqual(844);
  await expect(
    page.getByRole("img", { name: "Regalo animado con confeti" }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/prize-mobile.png" });
  await page.getByRole("button", { name: "Cerrar resultado" }).click();
  await page.goto("/resultados");
  await page.getByLabel("Buscar número o sorteo").fill("4827");
  await expect(page.locator(".draw-card")).toHaveCount(2);
  await page.getByLabel("Filtrar por fecha").fill("2026-09-20");
  await expect(page.locator(".draw-card")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("private admin: publish persists, edit, hide draft and revoke session", async ({
  page,
  request,
}) => {
  const unauthorized = await request.get("/api/admin/draws");
  expect(unauthorized.status()).toBe(401);
  const csrf = await request.post("/api/admin/login", {
    headers: { Origin: "https://other.example" },
    data: { password: "local-e2e-password-only" },
  });
  expect(csrf.status()).toBe(403);
  await page.goto("/admin");
  await page
    .getByLabel("Contraseña de administración")
    .fill("local-e2e-password-only");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(
    page.getByRole("heading", { name: "Tus sorteos, al día." }),
  ).toBeVisible();
  await page.getByLabel("Número de sorteo", { exact: true }).fill("E2E-2026");
  await page.getByLabel("Fecha del sorteo", { exact: true }).fill("2026-01-04");
  await page.getByLabel("1.º premio", { exact: true }).fill("0012");
  await page.getByLabel("2.º premio", { exact: true }).fill("3456");
  await page.getByLabel("3.º premio", { exact: true }).fill("7890");
  await page.getByLabel("Enlace de la fuente").fill("https://www.lnb.gob.pa/");
  await page.getByLabel("Estado de publicación").selectOption("published");
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.locator(".save-message")).toContainText("Sorteo publicado");
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  const detail = await page
    .getByRole("link", { name: "Ver resultado" })
    .getAttribute("href");
  await page.reload();
  await page.getByRole("button", { name: /Dominical.*E2E-2026/ }).click();
  await expect(page.getByLabel("1.º premio", { exact: true })).toHaveValue(
    "0012",
  );
  const id = detail!.split("/").pop()!;
  const pending = await request.post("/api/check", {
    data: { drawId: id, ticket: "billete", number: "9999", fractions: 1 },
  });
  expect((await pending.json()).status).toBe("incomplete");
  const unpriced = await request.post("/api/check", {
    data: { drawId: id, ticket: "billete", number: "0012", fractions: 1 },
  });
  const unpricedResult = await unpriced.json();
  expect(unpricedResult.status).toBe("won");
  expect(unpricedResult.unknownPrizes).toHaveLength(0);
  expect(unpricedResult.totalCents).toBe(210700);
  expect(unpricedResult.verified).toBe(false);
  await page.locator("summary").filter({ hasText: "Plan de premios" }).click();
  await page
    .getByRole("checkbox", { name: /He verificado el plan completo/ })
    .check();
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.locator(".save-message")).toContainText("Sorteo publicado");
  const priced = await request.post("/api/check", {
    data: { drawId: id, ticket: "billete", number: "0012", fractions: 2 },
  });
  const pricedResult = await priced.json();
  expect(pricedResult.totalCents).toBe(421400);
  expect(pricedResult.verified).toBe(true);
  await page.getByLabel("1.º premio", { exact: true }).fill("0023");
  await expect(
    page.getByRole("checkbox", { name: /He verificado el plan completo/ }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.locator(".save-message")).toContainText("Sorteo publicado");
  const publicPage = await request.get(detail!);
  expect(publicPage.status()).toBe(200);
  await page.getByLabel("Estado de publicación").selectOption("draft");
  await page.getByRole("button", { name: "Guardar sorteo" }).click();
  await expect(page.locator(".save-message")).toContainText(
    "Borrador guardado",
  );
  expect((await request.get(detail!)).status()).toBe(404);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "suerte_admin",
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo." }),
  ).toBeVisible();
  const revoked = await request.get("/api/admin/draws", {
    headers: { Cookie: `suerte_admin=${cookie.value}` },
  });
  expect(revoked.status()).toBe(401);
});

test("public routes, unpublished lookup and malformed check input", async ({
  request,
}) => {
  for (const route of [
    "/",
    "/resultados",
    "/como-funciona",
    "/contacto",
    "/privacidad",
    "/terminos",
    "/robots.txt",
    "/sitemap.xml",
    "/ads.txt",
    "/icon.svg",
  ]) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
  expect((await request.get("/resultados/does-not-exist")).status()).toBe(404);
  expect(
    (
      await request.post("/api/check", {
        data: {
          drawId: "demo-01",
          ticket: "chance",
          number: "4827",
          fractions: 1,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/check", {
        data: {
          drawId: "demo-01",
          ticket: "billete",
          number: "4827",
          fractions: -1,
        },
      })
    ).status(),
  ).toBe(400);
  const response = await request.post("/api/check", {
    data: {
      drawId: "not-found",
      ticket: "billete",
      number: "4827",
      fractions: 1,
    },
  });
  expect(response.status()).toBe(404);
});
