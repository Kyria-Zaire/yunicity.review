"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  isComposerAbortError,
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

/**
 * Charge une `media_url` de publication via GET Bearer → Blob → object URL.
 * Le statut `ready` n'est atteint qu'après décodage navigateur réussi.
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

  const dropCurrent = useCallback(() => {
    const previous = objectUrlRef.current;
    objectUrlRef.current = null;
    if (previous) releaseAuthorizedObjectUrl(previous);
  }, []);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  const markDisplayed = useCallback(() => {
    if (objectUrlRef.current) setStatus("ready");
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
    const controller = new AbortController();
    setStatus("loading");

    void (async () => {
      try {
        const { blob } = await fetchBlob(trimmed, controller.signal);
        if (generation !== generationRef.current) return;
        const next = URL.createObjectURL(blob);
        retainAuthorizedObjectUrl(next);
        dropCurrent();
        objectUrlRef.current = next;
        setObjectUrl(next);
        setStatus("decoding");
      } catch (error) {
        if (generation !== generationRef.current) return;
        if (controller.signal.aborted || isComposerAbortError(error)) return;
        dropCurrent();
        setObjectUrl(null);
        setStatus("error");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [fetchBlob, mediaUrl, attempt, dropCurrent]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      dropCurrent();
    };
  }, [dropCurrent]);

  return { status, objectUrl, retry, markDisplayed, markDecodeFailed };
}
