/* eslint-disable react-hooks/rules-of-hooks -- Playwright's fixture `use()` callback is not a React hook. */
import {
  type APIRequestContext,
  type BrowserContext,
  type Page,
  request,
  test as base,
  expect,
} from "@playwright/test";

/**
 * E2E fixtures (C3-F0-T3). Authenticated browser state is produced by the REAL QA
 * API (register + complete profile) — never a hand-signed token. The app bootstraps
 * its session from the httpOnly refresh cookie on load, so injecting that cookie via
 * storageState yields a genuinely authenticated context.
 *
 * IMPORTANT: the API rate-limits registration to 5/IP/hour. All tests share one IP,
 * so we register a SINGLE user per worker and reuse its storageState everywhere.
 */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8010";

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

// Seeded, loginnable QA actors (C3-F0-T3-R4). Emails are @example.com (accepted by EmailStr)
// and the password is the deterministic QA-only seed password. citizen_a owns the public
// tribe and holds unread notifications; citizen_b owns the private tribe.
export const CITIZEN_A_EMAIL = "qa.citizen.a@example.com";
export const CITIZEN_B_EMAIL = "qa.citizen.b@example.com";
const QA_PASSWORD = "StrongPassword1!";

async function loginActor(email: string): Promise<QaUser> {
  const api = await request.newContext();
  const res = await api.post(`${API_URL}/api/v1/auth/login`, {
    data: { email, password: QA_PASSWORD },
  });
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
  // `.test` TLD is rejected by the API email validator; use reserved-for-tests example.com.
  const email = `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "StrongPassword1!";
  const register = await api.post(`${API_URL}/api/v1/auth/register`, {
    data: { email, password, full_name: "E2E User", city: "Reims" },
  });
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

type WorkerFixtures = {
  sharedUser: QaUser;
  authedContext: BrowserContext;
  citizenA: QaUser;
  citizenB: QaUser;
  citizenAContext: BrowserContext;
  citizenBContext: BrowserContext;
};

type TestFixtures = {
  api: APIRequestContext;
  authedPage: Page;
  citizenAPage: Page;
  citizenBPage: Page;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  sharedUser: [
    async ({ browser: _browser }, use) => {
      const user = await registerAndComplete();
      await use(user);
    },
    { scope: "worker" },
  ],
  // Worker-scoped: ONE live authenticated context per worker. The refresh token rotates
  // single-use; sharing a storageState snapshot across contexts triggers REFRESH_TOKEN_REUSE
  // (401). Keeping one context lets its cookie jar hold the rotated cookie. Tests are serial
  // (workers:1, fullyParallel:false) so no concurrent refresh.
  authedContext: [
    async ({ browser, sharedUser }, use) => {
      const context = await browser.newContext({ storageState: sharedUser.storageState });
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
  // Seeded loginnable actors — no registration, so they never consume the register limit.
  citizenA: [
    async ({ browser: _browser }, use) => {
      await use(await loginActor(CITIZEN_A_EMAIL));
    },
    { scope: "worker" },
  ],
  citizenB: [
    async ({ browser: _browser }, use) => {
      await use(await loginActor(CITIZEN_B_EMAIL));
    },
    { scope: "worker" },
  ],
  citizenAContext: [
    async ({ browser, citizenA }, use) => {
      const context = await browser.newContext({ storageState: citizenA.storageState });
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],
  citizenBContext: [
    async ({ browser, citizenB }, use) => {
      const context = await browser.newContext({ storageState: citizenB.storageState });
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

export { expect };
