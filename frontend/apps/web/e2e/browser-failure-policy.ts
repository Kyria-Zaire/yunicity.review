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
 * C3-VIDEO-E2E-DYNAMIC-MEDIA-CLOSE-06 : les médias local-video dynamiques (uploads réels QA)
 * ne sont tolérés en ERR_ABORTED que s'ils figurent dans PROVEN-SUCCESSFUL-MEDIA-URLS
 * (registre par exécution, alimenté par une sonde Range préalable).
 */
export type FailedRequestRecord = {
  url: string;
  method: string;
  errorText: string;
  /** Playwright `request.resourceType()` — requis pour QA-MEDIA-03 dynamique. */
  resourceType?: string;
};

export type ProvenMediaContext = {
  provenSuccessfulMediaUrls: ReadonlySet<string>;
  knownHttpErrorMediaUrls: ReadonlySet<string>;
};

export type BrowserFailureInput = {
  failedRequests: readonly FailedRequestRecord[];
  consoleErrors: readonly string[];
  /** Registre par exécution — médias local-video prouvés avant interruption lecteur. */
  provenMedia?: ProvenMediaContext;
};

export type BrowserFailureVerdict = {
  ok: boolean;
  violations: string[];
};

/** Origines locales de la stack QA — tout le reste est externe, donc refusé. */
const QA_API_ORIGINS = ["http://localhost:8010", "http://127.0.0.1:8010"] as const;
const QA_WEB_ORIGINS = ["http://localhost:3002", "http://127.0.0.1:3002"] as const;
const QA_MEDIA_ORIGINS = [...QA_API_ORIGINS, ...QA_WEB_ORIGINS] as const;

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
  {
    id: "QA-NOTIF-01",
    origins: [...QA_API_ORIGINS],
    pathname: "/api/v1/notifications",
    method: "GET",
    errorText: "net::ERR_FAILED",
    searchParams: { limit: "1" },
  },
  {
    id: "QA-MEDIA-01",
    origins: [...QA_MEDIA_ORIGINS],
    pathname: "/qa/qa-sample-video.mp4",
    method: "GET",
    errorText: "net::ERR_BLOCKED_BY_ORB",
    searchParams: {},
  },
  {
    id: "QA-MEDIA-01",
    origins: [...QA_MEDIA_ORIGINS],
    pathname: "/qa/qa-sample-video.jpg",
    method: "GET",
    errorText: "net::ERR_BLOCKED_BY_ORB",
    searchParams: {},
  },
  {
    id: "QA-MEDIA-02",
    origins: [...QA_MEDIA_ORIGINS],
    pathname: "/media/qa/qa-sample-video.mp4",
    method: "GET",
    errorText: "net::ERR_ABORTED",
    searchParams: {},
  },
  {
    id: "QA-MEDIA-02",
    origins: [...QA_MEDIA_ORIGINS],
    pathname: "/media/qa/qa-sample-video-portrait.mp4",
    method: "GET",
    errorText: "net::ERR_ABORTED",
    searchParams: {},
  },
];

const LOCAL_VIDEO_PROCESSED_PATH_RE =
  /^\/media\/local-video\/reims\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processed\.mp4$/i;

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function isDynamicLocalVideoProcessedPath(pathname: string): boolean {
  if (!LOCAL_VIDEO_PROCESSED_PATH_RE.test(pathname)) return false;
  const uuidSegment = pathname.split("/")[4] ?? "";
  return UUID_V4_RE.test(uuidSegment);
}

/**
 * QA-MEDIA-03 — média local-video dynamique prouvé avant interruption lecteur (drawer/navigation).
 */
function matchProvenDynamicMediaAbort(
  record: FailedRequestRecord,
  provenMedia: ProvenMediaContext,
): boolean {
  if (record.method !== "GET") return false;
  if (record.errorText !== "net::ERR_ABORTED") return false;
  if (record.resourceType !== "media") return false;

  let parsed: URL;
  try {
    parsed = new URL(record.url);
  } catch {
    return false;
  }

  if (!(QA_MEDIA_ORIGINS as readonly string[]).includes(parsed.origin)) return false;
  if (!isDynamicLocalVideoProcessedPath(parsed.pathname)) return false;
  if (parsed.searchParams.toString().length > 0) return false;
  if (provenMedia.knownHttpErrorMediaUrls.has(record.url)) return false;
  if (!provenMedia.provenSuccessfulMediaUrls.has(record.url)) return false;

  return true;
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

    if (input.provenMedia && matchProvenDynamicMediaAbort(request, input.provenMedia)) {
      allowedUrls.push(request.url);
      continue;
    }

    violations.push(
      `requête échouée hors signature autorisée : ${request.method} ${request.url} -> ${request.errorText}`,
    );
  }

  let credits = allowedUrls.length;

  for (const message of input.consoleErrors) {
    const urls = message.match(URL_IN_MESSAGE) ?? [];

    if (urls.length > 0) {
      const external = urls.filter((url) => {
        try {
          const origin = new URL(url).origin;
          return !(QA_MEDIA_ORIGINS as readonly string[]).includes(origin);
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
