"use client";

import {
  humanizeLocalVideoError,
  LOCAL_VIDEO_UPLOAD_ERROR_GENERIC,
  localVideoUploadPageSubtitle,
  LOCAL_VIDEO_UPLOAD_PAGE_TITLE,
  LOCAL_VIDEO_UPLOAD_PHASE_PROCESSING,
  LOCAL_VIDEO_UPLOAD_PHASE_PUBLISH,
  LOCAL_VIDEO_UPLOAD_CANCEL_UPLOAD,
  LOCAL_VIDEO_UPLOAD_PROGRESS_LABEL,
  LOCAL_VIDEO_UPLOAD_PHASE_UPLOAD,
  LOCAL_VIDEO_UPLOAD_SUBMITTED_BODY,
  formatUploadProgress,
  registerLocalVideoPending,
  UploadCancelledError,
} from "@yunicity/utils";
import type { UploadProgress } from "@yunicity/utils";
import { CircleDot, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  NewLocalVideoForm,
  type LocalVideoUploadFormValues,
} from "@/components/videos/new-local-video-form";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { useLocalVideoDurationPolicy } from "@/hooks/use-local-video-duration-policy";
import { useLocalVideoUploadContext } from "@/hooks/use-local-video-upload-context";
import { WEB_CONTENT_WIDTH_CLASS } from "@/lib/layout/web-layout-config";

type UploadPhase = "form" | "uploading" | "publishing" | "redirecting";

export function NewLocalVideoScreen() {
  const router = useRouter();
  const { api, city, neighborhoods, loadingNeighborhoods } = useLocalVideoUploadContext();
  // VIDEO-04D — limite du créateur connecté ; retombée pilote si indisponible.
  const durationPolicy = useLocalVideoDurationPolicy();
  const [phase, setPhase] = useState<UploadPhase>("form");
  const [error, setError] = useState<string | null>(null);
  /** Progression REELLE de l'envoi : octets confirmes, jamais un minuteur. */
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abandonRef = useRef<AbortController | null>(null);

  function handleCancelUpload() {
    // Interrompt la REQUETE, pas seulement l'affichage : sans cela 200 Mo
    // continueraient de partir sur le forfait de l'utilisateur.
    abandonRef.current?.abort();
  }

  async function handleSubmit(values: LocalVideoUploadFormValues) {
    // Garde anti-double envoi : un second clic creerait une seconde session
    // d'upload et laisserait la premiere orpheline.
    if (phase !== "form") return;

    setError(null);
    setProgress(null);
    setPhase("uploading");
    const abandon = new AbortController();
    abandonRef.current = abandon;

    try {
      const upload = await api.localVideos.createUpload({
        filename: values.file.name,
        content_type: values.contentType,
        file_size_bytes: values.file.size,
        city,
        neighborhood_id: values.neighborhoodId,
      });

      await api.localVideos.uploadSessionBytes(upload, values.file, {
        signal: abandon.signal,
        onProgress: setProgress,
      });

      setPhase("publishing");
      const accepted = await api.localVideos.publishVideo({
        upload_id: upload.upload_id,
        city,
        neighborhood_id: values.neighborhoodId,
        video_type: "moment",
        title: values.title,
        description: values.description || null,
      });

      registerLocalVideoPending({
        videoId: accepted.id,
        title: values.title,
        registeredAt: new Date().toISOString(),
      });

      setPhase("redirecting");
      router.replace(`/videos?video=${encodeURIComponent(accepted.id)}`);
    } catch (err) {
      setPhase("form");
      setProgress(null);
      // Une annulation n'est pas une panne : l'annoncer comme une erreur
      // laisserait croire a un echec alors que l'utilisateur a decide.
      if (!(err instanceof UploadCancelledError)) {
        setError(humanizeLocalVideoError(err, LOCAL_VIDEO_UPLOAD_ERROR_GENERIC));
      }
    } finally {
      abandonRef.current = null;
    }
  }

  const phaseMessage =
    phase === "uploading"
      ? LOCAL_VIDEO_UPLOAD_PHASE_UPLOAD
      : phase === "publishing"
        ? LOCAL_VIDEO_UPLOAD_PHASE_PUBLISH
        : phase === "redirecting"
          ? LOCAL_VIDEO_UPLOAD_SUBMITTED_BODY
          : null;

  const isBusy = phase !== "form";

  return (
    <VideosAppShell>
      <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 ${WEB_CONTENT_WIDTH_CLASS.form}`}>
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-yunicity-primary/40 bg-[#EEF0FF] text-yunicity-primary">
            <CircleDot className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {LOCAL_VIDEO_UPLOAD_PAGE_TITLE}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {localVideoUploadPageSubtitle(durationPolicy.maxDurationSeconds)}
            </p>
          </div>
        </header>

        {isBusy && phaseMessage ? (
          <div
            className="mt-6 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-yunicity-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-neutral-800">{phaseMessage}</p>
                {phase === "uploading" && progress ? (
                  <p className="mt-1 text-xs text-neutral-500">{formatUploadProgress(progress)}</p>
                ) : null}
                {phase === "redirecting" ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    {LOCAL_VIDEO_UPLOAD_PHASE_PROCESSING}
                  </p>
                ) : null}
              </div>
              {phase === "uploading" ? (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="ml-auto shrink-0 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {LOCAL_VIDEO_UPLOAD_CANCEL_UPLOAD}
                </button>
              ) : null}
            </div>
            {/* Barre REELLE : la largeur suit les octets transmis. Quand le
                navigateur ignore le total, on n'invente aucun pourcentage —
                la barre reste indeterminee et le texte dit les Mo envoyes. */}
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"
              role="progressbar"
              aria-label={LOCAL_VIDEO_UPLOAD_PROGRESS_LABEL}
              aria-valuemin={0}
              aria-valuemax={100}
              {...(progress?.ratio != null
                ? { "aria-valuenow": Math.round(progress.ratio * 100) }
                : {})}
            >
              <div
                className={
                  progress?.ratio != null
                    ? "h-full rounded-full bg-yunicity-primary transition-[width] duration-200"
                    : "h-full w-1/3 animate-pulse rounded-full bg-yunicity-primary"
                }
                {...(progress?.ratio != null
                  ? { style: { width: `${Math.round(progress.ratio * 100)}%` } }
                  : {})}
              />
            </div>
          </div>
        ) : null}

        {phase === "form" ? (
          <div className="mt-6">
            <NewLocalVideoForm
              neighborhoods={neighborhoods}
              loadingNeighborhoods={loadingNeighborhoods}
              submitting={isBusy}
              error={error}
              maxDurationSeconds={durationPolicy.maxDurationSeconds}
              onCancel={() => router.push("/videos")}
              onSubmit={handleSubmit}
            />
          </div>
        ) : null}
      </div>
    </VideosAppShell>
  );
}
