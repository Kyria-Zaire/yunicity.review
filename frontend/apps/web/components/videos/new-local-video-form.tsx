"use client";

import type { LocalVideoContentType, Neighborhood } from "@yunicity/types";
import {
  LOCAL_VIDEO_ALLOWED_CONTENT_TYPES,
  LOCAL_VIDEO_MAX_BYTES,
  LOCAL_VIDEO_MAX_DURATION_SECONDS,
} from "@yunicity/types";
import {
  LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH,
  LOCAL_VIDEO_TITLE_MAX_LENGTH,
  LOCAL_VIDEO_UPLOAD_CANCEL,
  LOCAL_VIDEO_UPLOAD_CHANGE_FILE,
  LOCAL_VIDEO_UPLOAD_CHOOSE_FILE,
  LOCAL_VIDEO_UPLOAD_DESCRIPTION_LABEL,
  LOCAL_VIDEO_UPLOAD_DESCRIPTION_PLACEHOLDER,
  LOCAL_VIDEO_UPLOAD_DURATION_LABEL,
  LOCAL_VIDEO_UPLOAD_DURATION_UNKNOWN,
  LOCAL_VIDEO_UPLOAD_FILE_INVALID_TYPE,
  LOCAL_VIDEO_UPLOAD_FILE_SIZE_LABEL,
  LOCAL_VIDEO_UPLOAD_FILE_TOO_LARGE,
  LOCAL_VIDEO_UPLOAD_FILE_TOO_LONG,
  LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_LABEL,
  LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_PLACEHOLDER,
  LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_REQUIRED,
  LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_EMPTY,
  LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_LOADING,
  LOCAL_VIDEO_UPLOAD_PUBLISH,
  LOCAL_VIDEO_UPLOAD_TITLE_LABEL,
  LOCAL_VIDEO_UPLOAD_TITLE_PLACEHOLDER,
  LOCAL_VIDEO_UPLOAD_TITLE_REQUIRED,
  LOCAL_VIDEO_UPLOAD_VIDEO_HINT,
  LOCAL_VIDEO_UPLOAD_VIDEO_LABEL,
  LOCAL_VIDEO_UPLOAD_VIDEO_REQUIRED,
} from "@yunicity/utils";
import { Film, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { yunicityInputFocus } from "@/lib/brand-classes";

const ACCEPTED_TYPES = LOCAL_VIDEO_ALLOWED_CONTENT_TYPES.join(",");

export type LocalVideoUploadFormValues = {
  file: File;
  title: string;
  description: string;
  neighborhoodId: string;
  contentType: LocalVideoContentType;
};

type NewLocalVideoFormProps = {
  neighborhoods: Neighborhood[];
  loadingNeighborhoods: boolean;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: LocalVideoUploadFormValues) => Promise<void>;
};

type FilePreview = {
  name: string;
  sizeLabel: string;
  durationLabel: string;
  previewUrl: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return LOCAL_VIDEO_UPLOAD_DURATION_UNKNOWN;
  }
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
}

function resolveContentType(file: File): LocalVideoContentType | null {
  const lower = file.name.toLowerCase();
  if (file.type === "video/mp4" || lower.endsWith(".mp4")) return "video/mp4";
  if (file.type === "video/quicktime" || lower.endsWith(".mov")) return "video/quicktime";
  return null;
}

async function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    video.src = URL.createObjectURL(file);
  });
}

export function NewLocalVideoForm({
  neighborhoods,
  loadingNeighborhoods,
  submitting,
  error,
  onCancel,
  onSubmit,
}: NewLocalVideoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    };
  }, [preview?.previewUrl]);

  async function handleSelectedFile(selected: File | null) {
    setFieldError(null);
    if (!selected) return;

    if (selected.size > LOCAL_VIDEO_MAX_BYTES) {
      setFieldError(LOCAL_VIDEO_UPLOAD_FILE_TOO_LARGE);
      return;
    }

    const contentType = resolveContentType(selected);
    if (!contentType) {
      setFieldError(LOCAL_VIDEO_UPLOAD_FILE_INVALID_TYPE);
      return;
    }

    const duration = await readVideoDuration(selected);
    if (duration != null && duration > LOCAL_VIDEO_MAX_DURATION_SECONDS) {
      setFieldError(LOCAL_VIDEO_UPLOAD_FILE_TOO_LONG);
      return;
    }

    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);

    setFile(selected);
    setPreview({
      name: selected.name,
      sizeLabel: formatFileSize(selected.size),
      durationLabel:
        duration != null ? formatDuration(duration) : LOCAL_VIDEO_UPLOAD_DURATION_UNKNOWN,
      previewUrl: URL.createObjectURL(selected),
    });
  }

  function clearFile() {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    setFile(null);
    setPreview(null);
    setFieldError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);

    if (!file) {
      setFieldError(LOCAL_VIDEO_UPLOAD_VIDEO_REQUIRED);
      return;
    }
    if (!title.trim()) {
      setFieldError(LOCAL_VIDEO_UPLOAD_TITLE_REQUIRED);
      return;
    }
    if (!neighborhoodId) {
      setFieldError(LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_REQUIRED);
      return;
    }

    const contentType = resolveContentType(file);
    if (!contentType) {
      setFieldError(LOCAL_VIDEO_UPLOAD_FILE_INVALID_TYPE);
      return;
    }

    await onSubmit({
      file,
      title: title.trim(),
      description: description.trim(),
      neighborhoodId,
      contentType,
    });
  }

  const displayError = error || fieldError;
  const inputClass = `w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 ${yunicityInputFocus}`;

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-neutral-900">{LOCAL_VIDEO_UPLOAD_VIDEO_LABEL}</h2>
        <p className="mt-1 text-sm text-neutral-600">{LOCAL_VIDEO_UPLOAD_VIDEO_HINT}</p>

        {preview ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{preview.name}</p>
                <dl className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium">{LOCAL_VIDEO_UPLOAD_FILE_SIZE_LABEL} : </dt>
                    <dd className="inline">{preview.sizeLabel}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">{LOCAL_VIDEO_UPLOAD_DURATION_LABEL} : </dt>
                    <dd className="inline">{preview.durationLabel}</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={clearFile}
                disabled={submitting}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                aria-label="Retirer la vidéo"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {preview.previewUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={preview.previewUrl}
                  controls
                  className="max-h-64 w-full object-contain"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {LOCAL_VIDEO_UPLOAD_CHANGE_FILE}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary">
              <Film className="h-7 w-7" aria-hidden />
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-yunicity-primary bg-white px-5 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {LOCAL_VIDEO_UPLOAD_CHOOSE_FILE}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          disabled={submitting}
          onChange={(event) => {
            const selected = event.target.files?.item(0) ?? null;
            void handleSelectedFile(selected);
            event.target.value = "";
          }}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold text-neutral-900">
            {LOCAL_VIDEO_UPLOAD_TITLE_LABEL}
          </span>
          <input
            type="text"
            value={title}
            maxLength={LOCAL_VIDEO_TITLE_MAX_LENGTH}
            disabled={submitting}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={LOCAL_VIDEO_UPLOAD_TITLE_PLACEHOLDER}
            className={`mt-2 ${inputClass}`}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-900">
            {LOCAL_VIDEO_UPLOAD_DESCRIPTION_LABEL}
          </span>
          <textarea
            value={description}
            maxLength={LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH}
            disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={LOCAL_VIDEO_UPLOAD_DESCRIPTION_PLACEHOLDER}
            rows={4}
            className={`mt-2 resize-y ${inputClass}`}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-900">
            {LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_LABEL}
          </span>
          <select
            value={neighborhoodId}
            disabled={submitting || loadingNeighborhoods}
            onChange={(event) => setNeighborhoodId(event.target.value)}
            className={`mt-2 ${inputClass}`}
          >
            <option value="">
              {loadingNeighborhoods
                ? LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_LOADING
                : LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_PLACEHOLDER}
            </option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.display_name}
              </option>
            ))}
          </select>
          {!loadingNeighborhoods && neighborhoods.length === 0 ? (
            <p className="mt-2 text-xs text-neutral-500">{LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_EMPTY}</p>
          ) : null}
        </label>
      </section>

      {displayError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {LOCAL_VIDEO_UPLOAD_CANCEL}
        </button>
        <button
          type="submit"
          disabled={submitting || !file || loadingNeighborhoods}
          className="inline-flex items-center justify-center rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        >
          {LOCAL_VIDEO_UPLOAD_PUBLISH}
        </button>
      </div>
    </form>
  );
}
