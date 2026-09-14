"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { isComposerAbortError } from "@yunicity/utils";

export type AuthorizedMediaStatus = "idle" | "loading" | "ready" | "error";

export type AuthorizedMediaSource = {
  status: AuthorizedMediaStatus;
  /** Object URL locale décodable — uniquement en status `ready`. */
  objectUrl: string | null;
  retry: () => void;
};

/**
 * Charge une `media_url` de publication via GET Bearer → Blob → object URL.
 *
 * Ne place jamais l'URL relative (ni le token) dans un `src`. Latest-wins par
 * génération ; révocation à remplacement / démontage.
 */
export function useAuthorizedMediaSource(
  mediaUrl: string | null | undefined,
): AuthorizedMediaSource {
  const api = useYunicityApi();
  const [status, setStatus] = useState<AuthorizedMediaStatus>("idle");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generationRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);

  const revokeCurrent = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const trimmed = mediaUrl?.trim() ?? "";
    if (!trimmed) {
      generationRef.current += 1;
      revokeCurrent();
      setObjectUrl(null);
      setStatus("idle");
      return;
    }

    const generation = ++generationRef.current;
    const controller = new AbortController();
    setStatus("loading");

    void (async () => {
      try {
        const { blob } = await api.fetchAuthorizedMediaBlob(trimmed, controller.signal);
        if (generation !== generationRef.current) return;
        const next = URL.createObjectURL(blob);
        revokeCurrent();
        objectUrlRef.current = next;
        setObjectUrl(next);
        setStatus("ready");
      } catch (error) {
        if (generation !== generationRef.current) return;
        if (controller.signal.aborted || isComposerAbortError(error)) return;
        revokeCurrent();
        setObjectUrl(null);
        setStatus("error");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [api, mediaUrl, attempt, revokeCurrent]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      revokeCurrent();
    };
  }, [revokeCurrent]);

  return { status, objectUrl, retry };
}
