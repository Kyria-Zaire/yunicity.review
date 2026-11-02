"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  type AuthorizedMediaVariant,
  beginAuthorizedMediaFetch,
  getAuthorizedMediaEpoch,
  isComposerAbortError,
  dropCachedAuthorizedMedia,
  onAuthorizedMediaSessionClear,
  putCachedAuthorizedMedia,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
  takeCachedAuthorizedMedia,
} from "@yunicity/utils";

/**
 * idle → loading (fetch) → decoding (Blob prêt, img pas encore onLoad) → ready
 *                                                                      ↘ error
 */
export type AuthorizedMediaStatus = "idle" | "loading" | "decoding" | "ready" | "error";

export type AuthorizedMediaSource = {
  status: AuthorizedMediaStatus;
  objectUrl: string | null;
  retry: () => void;
  /** Appelé par `<img onLoad>` — seule transition vers `ready`. */
  markDisplayed: () => void;
  /** Appelé par `<img onError>` — Blob déclaré image mais non décodable. */
  markDecodeFailed: () => void;
};

function combineAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([a, b]);
  }
  const merged = new AbortController();
  const abortMerged = () => {
    if (!merged.signal.aborted) merged.abort();
  };
  if (a.aborted || b.aborted) {
    abortMerged();
    return merged.signal;
  }
  a.addEventListener("abort", abortMerged, { once: true });
  b.addEventListener("abort", abortMerged, { once: true });
  return merged.signal;
}

/**
 * Charge une `media_url` de publication via GET Bearer → Blob → object URL.
 * Le statut `ready` n'est atteint qu'après décodage navigateur réussi.
 * Les réponses d'une epoch invalidée (logout / switch) sont ignorées.
 */
export function useAuthorizedMediaSource(
  mediaUrl: string | null | undefined,
  options?: { variant?: AuthorizedMediaVariant },
): AuthorizedMediaSource {
  const variant = options?.variant;
  const api = useYunicityApi();
  // Ne jamais détacher `api.fetchAuthorizedMediaBlob` : la méthode d'instance
  // lit `this.auth` / `this.apiBaseUrl`. Un appel sans bind lève avant le réseau
  // (MEDIA-01C — CLIENT_PRE_NETWORK_FAILURE sur Preview Safari).
  const fetchBlob = useCallback(
    (url: string, signal?: AbortSignal) =>
      // Sans variante, l'appel garde EXACTEMENT sa forme d'avant : deux
      // arguments. Ajouter un troisieme `undefined` changerait la signature
      // observee par tous les appelants anterieurs.
      variant
        ? api.fetchAuthorizedMediaBlob(url, signal, variant)
        : api.fetchAuthorizedMediaBlob(url, signal),
    [api, variant],
  );
  const [status, setStatus] = useState<AuthorizedMediaStatus>("idle");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generationRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);
  const epochRef = useRef(getAuthorizedMediaEpoch());

  const dropCurrent = useCallback(() => {
    const previous = objectUrlRef.current;
    objectUrlRef.current = null;
    if (previous) releaseAuthorizedObjectUrl(previous);
  }, []);

  const retry = useCallback(() => {
    // Reessayer, c'est repartir du RESEAU : on jette l'entree conservee, sinon
    // le cache resservirait l'echec.
    const current = mediaUrl?.trim();
    if (current) dropCachedAuthorizedMedia(current, variant ?? "");
    setAttempt((n) => n + 1);
  }, [mediaUrl, variant]);

  const markDisplayed = useCallback(() => {
    if (objectUrlRef.current && epochRef.current === getAuthorizedMediaEpoch()) {
      setStatus("ready");
    }
  }, []);

  const markDecodeFailed = useCallback(() => {
    // Le Blob est declare image mais ne se decode pas : le retirer du cache,
    // sinon un reessai reprendrait le meme et n'aboutirait jamais.
    const current = mediaUrl?.trim();
    if (current) dropCachedAuthorizedMedia(current, variant ?? "");
    dropCurrent();
    setObjectUrl(null);
    setStatus("error");
  }, [dropCurrent, mediaUrl, variant]);

  useEffect(() => {
    const trimmed = mediaUrl?.trim() ?? "";
    if (!trimmed) {
      generationRef.current += 1;
      dropCurrent();
      setObjectUrl(null);
      setStatus("idle");
      return;
    }

    const generation = ++generationRef.current;

    /**
     * Blob déjà obtenu dans CETTE session autorisée ? On repart de lui.
     *
     * ⛔ Ce n'est pas un cache HTTP : la route reste `no-store`, et rien n'est
     * relu du réseau. C'est le Blob que l'application tient encore en mémoire.
     * `take` échoue si l'epoch a changé — donc jamais de réutilisation d'un
     * média appartenant à un autre compte, même sur une URL identique.
     */
    const cached = takeCachedAuthorizedMedia(trimmed, variant ?? "");
    if (cached) {
      epochRef.current = getAuthorizedMediaEpoch();
      dropCurrent();
      objectUrlRef.current = cached;
      setObjectUrl(cached);
      // `decoding` et non `ready` : un nouvel `<img>` doit encore décoder. Mais
      // il n'y a plus ni aller-retour réseau ni transfert à payer.
      setStatus("decoding");
      return () => {
        generationRef.current += 1;
      };
    }

    const fetchHandle = beginAuthorizedMediaFetch();
    epochRef.current = fetchHandle.epoch;
    const localController = new AbortController();
    const signal = combineAbortSignals(localController.signal, fetchHandle.signal);
    setStatus("loading");

    void (async () => {
      try {
        const { blob } = await fetchBlob(trimmed, signal);
        if (generation !== generationRef.current) return;
        if (fetchHandle.epoch !== getAuthorizedMediaEpoch()) return;
        if (signal.aborted) return;

        const next = URL.createObjectURL(blob);
        if (!retainAuthorizedObjectUrl(next, fetchHandle.epoch)) {
          URL.revokeObjectURL(next);
          return;
        }
        if (
          generation !== generationRef.current ||
          fetchHandle.epoch !== getAuthorizedMediaEpoch()
        ) {
          releaseAuthorizedObjectUrl(next);
          return;
        }
        dropCurrent();
        objectUrlRef.current = next;
        // Le cache prend SA PROPRE part : la nôtre reste à nous, et c'est
        // `dropCurrent` qui la relâchera au démontage.
        putCachedAuthorizedMedia(trimmed, variant ?? "", next, blob.size);
        setObjectUrl(next);
        setStatus("decoding");
      } catch (error) {
        if (generation !== generationRef.current) return;
        if (fetchHandle.epoch !== getAuthorizedMediaEpoch()) return;
        if (signal.aborted || isComposerAbortError(error)) return;
        dropCurrent();
        setObjectUrl(null);
        setStatus("error");
      } finally {
        fetchHandle.finish();
      }
    })();

    return () => {
      localController.abort();
      fetchHandle.finish();
    };
  }, [fetchBlob, mediaUrl, variant, attempt, dropCurrent]);

  useEffect(() => {
    return onAuthorizedMediaSessionClear(() => {
      generationRef.current += 1;
      dropCurrent();
      setObjectUrl(null);
      setStatus("idle");
    });
  }, [dropCurrent]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      dropCurrent();
    };
  }, [dropCurrent]);

  return { status, objectUrl, retry, markDisplayed, markDecodeFailed };
}
