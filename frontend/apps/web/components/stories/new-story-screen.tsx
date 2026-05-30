"use client";

import type { StoryAudienceId } from "@yunicity/types";
import {
  STORIES_NEW_SUBTITLE,
  STORIES_NEW_TITLE,
  STORIES_NEW_ERROR,
  storyDetailHref,
} from "@yunicity/utils";
import { CircleDot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  NewStoryForm,
  type NewStoryPreviewState,
} from "@/components/stories/new-story-form";
import { NewStoryRightRail } from "@/components/stories/new-story-right-rail";
import { StoriesAppShell } from "@/components/stories/stories-app-shell";
import { StoriesLeftRail } from "@/components/stories/stories-left-rail";
import { useStoriesPortalContext } from "@/hooks/use-stories-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

const INITIAL_PREVIEW: NewStoryPreviewState = {
  caption: "",
  audience: "public",
  previewUrl: null,
  previewMediaType: null,
};

export function NewStoryScreen() {
  const router = useRouter();
  const api = useYunicityApi();
  const portal = useStoriesPortalContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<NewStoryPreviewState>(INITIAL_PREVIEW);
  const [ideaPrompt, setIdeaPrompt] = useState<string | null>(null);

  const handlePreviewChange = useCallback((state: NewStoryPreviewState) => {
    setPreview(state);
  }, []);

  function applyIdea(text: string) {
    setIdeaPrompt(text);
  }

  async function handleSubmit(payload: {
    file: File;
    caption: string;
    audience: StoryAudienceId;
    tags: string[];
    locationLabel: string | null;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await api.uploadStoryMedia(payload.file);
      const created = await api.createStory({
        media_url: uploaded.url,
        media_type: uploaded.media_type,
        caption: payload.caption,
        audience: payload.audience,
        tags: payload.tags,
        location_label: payload.locationLabel,
      });
      router.push(storyDetailHref(created.id));
    } catch {
      setError(STORIES_NEW_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const rightRail = (
    <NewStoryRightRail
      profile={portal.profile}
      previewUrl={preview.previewUrl}
      previewMediaType={preview.previewMediaType}
      caption={preview.caption}
      audience={preview.audience}
      onApplyIdea={applyIdea}
    />
  );

  return (
    <StoriesAppShell rightRail={rightRail}>
      <StoriesLeftRail
        city={portal.city}
        tribes={portal.tribes}
        featured={portal.insights?.featured ?? null}
        activeSection="new"
      />

      <div className="min-w-0 flex-1">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-yunicity-primary/40 bg-[#EEF0FF] text-yunicity-primary">
            <CircleDot className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {STORIES_NEW_TITLE}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {STORIES_NEW_SUBTITLE}
            </p>
          </div>
        </header>

        <div className="mt-6">
          <NewStoryForm
            submitting={submitting}
            error={error}
            ideaPrompt={ideaPrompt}
            onIdeaPromptConsumed={() => setIdeaPrompt(null)}
            onCancel={() => router.push("/stories")}
            onPreviewChange={handlePreviewChange}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="mt-8 2xl:hidden">{rightRail}</div>
      </div>
    </StoriesAppShell>
  );
}
