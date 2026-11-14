"use client";

import type { VideosPortalTabId } from "@yunicity/utils";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_MOBILE_EMPTY_BACK_TO_FOR_YOU,
  VIDEOS_MOBILE_ERROR_HINT,
  VIDEOS_MOBILE_FOR_YOU_EMPTY,
  VIDEOS_MOBILE_FOR_YOU_EMPTY_HINT,
  VIDEOS_MOBILE_NEW_EMPTY,
  VIDEOS_MOBILE_NEW_EMPTY_HINT,
  VIDEOS_MOBILE_PUBLISH_ARIA,
  VIDEOS_MOBILE_TRENDING_EMPTY,
  VIDEOS_MOBILE_TRENDING_EMPTY_HINT,
  VIDEOS_PORTAL_LOADING,
} from "@yunicity/utils";
import { AlertCircle, MonitorPlay } from "lucide-react";
import Link from "next/link";

import { VideosMobileFeedTopBar } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type VideosMobileImmersiveStateProps = {
  kind: "loading" | "empty" | "error";
  tab: VideosPortalTabId;
  onTabChange?: (tab: VideosPortalTabId) => void;
  onRetry: () => void;
};

function emptyCopy(tab: VideosPortalTabId): { title: string; hint: string } {
  if (tab === "trending") return { title: VIDEOS_MOBILE_TRENDING_EMPTY, hint: VIDEOS_MOBILE_TRENDING_EMPTY_HINT };
  if (tab === "new") return { title: VIDEOS_MOBILE_NEW_EMPTY, hint: VIDEOS_MOBILE_NEW_EMPTY_HINT };
  return { title: VIDEOS_MOBILE_FOR_YOU_EMPTY, hint: VIDEOS_MOBILE_FOR_YOU_EMPTY_HINT };
}

const actionClass = `mt-2 inline-flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-bold text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`;

/**
 * États du fil immersif mobile (cadrage v24, écrans V1 et V2) : chargement, vue vide,
 * erreur de chargement. Seul le sélecteur de vue reste en haut ; une erreur n'est jamais
 * présentée comme une vue vide.
 */
export function VideosMobileImmersiveState({ kind, tab, onTabChange, onRetry }: VideosMobileImmersiveStateProps) {
  const empty = emptyCopy(tab);

  return (
    <div
      className="videos-mobile-immersive-feed relative flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-[#111827] text-white"
      data-videos-discovery-immersive=""
      data-videos-immersive-mobile=""
      data-videos-immersive-state={kind}
    >
      <VideosMobileFeedTopBar variant="discovery" tab={tab} onTabChange={onTabChange} />
      <div className="flex flex-1 items-center justify-center px-8">
        {kind === "loading" ? (
          <p role="status" className="text-sm font-semibold">
            {VIDEOS_PORTAL_LOADING}
          </p>
        ) : kind === "error" ? (
          <div role="alert" className="flex flex-col items-center gap-2.5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.12]">
              <AlertCircle className="h-[26px] w-[26px]" aria-hidden />
            </span>
            <p className="mt-1.5 text-[17px] font-bold">{LOCAL_VIDEO_ERROR_MESSAGE}</p>
            <p className="text-sm leading-5">{VIDEOS_MOBILE_ERROR_HINT}</p>
            <button type="button" onClick={onRetry} className={actionClass}>
              {LOCAL_VIDEO_RETRY_LABEL}
            </button>
          </div>
        ) : (
          <div role="status" className="flex flex-col items-center gap-2.5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.12]">
              <MonitorPlay className="h-[26px] w-[26px]" aria-hidden />
            </span>
            <p className="mt-1.5 text-[17px] font-bold">{empty.title}</p>
            <p className="text-sm leading-5">{empty.hint}</p>
            {tab !== "all" && onTabChange ? (
              <button type="button" onClick={() => onTabChange("all")} className={actionClass}>
                {VIDEOS_MOBILE_EMPTY_BACK_TO_FOR_YOU}
              </button>
            ) : (
              <Link href="/videos/new" className={actionClass}>
                {VIDEOS_MOBILE_PUBLISH_ARIA}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
