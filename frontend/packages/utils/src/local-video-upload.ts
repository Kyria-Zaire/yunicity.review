/** Upload binaire Local Video — presigned R2 ou dev filesystem (VIDEO-04A). */

import type { LocalVideoUpload } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { LocalVideoError, parseLocalVideoApiError } from "./local-video-errors";

export type PresignedUploadInput = {
  upload: LocalVideoUpload;
  body: Blob | ArrayBuffer | Uint8Array;
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
  const { upload, body } = input;
  const headers = new Headers(upload.upload_headers);
  const payload = toUploadBlob(body);

  const response = await fetch(upload.presigned_url, {
    method: upload.upload_method,
    headers,
    body: payload,
  });

  if (!response.ok) {
    throw new LocalVideoError(
      "LOCAL_VIDEO_UPLOAD_MISSING",
      "Échec de l'envoi du fichier vidéo vers le stockage.",
      response.status,
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
): Promise<void> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/v1/local-videos/uploads/${encodeURIComponent(uploadId)}/binary`;
  const payload = toUploadBlob(body);

  const response = await client.fetch(url, {
    method: "PUT",
    body: payload,
  });

  if (!response.ok) {
    throw await parseLocalVideoApiError(response);
  }
}
