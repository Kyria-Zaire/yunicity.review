"use client";

import { NewPostDesktopView } from "@/components/feed/post-composer/desktop/new-post-desktop-view";
import { NewPostMobileView } from "@/components/feed/post-composer/mobile/new-post-mobile-view";
import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PostMediaItem } from "@yunicity/types";
import {
  POST_NEW_ERROR,
  POST_NEW_UPLOAD_ERROR,
  humanizeAuthFailure,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
    if (!draft.canPublish || submitting) return;
    if (draft.publishBlockReason) {
      setError(draft.publishBlockReason);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const uploaded: PostMediaItem[] = [];
      for (const item of draft.selectedMedia) {
        try {
          const response = await api.uploadPostMedia(item.file);
          uploaded.push({
            url: response.url,
            media_type: response.media_type,
          });
        } catch (uploadErr) {
          setError(humanizeAuthFailure(uploadErr, POST_NEW_UPLOAD_ERROR));
          return;
        }
      }

      await api.createFeedPost(draft.buildCreatePayload(uploaded));
      router.push("/feed");
      router.refresh();
    } catch (publishErr) {
      setError(humanizeAuthFailure(publishErr, POST_NEW_ERROR));
    } finally {
      setSubmitting(false);
    }
  }, [api, draft, router, submitting]);

  return (
    <div className="feed-new-mobile-shell web-shell-page min-h-dvh bg-[#F4F5F7]">
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <main className="web-main-column min-w-0">
          <div className="web-desktop-feed-new-only hidden sm:block">
            <CitizenTopNav />
          </div>
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
