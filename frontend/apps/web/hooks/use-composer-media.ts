"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  AuthError,
  COMPOSER_MEDIA_FORBIDDEN,
  COMPOSER_MEDIA_NETWORK_FAILED,
  COMPOSER_MEDIA_RATE_LIMITED,
  COMPOSER_MEDIA_SERVER_FAILED,
  COMPOSER_MEDIA_TIMEOUT,
  COMPOSER_MEDIA_UNAUTHORIZED,
  COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD,
  composerMediaErrorMessage,
  composerMediaUploadTimeoutMs,
  isComposerAbortError,
  validateComposerMediaFile,
} from "@yunicity/utils";

export type ComposerMediaPhase =
  | "idle"
  | "validating"
  | "uploading"
  | "ready"
  | "publishing"
  | "success"
  | "error"
  | "cancelled";

export type ComposerMediaErrorContext = {
  stage: "validation" | "upload" | "publication";
  code?: string;
  status?: number;
};

const PUBLICATION_GENERIC = "Publication impossible pour le moment.";

/**
 * Message d'un échec de publication — l'étape qui suit un envoi réussi.
 *
 * Le média déjà envoyé est conservé : le message doit le dire, sinon
 * l'utilisateur croit devoir tout recommencer. Comme pour l'envoi, seules des
 * constantes sont renvoyées : jamais le corps de la réponse.
 */
function publicationMessage(error: unknown, hasMedia: boolean): string {
  if (error instanceof AuthError) {
    if (error.code === "RATE_LIMITED" || error.status === 429) return COMPOSER_MEDIA_RATE_LIMITED;
    if (error.status === 401) return COMPOSER_MEDIA_UNAUTHORIZED;
    if (error.status === 403) return COMPOSER_MEDIA_FORBIDDEN;
    if (error.status >= 500) return COMPOSER_MEDIA_SERVER_FAILED;
  }
  if (error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message))) {
    return COMPOSER_MEDIA_NETWORK_FAILED;
  }
  return hasMedia ? COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD : PUBLICATION_GENERIC;
}

/**
 * Upload média d'un composer (feed + territorial). Sélection fichier → validation client
 * (type/taille) → upload R2 via `uploadPostMedia` → `mediaUrl` prêt pour `onSubmit`.
 * Latest-wins par génération locale + AbortController ; prévisualisation via object URL.
 */
export function useComposerMedia() {
  const api = useYunicityApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ComposerMediaPhase>("idle");
  const [errorContext, setErrorContext] = useState<ComposerMediaErrorContext | null>(null);
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const publishingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const revokePreviewObjectUrl = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const setLocalPreview = useCallback(
    (file: File | null) => {
      revokePreviewObjectUrl();
      if (!file) {
        setPreviewUrl(null);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    },
    [revokePreviewObjectUrl],
  );

  const invalidateActiveUpload = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    // Le minuteur doit mourir ici, pas seulement dans le `finally` de la requête :
    // si la couche réseau ignore l'abandon (ou répond très tard), son `finally`
    // n'arrive pas et un minuteur de la génération précédente survivrait à une
    // nouvelle sélection, à un retrait, voire au démontage du composant.
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      invalidateActiveUpload();
      revokePreviewObjectUrl();
    };
  }, [invalidateActiveUpload, revokePreviewObjectUrl]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;

      invalidateActiveUpload();
      const generation = generationRef.current;
      const controller = new AbortController();
      controllerRef.current = controller;

      setMediaUrl(null);
      setLocalPreview(file);
      setMediaError(null);
      setErrorContext(null);
      setPhase("validating");

      const check = validateComposerMediaFile({
        type: file.type,
        size: file.size,
        name: file.name,
      });
      if (!check.ok) {
        if (!mountedRef.current || generation !== generationRef.current) return;
        setLocalPreview(null);
        setMediaError(check.error);
        setErrorContext({ stage: "validation" });
        setPhase("error");
        setUploading(false);
        resetFileInput();
        return;
      }

      setUploading(true);
      setPhase("uploading");
      let timedOut = false;
      // Garde-fou de dernier recours, proportionnel à la taille : un délai fixe
      // condamnait des fichiers pourtant conformes sur un lien mobile lent.
      // L'utilisateur, lui, peut annuler à tout moment en retirant l'image.
      timeoutRef.current = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, composerMediaUploadTimeoutMs(file.size));
      const timeout = timeoutRef.current;
      const applyTimeout = () => {
        setLocalPreview(null);
        setMediaUrl(null);
        setMediaError(COMPOSER_MEDIA_TIMEOUT);
        setErrorContext({ stage: "upload", code: "UPLOAD_TIMEOUT" });
        setPhase("error");
        resetFileInput();
      };
      try {
        const response = await api.uploadPostMedia(file, controller.signal);
        if (!mountedRef.current || generation !== generationRef.current) return;
        // L'échéance a pu tomber sans que la couche réseau honore l'abandon :
        // la requête répond alors un succès APRÈS que la tentative a été
        // déclarée expirée. L'accepter rendrait l'état dépendant du respect de
        // l'abandon par le navigateur, et ferait réapparaître une image que
        // l'utilisateur a vue échouer.
        if (timedOut) {
          applyTimeout();
          return;
        }
        setMediaUrl(response.url);
        // MEDIA-01B : conserver l'object URL locale pour l'aperçu. L'URL relative
        // distante ne doit jamais remplacer le src du <img> du composer — le
        // navigateur la résoudrait contre l'origine WEB. Le payload, lui, garde
        // uniquement response.url (remoteMediaUrl).
        setPhase("ready");
      } catch (error) {
        if (!mountedRef.current || generation !== generationRef.current) return;
        if (timedOut) {
          applyTimeout();
          return;
        }
        if (controller.signal.aborted || isComposerAbortError(error)) {
          setPhase("cancelled");
          return;
        }
        setLocalPreview(null);
        setMediaUrl(null);
        setMediaError(composerMediaErrorMessage(error));
        setErrorContext({
          stage: "upload",
          ...(error instanceof AuthError ? { code: error.code, status: error.status } : {}),
        });
        setPhase("error");
        resetFileInput();
      } finally {
        window.clearTimeout(timeout);
        if (timeoutRef.current === timeout) timeoutRef.current = null;
        if (mountedRef.current && generation === generationRef.current) {
          setUploading(false);
          controllerRef.current = null;
        }
      }
    },
    [api, invalidateActiveUpload, resetFileInput, setLocalPreview],
  );

  const clearMedia = useCallback(() => {
    invalidateActiveUpload();
    publishingRef.current = false;
    setMediaUrl(null);
    setLocalPreview(null);
    setUploading(false);
    setMediaError(null);
    setErrorContext(null);
    setPhase("idle");
    resetFileInput();
  }, [invalidateActiveUpload, resetFileInput, setLocalPreview]);

  /** True while a selected media must finish uploading before publish. */
  const mediaBusy = phase === "validating" || phase === "uploading" || phase === "publishing";

  /**
   * Un média que l'utilisateur a choisi et que nous avons refusé — format,
   * taille, ou envoi échoué. Tant qu'il n'a pas tranché, publier enverrait un
   * texte seul alors qu'il croit joindre une photo : l'image disparaîtrait
   * silencieusement.
   *
   * Un échec de PUBLICATION est exclu : le média y est prêt, et la reprise doit
   * rester immédiate.
   */
  const mediaRejected = phase === "error" && errorContext?.stage !== "publication";

  /** Publish is allowed only when there is no pending media, or the current one is ready. */
  const mediaReadyForPublish = !mediaBusy && !mediaRejected && (!mediaUrl || phase === "ready");

  /**
   * « Continuer sans image » — l'abandon EXPLICITE du média refusé.
   *
   * N'envoie rien, ne publie rien : lève seulement le blocage, pour que la
   * publication texte seul devienne un choix de l'utilisateur et non un effet
   * de bord silencieux.
   */
  const continueWithoutMedia = useCallback(() => {
    invalidateActiveUpload();
    setMediaUrl(null);
    setLocalPreview(null);
    setMediaError(null);
    setErrorContext(null);
    setUploading(false);
    setPhase("idle");
    resetFileInput();
  }, [invalidateActiveUpload, resetFileInput, setLocalPreview]);

  const beginPublishing = useCallback(() => {
    if (!mediaReadyForPublish || publishingRef.current) return false;
    if (mediaUrl && phase !== "ready") return false;
    publishingRef.current = true;
    setPhase("publishing");
    setMediaError(null);
    return true;
  }, [mediaReadyForPublish, mediaUrl, phase]);

  const finishPublishing = useCallback(
    (success: boolean, error?: unknown) => {
      publishingRef.current = false;
      if (success) {
        setPhase("success");
        setErrorContext(null);
        return;
      }
      // Keep uploaded mediaUrl so the user can retry publication without re-upload.
      setPhase((current) => {
        if (current !== "publishing") return current;
        return mediaUrl ? "ready" : "idle";
      });
      setErrorContext({
        stage: "publication",
        ...(error instanceof AuthError ? { code: error.code, status: error.status } : {}),
      });
      setMediaError(publicationMessage(error, Boolean(mediaUrl)));
    },
    [mediaUrl],
  );

  return {
    fileInputRef,
    /** URL distante relative (`/api/v1/story-media/...`) — seule valeur envoyée au POST. */
    mediaUrl,
    /** Object URL locale — seule source du <img> d'aperçu (jamais l'URL relative). */
    previewUrl,
    /**
     * Aperçu affiché : object URL locale tant qu'elle existe. Après clear/succès,
     * null. On ne retombe jamais sur `mediaUrl` relative (cassée hors même origine).
     */
    displayUrl: previewUrl,
    uploading,
    mediaError,
    phase,
    errorContext,
    mediaBusy,
    mediaReadyForPublish,
    /** Un média choisi a été refusé : la publication attend un arbitrage. */
    mediaRejected,
    continueWithoutMedia,
    openPicker,
    onFileChange,
    clearMedia,
    beginPublishing,
    finishPublishing,
  };
}
