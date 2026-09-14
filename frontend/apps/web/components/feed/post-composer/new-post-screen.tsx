"use client";

import { ComposerMediaResolution } from "@/components/feed/composer-media-resolution";
import { NewPostDesktopView } from "@/components/feed/post-composer/desktop/new-post-desktop-view";
import { NewPostMobileView } from "@/components/feed/post-composer/mobile/new-post-mobile-view";
import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PostMediaItem } from "@yunicity/types";
import {
  COMPOSER_MEDIA_TIMEOUT,
  composerMediaErrorMessage,
  composerMediaUploadTimeoutMs,
  isComposerAbortError,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function NewPostScreen() {
  const router = useRouter();
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState("Reims");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState<"compose" | "media" | "options">("compose");
  const draft = useNewPostDraft(city);
  const publishingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutsRef = useRef<Set<number>>(new Set());
  const mountedRef = useRef(true);

  // Quitter l'écran doit couper l'envoi en cours et désarmer ses échéances :
  // sans cela, une requête et un minuteur survivent au démontage.
  useEffect(() => {
    mountedRef.current = true;
    // La ref n'est jamais réaffectée : la copier ici donne au nettoyage une
    // référence stable sur le MÊME ensemble, ce que la règle react-hooks exige.
    const echeances = timeoutsRef.current;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      for (const echeance of echeances) window.clearTimeout(echeance);
      echeances.clear();
      publishingRef.current = false;
    };
  }, []);

  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";

  useEffect(() => {
    void api
      .getProfileMe()
      .then((profile) => {
        setDisplayName(profile.display_name ?? profile.username ?? null);
        if (profile.city) setCity(profile.city);
      })
      .catch(() => {
        /* ProtectedRoute gère la session */
      });
  }, [api]);

  const publish = useCallback(async () => {
    // Verrou SYNCHRONE : `submitting` est un état, donc pas encore appliqué
    // quand deux clics arrivent dans le même tick. Sans cette ref, un
    // double-clic créait deux publications et réenvoyait tous les médias.
    if (publishingRef.current) return;
    if (!draft.canPublish) return;
    if (draft.publishBlockReason) {
      setError(draft.publishBlockReason);
      return;
    }

    publishingRef.current = true;
    setSubmitting(true);
    setError(null);

    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const uploaded: PostMediaItem[] = [];
      for (const item of draft.selectedMedia) {
        // Budget de temps par fichier, proportionnel à sa taille : un délai fixe
        // condamne un média conforme sur un lien mobile lent.
        const echeance = window.setTimeout(
          () => controller.abort(),
          composerMediaUploadTimeoutMs(item.file.size),
        );
        timeoutsRef.current.add(echeance);
        try {
          const response = await api.uploadPostMedia(item.file, controller.signal);
          uploaded.push({ url: response.url, media_type: response.media_type });
        } catch (uploadErr) {
          if (!mountedRef.current) return;
          // Une annulation n'est pas un échec à annoncer : elle vient d'un
          // départ de l'écran ou de l'échéance, déjà signalée autrement.
          if (!isComposerAbortError(uploadErr) && !controller.signal.aborted) {
            setError(composerMediaErrorMessage(uploadErr));
          } else if (controller.signal.aborted) {
            setError(COMPOSER_MEDIA_TIMEOUT);
          }
          return;
        } finally {
          window.clearTimeout(echeance);
          timeoutsRef.current.delete(echeance);
        }
      }

      await api.createFeedPost(draft.buildCreatePayload(uploaded));
      if (!mountedRef.current) return;
      router.push("/feed");
      router.refresh();
    } catch (publishErr) {
      if (!mountedRef.current) return;
      setError(composerMediaErrorMessage(publishErr));
    } finally {
      publishingRef.current = false;
      if (controllerRef.current === controller) controllerRef.current = null;
      if (mountedRef.current) setSubmitting(false);
    }
  }, [api, draft, router]);

  return (
    <div className="feed-new-mobile-shell web-shell-page min-h-dvh bg-[#F4F5F7]">
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <main className="web-main-column min-w-0">
          <div className="web-desktop-feed-new-only hidden sm:block">
            <CitizenTopNav />
          </div>
          {draft.mediaRejected ? (
            <div className="mx-3 mt-3 rounded-xl bg-red-50 px-4 py-3 sm:mx-0">
              <p className="text-sm text-red-700" role="alert">
                {draft.uploadError}
              </p>
              <ComposerMediaResolution
                onChooseAnother={() => draft.fileInputRef.current?.click()}
                onContinueWithout={draft.continueWithoutMedia}
              />
            </div>
          ) : null}
          <NewPostMobileView
            draft={draft}
            authorLabel={authorLabel}
            submitting={submitting}
            error={error}
            step={mobileStep}
            onStepChange={setMobileStep}
            onPublish={() => void publish()}
          />
          <NewPostDesktopView
            draft={draft}
            authorLabel={authorLabel}
            submitting={submitting}
            error={error}
            onPublish={() => void publish()}
          />
        </main>
      </div>

      <input
        ref={draft.fileInputRef}
        type="file"
        accept={draft.acceptedTypes}
        multiple
        className="sr-only"
        onChange={(event) => {
          void draft.handleSelectedFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
