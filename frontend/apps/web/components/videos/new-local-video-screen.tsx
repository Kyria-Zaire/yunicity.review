"use client";

import {
  humanizeLocalVideoError,
  LOCAL_VIDEO_UPLOAD_ERROR_GENERIC,
  LOCAL_VIDEO_UPLOAD_PAGE_SUBTITLE,
  LOCAL_VIDEO_UPLOAD_PAGE_TITLE,
  LOCAL_VIDEO_UPLOAD_PHASE_PROCESSING,
  LOCAL_VIDEO_UPLOAD_PHASE_PUBLISH,
  LOCAL_VIDEO_UPLOAD_PHASE_UPLOAD,
  LOCAL_VIDEO_UPLOAD_SUBMITTED_BODY,
  registerLocalVideoPending,
} from "@yunicity/utils";
import { CircleDot, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  NewLocalVideoForm,
  type LocalVideoUploadFormValues,
} from "@/components/videos/new-local-video-form";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { useLocalVideoUploadContext } from "@/hooks/use-local-video-upload-context";
import { WEB_CONTENT_WIDTH_CLASS } from "@/lib/layout/web-layout-config";

type UploadPhase = "form" | "uploading" | "publishing" | "redirecting";

export function NewLocalVideoScreen() {
  const router = useRouter();
  const { api, city, neighborhoods, loadingNeighborhoods } = useLocalVideoUploadContext();
  const [phase, setPhase] = useState<UploadPhase>("form");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: LocalVideoUploadFormValues) {
    setError(null);
    setPhase("uploading");

    try {
      const upload = await api.localVideos.createUpload({
        filename: values.file.name,
        content_type: values.contentType,
        file_size_bytes: values.file.size,
        city,
        neighborhood_id: values.neighborhoodId,
      });

      await api.localVideos.uploadSessionBytes(upload, values.file);

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
      setError(humanizeLocalVideoError(err, LOCAL_VIDEO_UPLOAD_ERROR_GENERIC));
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
              {LOCAL_VIDEO_UPLOAD_PAGE_SUBTITLE}
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
                {phase === "redirecting" ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    {LOCAL_VIDEO_UPLOAD_PHASE_PROCESSING}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-yunicity-primary" />
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
              onCancel={() => router.push("/videos")}
              onSubmit={handleSubmit}
            />
          </div>
        ) : null}
      </div>
    </VideosAppShell>
  );
}
