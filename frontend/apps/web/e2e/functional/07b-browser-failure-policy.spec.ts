import { expect, test } from "@playwright/test";

import { evaluateBrowserFailures, type FailedRequestRecord, type ProvenMediaContext } from "../browser-failure-policy";

/**
 * C3.0-T4-R1 — tests de la POLITIQUE d'échecs navigateur, indépendants du parcours produit.
 *
 * Aucune page, aucun réseau, aucun timing : on alimente la politique avec des enregistrements
 * réseau/console fabriqués et on vérifie son verdict. C'est ce qui permet de prouver, de façon
 * déterministe, qu'un endpoint inconnu renvoyant exactement `net::ERR_FAILED` est REFUSÉ.
 */
const QA_API = "http://localhost:8010";
const QA_WEB = "http://localhost:3002";

const NOTIF_FAILURE: FailedRequestRecord = {
  url: `${QA_API}/api/v1/notifications?limit=1`,
  method: "GET",
  errorText: "net::ERR_FAILED",
};

const MEDIA_ORB_FAILURE: FailedRequestRecord = {
  url: `${QA_API}/qa/qa-sample-video.mp4`,
  method: "GET",
  errorText: "net::ERR_BLOCKED_BY_ORB",
};

const MEDIA_LANDSCAPE_ABORT: FailedRequestRecord = {
  url: `${QA_API}/media/qa/qa-sample-video.mp4`,
  method: "GET",
  errorText: "net::ERR_ABORTED",
};

const MEDIA_PORTRAIT_ABORT: FailedRequestRecord = {
  url: `${QA_API}/media/qa/qa-sample-video-portrait.mp4`,
  method: "GET",
  errorText: "net::ERR_ABORTED",
};

/** Message console observé en QA, porteur de l'URL de la requête annulée (QA-NOTIF-01). */
const NOTIF_CONSOLE_MESSAGE =
  "Access to fetch at 'http://localhost:8010/api/v1/notifications?limit=1' from origin " +
  "'http://localhost:3002' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' " +
  "header is present on the requested resource.";

/** Message console générique, sans URL — inexploitable seul. */
const GENERIC_CONSOLE_MESSAGE = "Failed to load resource: net::ERR_FAILED";

/** UUID synthétique — aucun identifiant QA courant codé en dur. */
const SYNTH_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function dynamicProcessedUrl(origin: string, uuid = SYNTH_UUID): string {
  return `${origin}/media/local-video/reims/${uuid}/processed.mp4`;
}

function provenContext(urls: readonly string[], httpErrors: readonly string[] = []): ProvenMediaContext {
  return {
    provenSuccessfulMediaUrls: new Set(urls),
    knownHttpErrorMediaUrls: new Set(httpErrors),
  };
}

const DYNAMIC_MEDIA_ABORT: FailedRequestRecord = {
  url: dynamicProcessedUrl(QA_API),
  method: "GET",
  errorText: "net::ERR_ABORTED",
  resourceType: "media",
};

test.describe("Politique d'échecs navigateur", () => {
  test("autorise la requête notifications QA exacte avec son erreur exacte", () => {
    const verdict = evaluateBrowserFailures({ failedRequests: [NOTIF_FAILURE], consoleErrors: [] });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("autorise le média placeholder QA exact bloqué par ORB", () => {
    const verdict = evaluateBrowserFailures({ failedRequests: [MEDIA_ORB_FAILURE], consoleErrors: [] });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("autorise le média landscape QA annulé par le navigateur (ERR_ABORTED)", () => {
    const verdict = evaluateBrowserFailures({ failedRequests: [MEDIA_LANDSCAPE_ABORT], consoleErrors: [] });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("autorise le média portrait QA annulé par le navigateur (ERR_ABORTED)", () => {
    const verdict = evaluateBrowserFailures({ failedRequests: [MEDIA_PORTRAIT_ABORT], consoleErrors: [] });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("REFUSE un autre endpoint local qui échoue avec le même net::ERR_FAILED", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        { url: `${QA_API}/api/v1/local-videos/feed?city=Reims`, method: "GET", errorText: "net::ERR_FAILED" },
      ],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("/api/v1/local-videos/feed");
  });

  test("REFUSE le même chemin servi par un domaine externe", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        { url: "https://evil.example.com/api/v1/notifications?limit=1", method: "GET", errorText: "net::ERR_FAILED" },
      ],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("evil.example.com");
  });

  test("REFUSE une méthode différente sur le chemin autorisé", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, method: "POST" }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE une erreur différente sur la signature autorisée", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, errorText: "net::ERR_CONNECTION_REFUSED" }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE limit=2 sur le chemin notifications", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, url: `${QA_API}/api/v1/notifications?limit=2` }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE l'absence du paramètre limit", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, url: `${QA_API}/api/v1/notifications` }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE un paramètre supplémentaire inattendu", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, url: `${QA_API}/api/v1/notifications?limit=1&cursor=abc` }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE le même chemin sur un autre port local", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...NOTIF_FAILURE, url: `${QA_WEB}/api/v1/notifications?limit=1` }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE un média QA portant une query inattendue", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...MEDIA_ORB_FAILURE, url: `${QA_API}/qa/qa-sample-video.mp4?v=2` }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE le portrait QA avec ERR_FAILED (pas une annulation navigateur)", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...MEDIA_PORTRAIT_ABORT, errorText: "net::ERR_FAILED" }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("qa-sample-video-portrait.mp4");
  });

  test("REFUSE un autre MP4 local non seedé", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        {
          url: `${QA_API}/media/qa/other-sample-video.mp4`,
          method: "GET",
          errorText: "net::ERR_ABORTED",
        },
      ],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE le portrait QA sur une origine de production", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        {
          url: "https://media.yunicity.city/media/qa/qa-sample-video-portrait.mp4",
          method: "GET",
          errorText: "net::ERR_ABORTED",
        },
      ],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("media.yunicity.city");
  });

  test("REFUSE POST sur le portrait QA même avec ERR_ABORTED", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...MEDIA_PORTRAIT_ABORT, method: "POST" }],
      consoleErrors: [],
    });
    expect(verdict.ok).toBe(false);
  });

  test("REFUSE le portrait QA avec une erreur HTTP 404/500 (pas ERR_ABORTED)", () => {
    for (const errorText of ["net::ERR_HTTP_RESPONSE_CODE_404", "net::ERR_HTTP_RESPONSE_CODE_500"]) {
      const verdict = evaluateBrowserFailures({
        failedRequests: [{ ...MEDIA_PORTRAIT_ABORT, errorText }],
        consoleErrors: [],
      });
      expect(verdict.ok, errorText).toBe(false);
    }
  });

  test("REFUSE un message console générique sans requête échouée corrélée", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [],
      consoleErrors: [GENERIC_CONSOLE_MESSAGE],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("non corrélé");
  });

  test("autorise la ligne de base QA réelle : requêtes connues + messages corrélés", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        NOTIF_FAILURE,
        { url: `${QA_API}/qa/qa-sample-video.jpg`, method: "GET", errorText: "net::ERR_BLOCKED_BY_ORB" },
        MEDIA_ORB_FAILURE,
        MEDIA_ORB_FAILURE,
      ],
      consoleErrors: [NOTIF_CONSOLE_MESSAGE, GENERIC_CONSOLE_MESSAGE],
    });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("REFUSE un message générique supplémentaire au-delà des crédits", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [NOTIF_FAILURE],
      consoleErrors: [NOTIF_CONSOLE_MESSAGE, GENERIC_CONSOLE_MESSAGE, GENERIC_CONSOLE_MESSAGE],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("non corrélé");
  });

  test("REFUSE un message console porteur d'une URL non autorisée", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [],
      consoleErrors: ["Access to fetch at 'http://localhost:8010/api/v1/posts' has been blocked"],
    });
    expect(verdict.ok).toBe(false);
  });

  test("autorise l'absence totale de défaillance", () => {
    const verdict = evaluateBrowserFailures({ failedRequests: [], consoleErrors: [] });
    expect(verdict.ok).toBe(true);
  });

  test("ACCEPT — média local dynamique prouvé (206) + GET + media + ERR_ABORTED", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.violations).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  test("REJECT — UUID valide mais URL non prouvée", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url }],
      consoleErrors: [],
      provenMedia: provenContext([]),
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain(url);
  });

  test("REJECT — média prouvé mais erreur HTTP ultérieure connue", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url }],
      consoleErrors: [],
      provenMedia: provenContext([url], [url]),
    });
    expect(verdict.ok).toBe(false);
  });

  test("REJECT — ERR_FAILED sur média dynamique prouvé", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url, errorText: "net::ERR_FAILED" }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.ok).toBe(false);
  });

  test("REJECT — POST sur média dynamique prouvé", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url, method: "POST" }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.ok).toBe(false);
  });

  test("REJECT — origine production media.yunicity.city", () => {
    const url = dynamicProcessedUrl("https://media.yunicity.city", SYNTH_UUID);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.violations.join(" ")).toContain("media.yunicity.city");
  });

  test("REJECT — pathname local-video sans processed.mp4", () => {
    const url = `${QA_API}/media/local-video/reims/${SYNTH_UUID}/source.mp4`;
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ ...DYNAMIC_MEDIA_ABORT, url }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.ok).toBe(false);
  });

  test("REJECT — resourceType manquant sur média dynamique prouvé", () => {
    const url = dynamicProcessedUrl(QA_API);
    const verdict = evaluateBrowserFailures({
      failedRequests: [{ url, method: "GET", errorText: "net::ERR_ABORTED" }],
      consoleErrors: [],
      provenMedia: provenContext([url]),
    });
    expect(verdict.ok).toBe(false);
  });

  test("REJECT — ERR_ABORTED sur autre MP4 local non seedé (fixtures QA restent via QA-MEDIA-02)", () => {
    const verdict = evaluateBrowserFailures({
      failedRequests: [
        {
          url: `${QA_API}/media/qa/other-sample-video.mp4`,
          method: "GET",
          errorText: "net::ERR_ABORTED",
          resourceType: "media",
        },
      ],
      consoleErrors: [],
      provenMedia: provenContext([`${QA_API}/media/qa/other-sample-video.mp4`]),
    });
    expect(verdict.ok).toBe(false);
  });
});
