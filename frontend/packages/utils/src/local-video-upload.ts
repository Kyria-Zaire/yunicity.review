/** Upload binaire Local Video — presigned R2 ou dev filesystem (VIDEO-04A). */

import type { LocalVideoUpload } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { LocalVideoError, parseLocalVideoApiError } from "./local-video-errors";
import type { UploadProgress } from "./local-video-upload-progress";
import { uploadBinaryWithProgress } from "./local-video-upload-progress";

export type PresignedUploadInput = {
  upload: LocalVideoUpload;
  body: Blob | ArrayBuffer | Uint8Array;
  /** Progression reelle, en octets transmis. */
  onProgress?: (progress: UploadProgress) => void;
  /** Annulation utilisateur : interrompt la requete, pas seulement l'interface. */
  signal?: AbortSignal;
};

function toUploadBlob(body: Blob | ArrayBuffer | Uint8Array): Blob {
  if (body instanceof Blob) {
    return body;
  }
  const bytes = body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body);
  return new Blob([bytes]);
}

/**
 * Envoie les octets vers l'URL présignée (R2) ou l'endpoint dev retourné par upload-init.
 * N'utilise pas AuthClient — requête directe vers l'URL de stockage.
 */
export async function uploadLocalVideoBytes(input: PresignedUploadInput): Promise<void> {
  const { upload, body, onProgress, signal } = input;

  // XHR et non `fetch` : seul XHR expose la progression MONTANTE. Le contrat
  // reseau est identique — memes methode, URL et en-tetes presignes.
  const result = await uploadBinaryWithProgress({
    url: upload.presigned_url,
    method: upload.upload_method,
    headers: upload.upload_headers,
    body: toUploadBlob(body),
    onProgress,
    signal,
  });

  if (!result.ok) {
    throw new LocalVideoError(
      "LOCAL_VIDEO_UPLOAD_MISSING",
      "Échec de l'envoi du fichier vidéo vers le stockage.",
      result.status,
    );
  }
}

/**
 * Fallback dev/CI — PUT `/local-videos/uploads/{id}/binary` (filesystem backend).
 */
export async function uploadLocalVideoBinaryDev(
  client: AuthClient,
  apiBaseUrl: string,
  uploadId: string,
  body: Blob | ArrayBuffer | Uint8Array,
  options: { onProgress?: (progress: UploadProgress) => void; signal?: AbortSignal } = {},
): Promise<void> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/v1/local-videos/uploads/${encodeURIComponent(uploadId)}/binary`;
  const payload = toUploadBlob(body);

  // `client.fetch` porterait l'authentification mais pas la progression. On
  // reprend donc le jeton du client plutot que de dupliquer sa logique, et on
  // rejoue UNE fois apres rafraichissement sur 401 — comme lui.
  const envoyer = async (token: string | null) =>
    uploadBinaryWithProgress({
      url,
      method: "PUT",
      body: payload,
      bearerToken: token,
      onProgress: options.onProgress,
      signal: options.signal,
    });

  let result = await envoyer(await client.getAccessToken());
  if (result.status === 401) {
    result = await envoyer(await client.refreshAccessToken());
  }

  if (!result.ok) {
    // On reconstruit une Response pour reutiliser l'analyse d'erreur
    // structuree existante, plutot que d'en ecrire une seconde.
    throw await parseLocalVideoApiError(
      new Response(result.body, {
        status: result.status,
        headers: { "content-type": "application/json" },
      }),
    );
  }
}
