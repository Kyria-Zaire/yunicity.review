/* eslint-disable react-hooks/rules-of-hooks -- Playwright's fixture `use()` callback is not a React hook. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type APIRequestContext,
  type BrowserContext,
  type Page,
  request,
  test as base,
  expect,
} from "@playwright/test";

import {
  attachAuthTelemetry,
  readAuthTelemetry,
  recordAuthRequest,
  resetAuthTelemetry,
  type AuthTelemetry,
} from "./auth-telemetry";

/**
 * E2E fixtures (C3-F0-T3). Authenticated browser state is produced by the REAL QA
 * API (register + complete profile) — never a hand-signed token. The app bootstraps
 * its session from the httpOnly refresh cookie on load, so injecting that cookie via
 * storageState yields a genuinely authenticated context.
 *
 * C3-QA-AUTH-HARNESS-STABILIZE-01 : deux exports distincts —
 * - `test` / `authedPage` : register worker-scoped uniquement ;
 * - `testCitizen` / `citizenAPage` : login seedé à la demande (import explicite).
 */
export const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";

export type QaUser = {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  storageState: Awaited<ReturnType<APIRequestContext["storageState"]>>;
};

export function bearer(user: QaUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.accessToken}` };
}

export { readAuthTelemetry, resetAuthTelemetry, type AuthTelemetry, expect };

export const CITIZEN_A_EMAIL = "qa.citizen.a@example.com";
export const CITIZEN_B_EMAIL = "qa.citizen.b@example.com";
const QA_PASSWORD = "StrongPassword1!";

async function loginActor(email: string): Promise<QaUser> {
  const api = await request.newContext();
  const res = await api.post(`${API_URL}/api/v1/auth/login`, {
    data: { email, password: QA_PASSWORD },
  });
  recordAuthRequest("/auth/login");
  expect(res.status(), await res.text()).toBe(200);
  const json = (await res.json()) as { access_token: string; user?: { id: string } };
  const storageState = await api.storageState();
  await api.dispose();
  return {
    email,
    password: QA_PASSWORD,
    userId: json.user?.id ?? "",
    accessToken: json.access_token,
    storageState,
  };
}

async function registerAndComplete(): Promise<QaUser> {
  const api = await request.newContext();
  const email = `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "StrongPassword1!";
  const register = await api.post(`${API_URL}/api/v1/auth/register`, {
    data: { email, password, full_name: "E2E User", city: "Reims" },
  });
  recordAuthRequest("/auth/register");
  expect(register.status(), await register.text()).toBe(201);
  const json = (await register.json()) as { access_token: string; user: { id: string } };
  const complete = await api.post(`${API_URL}/api/v1/profile/complete`, {
    data: { city: "Reims", interests: ["culture"] },
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  expect(complete.status(), await complete.text()).toBe(200);
  const storageState = await api.storageState();
  await api.dispose();
  return { email, password, userId: json.user.id, accessToken: json.access_token, storageState };
}

async function createLiveAuthedContext(
  browser: { newContext: (options?: { storageState?: QaUser["storageState"] }) => Promise<BrowserContext> },
  storageState: QaUser["storageState"],
): Promise<BrowserContext> {
  const context = await browser.newContext({ storageState });
  attachAuthTelemetry(context);
  return context;
}

type AuthedWorkerFixtures = {
  sharedUser: QaUser;
  authedContext: BrowserContext;
  authTelemetryDump: void;
};

type AuthedTestFixtures = {
  api: APIRequestContext;
  authedPage: Page;
};

/** Specs `authedPage`-only : zéro login seedé. */
export const test = base.extend<AuthedTestFixtures, AuthedWorkerFixtures>({
  authTelemetryDump: [
    async ({}, use) => {
      await use();
      const telemetry = readAuthTelemetry();
      const outDir = resolve(process.cwd(), "test-results");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, "auth-telemetry.json"), `${JSON.stringify(telemetry, null, 2)}\n`);
      console.log(`[e2e] auth telemetry login=${telemetry.login} register=${telemetry.register} refresh=${telemetry.refresh}`);
    },
    { scope: "worker", auto: true },
  ],
  sharedUser: [
    async ({}, use) => {
      await use(await registerAndComplete());
    },
    { scope: "worker" },
  ],
  authedContext: [
    async ({ browser, sharedUser }, use) => {
      const context = await createLiveAuthedContext(browser, sharedUser.storageState);
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext();
    await use(ctx);
    await ctx.dispose();
  },
  authedPage: async ({ authedContext }, use) => {
    const page = await authedContext.newPage();
    await use(page);
    await page.close();
  },
});

type CitizenWorkerFixtures = {
  citizenA: QaUser;
  citizenB: QaUser;
  citizenAContext: BrowserContext;
  citizenBContext: BrowserContext;
};

type CitizenTestFixtures = {
  citizenAPage: Page;
  citizenBPage: Page;
};

/** Specs acteur seedé QA : login worker-scoped à la demande. */
export const testCitizen = test.extend<CitizenTestFixtures, CitizenWorkerFixtures>({
  citizenA: [
    async ({}, use) => {
      await use(await loginActor(CITIZEN_A_EMAIL));
    },
    { scope: "worker" },
  ],
  citizenB: [
    async ({}, use) => {
      await use(await loginActor(CITIZEN_B_EMAIL));
    },
    { scope: "worker" },
  ],
  citizenAContext: [
    async ({ browser, citizenA }, use) => {
      const context = await createLiveAuthedContext(browser, citizenA.storageState);
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],
  citizenBContext: [
    async ({ browser, citizenB }, use) => {
      const context = await createLiveAuthedContext(browser, citizenB.storageState);
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],
  citizenAPage: async ({ citizenAContext }, use) => {
    const page = await citizenAContext.newPage();
    await use(page);
    await page.close();
  },
  citizenBPage: async ({ citizenBContext }, use) => {
    const page = await citizenBContext.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * Compat legacy : specs historiques important `test` + `citizenAPage`.
 * Préférer `testCitizen` pour les nouveaux tests afin de ne pas mélanger les pools.
 */
export const testLegacyCitizen = testCitizen;
