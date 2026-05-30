"use client";

import type { StoryAudienceId } from "@yunicity/types";
import {
  STORIES_CAPTION_MAX,
  STORIES_MEDIA_MAX_MB,
  STORIES_NEW_AUDIENCE_COMMUNITY_BODY,
  STORIES_NEW_AUDIENCE_COMMUNITY_TITLE,
  STORIES_NEW_AUDIENCE_PUBLIC_BODY,
  STORIES_NEW_AUDIENCE_PUBLIC_TITLE,
  STORIES_NEW_CANCEL,
  STORIES_NEW_CAPTION_PLACEHOLDER,
  STORIES_NEW_ELEMENT_HASHTAG,
  STORIES_NEW_ELEMENT_LOCATION,
  STORIES_NEW_ELEMENT_MENTION,
  STORIES_NEW_ELEMENT_MUSIC,
  STORIES_NEW_ELEMENT_POLL,
  STORIES_NEW_ELEMENT_SOON,
  STORIES_NEW_LOCATION_PLACEHOLDER,
  STORIES_NEW_MEDIA_REQUIRED,
  STORIES_NEW_PROMPT_HASHTAG,
  STORIES_NEW_PROMPT_WHAT,
  STORIES_NEW_PROMPT_WHERE,
  STORIES_NEW_PROMPT_WHO,
  STORIES_NEW_PUBLISH,
  STORIES_NEW_PUBLISHING,
  STORIES_NEW_STEP1_HINT,
  STORIES_NEW_STEP1_TITLE,
  STORIES_NEW_STEP2_HINT,
  STORIES_NEW_STEP2_OPTIONAL,
  STORIES_NEW_STEP2_TITLE,
  STORIES_NEW_STEP3_HINT,
  STORIES_NEW_STEP3_TITLE,
  STORIES_NEW_STEP4_HINT,
  STORIES_NEW_STEP4_TITLE,
  STORIES_NEW_UPLOAD_BUTTON,
  STORIES_NEW_UPLOAD_ERROR,
  STORIES_NEW_UPLOAD_SUBTITLE,
  STORIES_NEW_UPLOAD_TIP_FORMAT,
  STORIES_NEW_UPLOAD_TIP_IMAGE,
  STORIES_NEW_UPLOAD_TIP_SIZE,
  STORIES_NEW_UPLOAD_TIP_VIDEO,
  STORIES_NEW_UPLOAD_TITLE,
  STORIES_NEW_VIDEO_TOO_LONG,
  STORIES_NEW_VISIBILITY_NOTICE,
  STORIES_VIDEO_MAX_SECONDS,
} from "@yunicity/utils";
import {
  AtSign,
  BarChart3,
  Globe,
  Hash,
  ImageIcon,
  Lock,
  MapPin,
  Music,
  Send,
  Smartphone,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4";
const MAX_BYTES = STORIES_MEDIA_MAX_MB * 1024 * 1024;

export type NewStoryPreviewState = {
  caption: string;
  audience: StoryAudienceId;
  previewUrl: string | null;
  previewMediaType: "image" | "video" | null;
};

type NewStoryFormProps = {
  submitting: boolean;
  error: string | null;
  ideaPrompt?: string | null;
  onIdeaPromptConsumed?: () => void;
  onCancel: () => void;
  onPreviewChange?: (state: NewStoryPreviewState) => void;
  onSubmit: (payload: {
    file: File;
    caption: string;
    audience: StoryAudienceId;
    tags: string[];
    locationLabel: string | null;
  }) => Promise<void>;
};

export function NewStoryForm({
  submitting,
  error,
  ideaPrompt,
  onIdeaPromptConsumed,
  onCancel,
  onPreviewChange,
  onSubmit,
}: NewStoryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [showLocationField, setShowLocationField] = useState(false);
  const [audience, setAudience] = useState<StoryAudienceId>("public");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [elementNotice, setElementNotice] = useState<string | null>(null);

  useEffect(() => {
    onPreviewChange?.({
      caption,
      audience,
      previewUrl: localPreviewUrl,
      previewMediaType,
    });
  }, [caption, audience, localPreviewUrl, previewMediaType, onPreviewChange]);

  useEffect(() => {
    if (!ideaPrompt) return;
    setCaption((prev) => (prev.trim() ? `${prev.trim()} ${ideaPrompt}` : ideaPrompt));
    onIdeaPromptConsumed?.();
  }, [ideaPrompt, onIdeaPromptConsumed]);

  const resetFile = useCallback(() => {
    setFile(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewMediaType(null);
  }, []);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  async function validateVideoDuration(selected: File): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration <= STORIES_VIDEO_MAX_SECONDS);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(false);
      };
      video.src = URL.createObjectURL(selected);
    });
  }

  async function handleSelectedFile(selected: File | null) {
    setUploadError(null);
    setElementNotice(null);
    if (!selected) return;

    if (selected.size > MAX_BYTES) {
      setUploadError(`Fichier trop volumineux (max. ${STORIES_MEDIA_MAX_MB} Mo).`);
      return;
    }

    const isVideo = selected.type.startsWith("video/");
    const isImage = selected.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setUploadError("Format non supporté. Utilisez JPG, PNG, WEBP ou MP4.");
      return;
    }

    if (isVideo) {
      const ok = await validateVideoDuration(selected);
      if (!ok) {
        setUploadError(STORIES_NEW_VIDEO_TOO_LONG);
        return;
      }
    }

    resetFile();
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setLocalPreviewUrl(objectUrl);
    setPreviewMediaType(isVideo ? "video" : "image");
  }

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^[@#]/, "");
    if (!tag || tags.length >= 8) return;
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag]);
  }

  function applyPrompt(kind: "where" | "what" | "who" | "hashtag") {
    if (kind === "where") {
      setShowLocationField(true);
      return;
    }
    if (kind === "what") {
      setCaption((prev) => (prev.trim() ? `${prev.trim()} — ` : "En ce moment : "));
      return;
    }
    if (kind === "who") {
      const mention = window.prompt("Mentionnez un membre (@pseudo)");
      if (mention?.trim()) addTag(mention.trim());
      return;
    }
    const hashtag = window.prompt("Ajoutez un hashtag");
    if (hashtag?.trim()) addTag(hashtag.trim());
  }

  function handleElementClick(kind: "location" | "mention" | "hashtag" | "music" | "poll") {
    setElementNotice(null);
    if (kind === "location") {
      setShowLocationField(true);
      return;
    }
    if (kind === "mention") {
      const mention = window.prompt("Mentionnez un membre (@pseudo)");
      if (mention?.trim()) addTag(mention.trim());
      return;
    }
    if (kind === "hashtag") {
      const hashtag = window.prompt("Ajoutez un hashtag");
      if (hashtag?.trim()) addTag(hashtag.trim());
      return;
    }
    setElementNotice(STORIES_NEW_ELEMENT_SOON);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setUploadError(STORIES_NEW_MEDIA_REQUIRED);
      return;
    }
    await onSubmit({
      file,
      caption: caption.trim(),
      audience,
      tags,
      locationLabel: locationLabel.trim() || null,
    });
  }

  const displayError = error || uploadError;

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={1} title={STORIES_NEW_STEP1_TITLE} hint={STORIES_NEW_STEP1_HINT} />
        <div
          className={`relative mt-5 rounded-2xl border-2 border-dashed transition ${
            dragActive
              ? "border-yunicity-primary bg-[#EEF0FF]/60"
              : "border-neutral-200 bg-neutral-50/50"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const dropped = event.dataTransfer.files.item(0);
            void handleSelectedFile(dropped);
          }}
        >
          {localPreviewUrl && previewMediaType === "image" ? (
            <div className="relative aspect-[9/16] max-h-[420px] w-full overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localPreviewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={resetFile}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                aria-label="Retirer le fichier"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : localPreviewUrl && previewMediaType === "video" ? (
            <div className="relative aspect-[9/16] max-h-[420px] w-full overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={localPreviewUrl} className="h-full w-full object-cover" controls />
              <button
                type="button"
                onClick={resetFile}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                aria-label="Retirer le fichier"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary">
                <ImageIcon className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-bold text-neutral-900">{STORIES_NEW_UPLOAD_TITLE}</p>
              <p className="mt-1 text-sm text-neutral-500">{STORIES_NEW_UPLOAD_SUBTITLE}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-yunicity-primary bg-white px-5 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
              >
                <Upload className="h-4 w-4" aria-hidden />
                {STORIES_NEW_UPLOAD_BUTTON}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.item(0) ?? null;
              void handleSelectedFile(selected);
              event.target.value = "";
            }}
          />
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <UploadTip icon={Smartphone} label={STORIES_NEW_UPLOAD_TIP_FORMAT} />
          <UploadTip icon={ImageIcon} label={STORIES_NEW_UPLOAD_TIP_IMAGE} />
          <UploadTip icon={Upload} label={STORIES_NEW_UPLOAD_TIP_VIDEO} />
          <UploadTip icon={Upload} label={STORIES_NEW_UPLOAD_TIP_SIZE} />
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader
          step={2}
          title={STORIES_NEW_STEP2_TITLE}
          hint={STORIES_NEW_STEP2_HINT}
          optional={STORIES_NEW_STEP2_OPTIONAL}
        />
        <div className="relative mt-4">
          <textarea
            value={caption}
            maxLength={STORIES_CAPTION_MAX}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={STORIES_NEW_CAPTION_PLACEHOLDER}
            rows={4}
            className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-neutral-400">
            {caption.length}/{STORIES_CAPTION_MAX}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PromptChip label={STORIES_NEW_PROMPT_WHERE} onClick={() => applyPrompt("where")} />
          <PromptChip label={STORIES_NEW_PROMPT_WHAT} onClick={() => applyPrompt("what")} />
          <PromptChip label={STORIES_NEW_PROMPT_WHO} onClick={() => applyPrompt("who")} />
          <PromptChip label={STORIES_NEW_PROMPT_HASHTAG} onClick={() => applyPrompt("hashtag")} />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={3} title={STORIES_NEW_STEP3_TITLE} hint={STORIES_NEW_STEP3_HINT} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ElementButton
            icon={MapPin}
            label={STORIES_NEW_ELEMENT_LOCATION}
            onClick={() => handleElementClick("location")}
          />
          <ElementButton
            icon={AtSign}
            label={STORIES_NEW_ELEMENT_MENTION}
            onClick={() => handleElementClick("mention")}
          />
          <ElementButton
            icon={Hash}
            label={STORIES_NEW_ELEMENT_HASHTAG}
            onClick={() => handleElementClick("hashtag")}
          />
          <ElementButton
            icon={Music}
            label={STORIES_NEW_ELEMENT_MUSIC}
            onClick={() => handleElementClick("music")}
            disabled
          />
          <ElementButton
            icon={BarChart3}
            label={STORIES_NEW_ELEMENT_POLL}
            onClick={() => handleElementClick("poll")}
            disabled
          />
        </div>
        {showLocationField ? (
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-neutral-800">Lieu</span>
            <input
              type="text"
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder={STORIES_NEW_LOCATION_PLACEHOLDER}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
            />
          </label>
        ) : null}
        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-semibold text-yunicity-primary"
                >
                  {tag.startsWith("@") ? tag : `#${tag}`}
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {elementNotice ? (
          <p className="mt-3 text-sm text-neutral-500">{elementNotice}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={4} title={STORIES_NEW_STEP4_TITLE} hint={STORIES_NEW_STEP4_HINT} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AudienceCard
            icon={Globe}
            title={STORIES_NEW_AUDIENCE_PUBLIC_TITLE}
            body={STORIES_NEW_AUDIENCE_PUBLIC_BODY}
            active={audience === "public"}
            onClick={() => setAudience("public")}
          />
          <AudienceCard
            icon={Users}
            title={STORIES_NEW_AUDIENCE_COMMUNITY_TITLE}
            body={STORIES_NEW_AUDIENCE_COMMUNITY_BODY}
            active={audience === "community"}
            onClick={() => setAudience("community")}
          />
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#EEF0FF]/80 px-4 py-3 text-sm text-neutral-700">
          <Lock className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          {STORIES_NEW_VISIBILITY_NOTICE}
        </p>
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
          {STORIES_NEW_CANCEL}
        </button>
        <button
          type="submit"
          disabled={submitting || !file}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 disabled:opacity-60"
        >
          {submitting ? STORIES_NEW_PUBLISHING : STORIES_NEW_PUBLISH}
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

function StepHeader({
  step,
  title,
  hint,
  optional,
}: {
  step: number;
  title: string;
  hint: string;
  optional?: string;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-neutral-900">
        <span className="mr-2 text-yunicity-primary">{step}.</span>
        {title}
        {optional ? (
          <span className="ml-1 text-sm font-medium text-neutral-500">{optional}</span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{hint}</p>
    </div>
  );
}

function UploadTip({
  icon: Icon,
  label,
}: {
  icon: typeof Upload;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 text-xs text-neutral-500">
      <Icon className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
      {label}
    </li>
  );
}

function PromptChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-[#EEF0FF] px-3 py-1.5 text-xs font-semibold text-yunicity-primary transition hover:bg-[#E0E3FF]"
    >
      {label}
    </button>
  );
}

function ElementButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof MapPin;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-center transition hover:border-yunicity-primary hover:bg-[#EEF0FF]/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-5 w-5 text-yunicity-primary" aria-hidden />
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
    </button>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  body,
  active,
  onClick,
}: {
  icon: typeof Globe;
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-yunicity-primary bg-[#EEF0FF]"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? "text-yunicity-primary" : "text-neutral-500"}`}
        aria-hidden
      />
      <span className="text-sm font-bold text-neutral-900">{title}</span>
      <span className="text-xs leading-relaxed text-neutral-600">{body}</span>
    </button>
  );
}
