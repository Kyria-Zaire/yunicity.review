"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  beginAuthorizedMediaFetch,
  getAuthorizedMediaEpoch,
  isComposerAbortError,
  onAuthorizedMediaSessionClear,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
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
): AuthorizedMediaSource {
  const api = useYunicityApi();
  const fetchBlob = api.fetchAuthorizedMediaBlob;
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
    setAttempt((n) => n + 1);
  }, []);

  const markDisplayed = useCallback(() => {
    if (objectUrlRef.current && epochRef.current === getAuthorizedMediaEpoch()) {
      setStatus("ready");
    }
  }, []);

  const markDecodeFailed = useCallback(() => {
    dropCurrent();
    setObjectUrl(null);
    setStatus("error");
  }, [dropCurrent]);

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
  }, [fetchBlob, mediaUrl, attempt, dropCurrent]);

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
