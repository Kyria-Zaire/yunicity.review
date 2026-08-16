/**
 * Politique d'acceptation des échecs navigateur (C3.0-T4-R1) — INTERNE au harnais E2E.
 *
 * Ce module n'est jamais importé par l'application. Il décide, à partir des événements
 * `requestfailed` et `console` d'une page, quelles défaillances sont du bruit d'environnement
 * QA **connu et documenté**, et lesquelles doivent faire échouer le test.
 *
 * Principe : la décision se prend sur la REQUÊTE (qui porte une URL réelle), jamais sur le
 * texte d'un message console. Il n'existe donc aucune règle générale sur `net::ERR_FAILED` :
 * la même erreur, sur une autre URL, est refusée.
 *
 * Les messages console génériques (sans URL) ne sont jamais autorisés seuls : ils ne sont
 * tolérés que dans la limite du nombre de requêtes échouées déjà reconnues — correspondance
 * bornée, un message consommant exactement un crédit.
 */
export type FailedRequestRecord = {
  url: string;
  method: string;
  errorText: string;
};

export type BrowserFailureInput = {
  failedRequests: readonly FailedRequestRecord[];
  consoleErrors: readonly string[];
};

export type BrowserFailureVerdict = {
  ok: boolean;
  violations: string[];
};

/** Origines locales de la stack QA — tout le reste est externe, donc refusé. */
const QA_API_ORIGIN = "http://localhost:8010";
const QA_WEB_ORIGIN = "http://localhost:3002";

type AllowedSignature = {
  id: string;
  origins: readonly string[];
  pathname: string;
  method: string;
  errorText: string;
  /** Paramètres de recherche ATTENDUS, exhaustifs : ni manquants, ni supplémentaires. */
  searchParams: Readonly<Record<string, string>>;
};

/**
 * Signatures EXACTES tolérées — origine + chemin + méthode + erreur. Toute divergence,
 * même d'un seul champ, rend la requête bloquante.
 */
const ALLOWED_SIGNATURES: readonly AllowedSignature[] = [
  // QA-NOTIF-01 — requête de notifications annulée au bootstrap de la stack QA.
  // Le sondage produit exactement `?limit=1` : toute autre valeur, l'absence du paramètre
  // ou un paramètre supplémentaire décrivent une AUTRE requête, donc bloquante.
  {
    id: "QA-NOTIF-01",
    origins: [QA_API_ORIGIN],
    pathname: "/api/v1/notifications",
    method: "GET",
    errorText: "net::ERR_FAILED",
    searchParams: { limit: "1" },
  },
  // QA-MEDIA-01 — média placeholder seedé, refusé par l'Opaque Response Blocking de Chromium.
  // Servi sans query : une URL paramétrée n'est pas cette requête.
  {
    id: "QA-MEDIA-01",
    origins: [QA_API_ORIGIN, QA_WEB_ORIGIN],
    pathname: "/qa/qa-sample-video.mp4",
    method: "GET",
    errorText: "net::ERR_BLOCKED_BY_ORB",
    searchParams: {},
  },
  {
    id: "QA-MEDIA-01",
    origins: [QA_API_ORIGIN, QA_WEB_ORIGIN],
    pathname: "/qa/qa-sample-video.jpg",
    method: "GET",
    errorText: "net::ERR_BLOCKED_BY_ORB",
    searchParams: {},
  },
];

/** Égalité EXHAUSTIVE des paramètres de recherche : même ensemble de clés, mêmes valeurs. */
function hasExactSearchParams(url: URL, expected: Readonly<Record<string, string>>): boolean {
  const actualKeys = Array.from(url.searchParams.keys());
  const expectedKeys = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length) return false;
  return expectedKeys.every((key) => url.searchParams.get(key) === expected[key]);
}

/** Messages console génériques observés — sans URL, donc inexploitables seuls. */
const GENERIC_CONSOLE_MESSAGES: readonly string[] = [
  "Failed to load resource: net::ERR_FAILED",
  "Failed to load resource: net::ERR_BLOCKED_BY_ORB",
];

const URL_IN_MESSAGE = /https?:\/\/[^\s'"<>)]+/g;

function matchSignature(record: FailedRequestRecord): AllowedSignature | null {
  let parsed: URL;
  try {
    parsed = new URL(record.url);
  } catch {
    return null;
  }
  return (
    ALLOWED_SIGNATURES.find(
      (signature) =>
        signature.origins.includes(parsed.origin) &&
        parsed.pathname === signature.pathname &&
        record.method === signature.method &&
        record.errorText === signature.errorText &&
        hasExactSearchParams(parsed, signature.searchParams),
    ) ?? null
  );
}

function sameRequest(messageUrl: string, allowedUrls: readonly string[]): boolean {
  return allowedUrls.some((allowed) => allowed === messageUrl);
}

export function evaluateBrowserFailures(input: BrowserFailureInput): BrowserFailureVerdict {
  const violations: string[] = [];
  const allowedUrls: string[] = [];

  for (const request of input.failedRequests) {
    const signature = matchSignature(request);
    if (signature) {
      allowedUrls.push(request.url);
      continue;
    }
    violations.push(
      `requête échouée hors signature autorisée : ${request.method} ${request.url} -> ${request.errorText}`,
    );
  }

  // Une requête échouée reconnue = un crédit, et un seul, pour un message console.
  let credits = allowedUrls.length;

  for (const message of input.consoleErrors) {
    const urls = message.match(URL_IN_MESSAGE) ?? [];

    if (urls.length > 0) {
      const external = urls.filter((url) => {
        try {
          const origin = new URL(url).origin;
          return origin !== QA_API_ORIGIN && origin !== QA_WEB_ORIGIN;
        } catch {
          return true;
        }
      });
      if (external.length > 0) {
        violations.push(`message console pointant une origine externe (${external.join(", ")}) : ${message}`);
        continue;
      }
      if (!urls.some((url) => sameRequest(url, allowedUrls))) {
        violations.push(`message console non corrélé à une requête autorisée : ${message}`);
        continue;
      }
    } else if (!GENERIC_CONSOLE_MESSAGES.includes(message)) {
      violations.push(`message console inconnu : ${message}`);
      continue;
    }

    if (credits <= 0) {
      violations.push(`message console non corrélé (aucun crédit de requête échouée restant) : ${message}`);
      continue;
    }
    credits -= 1;
  }

  return { ok: violations.length === 0, violations };
}
