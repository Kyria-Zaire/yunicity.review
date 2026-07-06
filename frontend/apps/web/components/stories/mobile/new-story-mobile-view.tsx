"use client";

import type { useNewStoryDraft } from "@/hooks/use-new-story-draft";
import type { StoryMobileStepId } from "@yunicity/utils";
import { STORIES_MOBILE_STEPS } from "@yunicity/utils";
import { useCallback, useState } from "react";

import { NewStoryMobileContentStep } from "./new-story-mobile-content-step";
import { NewStoryMobileDetailsStep } from "./new-story-mobile-details-step";
import { NewStoryMobileHeader } from "./new-story-mobile-header";
import { NewStoryMobileShareStep } from "./new-story-mobile-share-step";
import { NewStoryMobileStepper } from "./new-story-mobile-stepper";

type Draft = ReturnType<typeof useNewStoryDraft>;

type NewStoryMobileViewProps = {
  draft: Draft;
  submitting: boolean;
  error: string | null;
  onPublish: () => void;
};

/** Vue mobile complète « Partager une story » (MOBILE-NEW-STORY-01). */
export function NewStoryMobileView({
  draft,
  submitting,
  error,
  onPublish,
}: NewStoryMobileViewProps) {
  const [step, setStep] = useState<StoryMobileStepId>("content");

  const goNext = useCallback(() => {
    const index = STORIES_MOBILE_STEPS.findIndex((item) => item.id === step);
    const next = STORIES_MOBILE_STEPS[index + 1];
    if (next) setStep(next.id);
  }, [step]);

  return (
    <div className="web-mobile-stories-new-only flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col bg-[#F4F5F7]">
      <NewStoryMobileHeader
        submitting={submitting}
        canPublish={draft.canPublish}
        onPublish={onPublish}
      />

      <div className="flex flex-1 flex-col space-y-4 px-4 pt-3">
        <NewStoryMobileStepper activeStep={step} />

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {step === "content" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <NewStoryMobileContentStep draft={draft} onNext={goNext} />
          </div>
        ) : null}

        {step === "details" ? (
          <NewStoryMobileDetailsStep draft={draft} onNext={goNext} />
        ) : null}

        {step === "share" ? <NewStoryMobileShareStep draft={draft} /> : null}

        <input
          ref={draft.fileInputRef}
          type="file"
          accept={draft.acceptedTypes}
          className="sr-only"
          onChange={(event) => {
            const selected = event.target.files?.item(0) ?? null;
            void draft.handleSelectedFile(selected);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
