import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// The test database settings live with the backend.
loadEnv({ path: "../backend/.env", quiet: true });

const PORT = 3100;
const API_PORT = 4100;
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !/test/i.test(new URL(databaseUrl).pathname)) {
  throw new Error("Set TEST_DATABASE_URL to a dedicated test database (its name must contain \"test\") before running E2E tests.");
}

/**
 * End-to-end tests start the backend and the frontend from their production builds (`npm run build`
 * first) and drive them against the test database.
 * Each test registers its own user, so tests are independent and need no clean-up.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 5"] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: `npx next start -p ${API_PORT}`,
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/api/me`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: databaseUrl,
        APP_URL: `http://localhost:${PORT}`,
        RATE_LIMIT_DISABLED: "true",
        NODE_ENV: "production",
      },
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        BACKEND_URL: `http://localhost:${API_PORT}`,
        NODE_ENV: "production",
      },
    },
  ],
});
