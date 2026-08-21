import type { FullConfig } from "@playwright/test";

import { resetAuthTelemetry } from "./auth-telemetry";

/**
 * Fail-closed harness gate (C3-F0-T3): before any browser test, prove the QA API is
 * up and local. Refuses any non-local target so a stray env can never point the suite
 * at dev/production.
 *
 * C3.1-R1G — ce setup NE MUTE RIEN et ne doit jamais le faire : la preparation de
 * `yunicity_qa` (reset/migrate/seed/verify + reset-rate-limits) reste une commande
 * operateur explicite et visible — `scripts/qa-playwright-baseline.sh`. Ce garde se
 * contente de VERIFIER que cette preparation a eu lieu, en lisant une donnee publique
 * du seed. Sans cela, une baseline absente se manifestait par des echecs diffus au
 * milieu de la suite au lieu d'un refus immediat et lisible.
 */
const QA_BASELINE_COMMAND = "sh scripts/qa-playwright-baseline.sh";
const QA_SEEDED_PUBLIC_TRIBE = "qa-tribu-publique";
/** C3.1-R1I — le serveur web de preuve doit etre production-like, jamais `next dev`. */
const WEB_SERVER_COMMAND = "sh scripts/qa-web-server.sh";
const EXPECTED_WEB_SERVER_MODE = "production-like";
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
  // Verification NON DESTRUCTIVE du serveur web (C3.1-R1I) : un `next dev` ne porte
  // pas ce marqueur, donc une preuve lancee par erreur contre lui echoue tout de suite
  // au lieu de produire des rouges non reproductibles.
  const webUrl = process.env.E2E_WEB_URL ?? "http://localhost:3002";
  const serverInfo = await fetch(`${webUrl}/__e2e/server-info`).catch(() => null);
  if (!serverInfo || !serverInfo.ok) {
    throw new Error(
      `Serveur web non production-like sur ${webUrl} (marqueur E2E absent). Run: ${WEB_SERVER_COMMAND}`,
    );
  }
  const serverBody = (await serverInfo.json()) as { mode?: string };
  if (serverBody.mode !== EXPECTED_WEB_SERVER_MODE) {
    throw new Error(
      `Serveur web en mode « ${serverBody.mode} » au lieu de « ${EXPECTED_WEB_SERVER_MODE} ». ` +
        `Run: ${WEB_SERVER_COMMAND}`,
    );
  }

  // Verification NON DESTRUCTIVE de la baseline : lecture d'une donnee publique du
  // seed. Aucune ecriture, aucun reset — seulement un refus lisible si la preparation
  // canonique n'a pas ete jouee.
  const tribes = await fetch(`${apiUrl}/api/v1/tribes?city=Reims`);
  if (!tribes.ok) {
    throw new Error(
      `QA baseline unreadable (GET /tribes -> ${tribes.status}). Run: ${QA_BASELINE_COMMAND}`,
    );
  }
  const tribesBody = (await tribes.json()) as { items?: Array<{ slug?: string }> };
  const seeded = (tribesBody.items ?? []).some((item) => item.slug === QA_SEEDED_PUBLIC_TRIBE);
  if (!seeded) {
    throw new Error(
      `QA baseline not seeded (« ${QA_SEEDED_PUBLIC_TRIBE} » absente). ` +
        `Playwright ne prepare pas la base lui-meme. Run: ${QA_BASELINE_COMMAND}`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `[e2e] QA gate OK — web ${EXPECTED_WEB_SERVER_MODE}, API ${apiUrl} healthy, baseline seeded.`,
  );
}

export default globalSetup;
