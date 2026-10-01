/**
 * Registre par exécution des médias local-video prouvés (C3-VIDEO-E2E-DYNAMIC-MEDIA-CLOSE-06).
 *
 * Harness E2E uniquement — jamais importé par l'application produit.
 */
import type { APIRequestContext, Page } from "@playwright/test";

import type { ProvenMediaContext } from "./browser-failure-policy";

/** UUID v4 syntaxique — aucun identifiant QA codé en dur. */
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const LOCAL_VIDEO_PROCESSED_PATH_RE =
  /^\/media\/local-video\/reims\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processed\.mp4$/i;

export function isLocalVideoProcessedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!LOCAL_VIDEO_PROCESSED_PATH_RE.test(parsed.pathname)) return false;
    const segments = parsed.pathname.split("/");
    const uuidSegment = segments[4] ?? "";
    return UUID_V4_RE.test(uuidSegment);
  } catch {
    return false;
  }
}

export class ProvenMediaRegistry {
  private readonly proven = new Set<string>();
  private readonly httpErrors = new Set<string>();

  toContext(): ProvenMediaContext {
    return {
      provenSuccessfulMediaUrls: this.proven,
      knownHttpErrorMediaUrls: this.httpErrors,
    };
  }

  getProvenUrls(): readonly string[] {
    return [...this.proven];
  }

  markHttpError(url: string): void {
    this.httpErrors.add(url);
  }

  attachHttpErrorObserver(page: Page): void {
    page.on("response", (response) => {
      const url = response.url();
      if (!isLocalVideoProcessedMediaUrl(url)) return;
      if (response.status() >= 400) this.markHttpError(url);
    });
  }

  /**
   * Enregistre les réponses média réussies observées (206/200 + video/* + octets).
   * Complète la sonde Range explicite pour les prefetch carousel.
   */
  attachSuccessfulMediaObserver(page: Page): void {
    page.on("response", async (response) => {
      const url = response.url();
      if (!isLocalVideoProcessedMediaUrl(url)) return;
      const status = response.status();
      if (status >= 400) {
        this.markHttpError(url);
        return;
      }
      if (status !== 200 && status !== 206) return;
      const contentType = (response.headers()["content-type"] ?? "").toLowerCase();
      if (!contentType.startsWith("video/")) return;
      try {
        const body = await response.body();
        if (body.length === 0) return;
        this.proven.add(url);
      } catch {
        // Corps indisponible — ne pas prouver sans octets.
      }
    });
  }

  /**
   * Sonde Range + enregistre l'URL exacte comme média prouvé.
   * Échoue si 4xx/5xx, Content-Type non vidéo ou corps vide.
   */
  async proveMediaUrl(page: Page, url: string): Promise<void> {
    if (!url.trim()) {
      throw new Error("proveMediaUrl: currentSrc vide");
    }
    if (!isLocalVideoProcessedMediaUrl(url)) {
      throw new Error(`proveMediaUrl: pathname non conforme — ${url}`);
    }

    const response = await page.request.get(url, {
      headers: { Range: "bytes=0-1023" },
    });
    const status = response.status();
    if (status >= 400) {
      this.markHttpError(url);
      throw new Error(`proveMediaUrl: probe HTTP ${status} pour ${url}`);
    }
    if (status !== 200 && status !== 206) {
      throw new Error(`proveMediaUrl: statut inattendu ${status} pour ${url}`);
    }

    const contentType = (response.headers()["content-type"] ?? "").toLowerCase();
    if (!contentType.startsWith("video/")) {
      throw new Error(`proveMediaUrl: Content-Type non vidéo (${contentType}) pour ${url}`);
    }

    const body = await response.body();
    if (body.length === 0) {
      throw new Error(`proveMediaUrl: corps vide pour ${url}`);
    }

    this.proven.add(url);
  }

  /** Sondre chaque élément <video> visible (carousel discovery). */
  async proveAllPageVideoMedia(page: Page): Promise<void> {
    const urls = await page.locator("video").evaluateAll((elements) =>
      elements
        .map((el) => {
          const video = el as HTMLVideoElement;
          return video.currentSrc || video.src || "";
        })
        .filter((url) => url.length > 0),
    );
    for (const url of urls) {
      if (isLocalVideoProcessedMediaUrl(url)) {
        await this.proveMediaUrl(page, url);
      }
    }
  }

  /** Récupère video.currentSrc puis sonde/enregistre. */
  async proveCurrentVideoMedia(page: Page): Promise<string> {
    const currentSrc = await page.locator("video").first().evaluate((el) => {
      const video = el as HTMLVideoElement;
      return video.currentSrc || video.src || "";
    });
    await this.proveMediaUrl(page, currentSrc);
    return currentSrc;
  }
}

/** Sondre tous les médias local-video du feed avant interactions interruptives. */
export async function proveFeedLocalVideoMedia(
  page: Page,
  api: APIRequestContext,
  apiBaseUrl: string,
  authHeaders: Record<string, string>,
  registry: ProvenMediaRegistry,
  limit = 20,
): Promise<void> {
  const res = await api.get(`${apiBaseUrl}/api/v1/local-videos/feed?city=Reims&limit=${limit}`, {
    headers: authHeaders,
  });
  if (!res.ok()) {
    throw new Error(`proveFeedLocalVideoMedia: feed HTTP ${res.status()}`);
  }
  const json = (await res.json()) as { items?: Array<{ media_url?: string | null }> };
  for (const item of json.items ?? []) {
    const url = (item.media_url ?? "").trim();
    if (url && isLocalVideoProcessedMediaUrl(url)) {
      await registry.proveMediaUrl(page, url);
    }
  }
}
