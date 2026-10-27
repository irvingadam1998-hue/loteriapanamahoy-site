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
    "/icon-lph-192.png",
  ]) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
  expect((await request.get("/resultados/does-not-exist")).status()).toBe(404);
  for (const route of ["/admin", "/api/admin/draws", "/api/admin/login", "/api/admin/logout", "/api/admin/mfa/verify"])
    expect((await request.get(route)).status(), route).toBe(404);
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
