import { expect, type Page } from "@playwright/test";

import { API_URL } from "./fixtures";
import { makeSolidPngBuffer } from "./png-fixture";

/**
 * Création autoritaire d'une publication citoyenne AVEC média (C3.1-R1G).
 *
 * Motivation : la spec 19 vérifiait la géométrie sur « la première publication du fil
 * qui porte un média ». Le seed QA n'en crée aucune — `qa_fixtures` ne pose de
 * `media_url` que sur une vidéo locale — si bien que la spec ne passait qu'après les
 * specs 16/17/18, qui en publient. Elle dépendait donc de l'ordre d'exécution et du
 * contenu du fil, pas de son propre contrat.
 *
 * Ce helper crée sa donnée par les contrats HTTP EXISTANTS (`POST /posts/media` puis
 * `POST /posts`) — aucun endpoint inventé, aucun fichier utilisateur externe : le PNG
 * est généré en mémoire aux dimensions exactes demandées. Le marqueur unique rendu
 * permet de viser la publication créée, sans dépendre d'un rang ni d'un décompte.
 *
 * ── Pourquoi passer par `page.request` ──────────────────────────────────────
 * Le jeton d'accès expire en 15 minutes alors que la fixture `citizenA` est de portée
 * worker : dans une suite complète, son jeton est périmé bien avant la spec 19. On
 * repart donc du cookie de rafraîchissement httpOnly du contexte navigateur, qui est
 * rotatif et valide 7 jours. `page.request` partage ce pot de cookies : la rotation
 * reste cohérente avec la session du navigateur, et aucune connexion supplémentaire
 * n'est consommée (l'API limite les logins à 5/IP/heure).
 *
 * APPELER AVANT `page.goto` : l'application rafraîchit elle aussi le jeton au
 * chargement, et deux rotations concurrentes du même cookie invalideraient la session.
 */

export type PublishedFeedMedia = {
  marker: string;
  mediaUrl: string;
  natural: { width: number; height: number };
};

export type PublishFeedMediaOptions = {
  /** Texte unique du corps de la publication — sert de sélecteur exact côté test. */
  marker: string;
  /** Dimensions naturelles du PNG généré (portrait par défaut : contrat R1C). */
  width?: number;
  height?: number;
};

const DEFAULT_PORTRAIT = { width: 360, height: 640 } as const;

/** Jeton d'accès frais, obtenu par rotation du cookie de session du contexte courant. */
export async function freshAccessToken(page: Page): Promise<string> {
  const refreshed = await page.request.post(`${API_URL}/api/v1/auth/refresh`);
  expect(refreshed.status(), `rafraîchissement de session : ${await refreshed.text()}`).toBe(200);
  const body = (await refreshed.json()) as { access_token?: string };
  const token = body.access_token ?? "";
  expect(token, "rafraîchissement de session : jeton absent").not.toBe("");
  return token;
}

export async function publishCitizenPostWithMedia(
  page: Page,
  options: PublishFeedMediaOptions,
): Promise<PublishedFeedMedia> {
  const width = options.width ?? DEFAULT_PORTRAIT.width;
  const height = options.height ?? DEFAULT_PORTRAIT.height;
  const authorization = { Authorization: `Bearer ${await freshAccessToken(page)}` };

  const upload = await page.request.post(`${API_URL}/api/v1/posts/media`, {
    headers: authorization,
    multipart: {
      file: {
        name: "r1g-feed-media.png",
        mimeType: "image/png",
        buffer: makeSolidPngBuffer(width, height, 0xef, 0x44, 0x44),
      },
    },
  });
  expect(upload.status(), `upload média « ${options.marker} » : ${await upload.text()}`).toBe(201);
  const uploaded = (await upload.json()) as { url?: string };
  const mediaUrl = uploaded.url ?? "";
  expect(mediaUrl, `upload média « ${options.marker} » : url absente`).toMatch(
    /^\/api\/v1\/story-media\//,
  );

  const created = await page.request.post(`${API_URL}/api/v1/posts`, {
    headers: authorization,
    data: { author_type: "citizen", body: options.marker, media_url: mediaUrl },
  });
  expect(created.status(), `publication « ${options.marker} » : ${await created.text()}`).toBe(201);
  const post = (await created.json()) as { media_url?: string | null };
  expect(post.media_url, `publication « ${options.marker} » : média non persisté`).toBe(mediaUrl);

  return { marker: options.marker, mediaUrl, natural: { width, height } };
}
