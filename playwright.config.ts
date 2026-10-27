import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import path from "node:path";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3016",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },
  webServer: {
    command: "npm run start -- --port 3016",
    url: "http://localhost:3016",
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3016",
      DATABASE_PATH: path.join(tmpdir(), `suerte-e2e-${Date.now()}.sqlite`),
      DATABASE_PROVIDER: "sqlite",
      DEMO_DATA: "true",
    },
    timeout: 60000,
  },
});
