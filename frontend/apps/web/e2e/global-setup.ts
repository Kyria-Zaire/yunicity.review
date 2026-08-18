import type { FullConfig } from "@playwright/test";

import { resetAuthTelemetry } from "./auth-telemetry";

/**
 * Fail-closed harness gate (C3-F0-T3): before any browser test, prove the QA API is
 * up and local. Refuses any non-local target so a stray env can never point the suite
 * at dev/production. Reset/reseed of yunicity_qa is performed by the harness runner
 * (docker compose exec ... app.qa.launcher) prior to invoking Playwright.
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  resetAuthTelemetry();
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8010";
  const host = new URL(apiUrl).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`E2E global-setup refuses a non-local API: ${apiUrl}`);
  }

  const res = await fetch(`${apiUrl}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`QA API not healthy at ${apiUrl} (status ${res.status})`);
  }
  const body = (await res.json()) as { status?: string };
  if (body.status !== "ok") {
    throw new Error(`QA API health not ok: ${JSON.stringify(body)}`);
  }

  const ready = await fetch(`${apiUrl}/api/v1/ready`);
  const readyBody = (await ready.json()) as { checks?: { database?: string } };
  if (readyBody.checks?.database !== "ok") {
    throw new Error(`QA database not ready: ${JSON.stringify(readyBody)}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[e2e] QA gate OK — API ${apiUrl} healthy, database ready.`);
}

export default globalSetup;
