/**
 * Envoi binaire avec progression réelle et annulation — PR202-VIDEO-STREAMING.
 *
 * `fetch` ne rapporte pas la progression MONTANTE : sa promesse ne se résout
 * qu'une fois la réponse reçue, et `ReadableStream` en corps de requête n'est
 * pas déployable côté navigateur aujourd'hui. Une vidéo de 200 Mo laisserait
 * donc l'utilisateur devant un écran figé pendant des minutes, sans savoir si
 * quelque chose se passe.
 *
 * `XMLHttpRequest` reste la seule API navigateur qui expose `upload.onprogress`.
 * On l'utilise UNIQUEMENT pour ce transfert d'octets : le reste du client API
 * ne bouge pas. Aucune dépendance ajoutée.
 *
 * La progression vient des octets réellement transmis — jamais d'un minuteur
 * qui avancerait une barre pendant que rien ne part.
 */

export type UploadProgress = {
  /** Octets confirmés transmis. */
  loaded: number;
  /** Total annoncé, ou `null` si le navigateur ne le connaît pas. */
  total: number | null;
  /** Fraction entre 0 et 1, ou `null` quand le total est inconnu. */
  ratio: number | null;
};

export class UploadCancelledError extends Error {
  constructor() {
    super("Envoi annulé.");
    this.name = "UploadCancelledError";
  }
}

export type BinaryUploadResult = {
  status: number;
  ok: boolean;
  body: string;
};

export type BinaryUploadOptions = {
  url: string;
  method: string;
  body: Blob;
  headers?: Record<string, string>;
  /** Jeton d'accès, pour l'endpoint authentifié. Absent sur une URL présignée. */
  bearerToken?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: UploadProgress) => void;
};

/** 5 minutes : une vidéo de 200 Mo sur une connexion mobile lente prend du temps. */
export const DEFAULT_UPLOAD_TIMEOUT_MS = 5 * 60_000;

/**
 * Envoie un corps binaire en rapportant la progression, annulable.
 *
 * Ne lève pas sur un statut d'erreur HTTP : le statut et le corps sont rendus
 * à l'appelant, qui sait seul comment interpréter l'erreur de son endpoint.
 * Seules l'annulation, le réseau et le délai dépassé lèvent.
 */
export function uploadBinaryWithProgress(
  options: BinaryUploadOptions,
): Promise<BinaryUploadResult> {
  const { url, method, body, headers, bearerToken, signal, onProgress } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_UPLOAD_TIMEOUT_MS;

  return new Promise<BinaryUploadResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadCancelledError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = timeoutMs;

    for (const [cle, valeur] of Object.entries(headers ?? {})) {
      xhr.setRequestHeader(cle, valeur);
    }
    if (bearerToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
    }

    const detacher = (): void => {
      signal?.removeEventListener("abort", annuler);
    };

    function annuler(): void {
      xhr.abort();
    }

    signal?.addEventListener("abort", annuler, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      // `lengthComputable` est faux quand le total est inconnu : on rapporte
      // alors l'indéterminé plutôt que d'inventer un pourcentage.
      const total = event.lengthComputable ? event.total : null;
      onProgress({
        loaded: event.loaded,
        total,
        ratio: total && total > 0 ? Math.min(1, event.loaded / total) : null,
      });
    };

    xhr.onload = () => {
      detacher();
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        body: xhr.responseText,
      });
    };

    xhr.onabort = () => {
      detacher();
      reject(new UploadCancelledError());
    };

    xhr.onerror = () => {
      detacher();
      reject(new Error("Échec réseau pendant l'envoi de la vidéo."));
    };

    xhr.ontimeout = () => {
      detacher();
      reject(new Error("Délai dépassé pendant l'envoi de la vidéo."));
    };

    xhr.send(body);
  });
}

/** Formate une progression pour l'affichage, en respectant l'indéterminé. */
export function formatUploadProgress(progress: UploadProgress | null): string {
  if (!progress) return "";
  if (progress.ratio === null) {
    // Total inconnu : on dit ce qu'on sait, sans pourcentage invente.
    return `${Math.round(progress.loaded / (1024 * 1024))} Mo envoyés`;
  }
  return `${Math.round(progress.ratio * 100)} %`;
}
