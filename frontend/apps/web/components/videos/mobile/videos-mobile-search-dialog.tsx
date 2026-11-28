"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_MOBILE_SEARCH_BACK,
  VIDEOS_MOBILE_SEARCH_CLEAR,
  VIDEOS_MOBILE_SEARCH_CLEAR_FIELD,
  VIDEOS_MOBILE_SEARCH_CURRENT,
  VIDEOS_MOBILE_SEARCH_MORE,
  VIDEOS_MOBILE_SEARCH_PLACEHOLDER,
  VIDEOS_MOBILE_SEARCH_RETRY,
  VIDEOS_MOBILE_SEARCH_SCOPE_HINT,
  filterVideosPortalItemsBySearch,
  formatLocalVideoDuration,
  formatVideoAuthorDisplayName,
  formatVideosMobileSearchExhausted,
  formatVideosMobileSearchInView,
  formatVideosMobileSearchLoadedBanner,
  formatVideosMobileSearchNoneAmongLoaded,
  formatVideosMobileSearchResultStatus,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { ArrowLeft, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type VideosMobileSearchDialogProps = {
  open: boolean;
  viewLabel: string;
  items: readonly LocalVideoFeedItem[];
  activeVideoId?: string | null;
  hasMoreFeed: boolean;
  isLoadingMore: boolean;
  loadMoreError?: boolean;
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
  onSearchMore: () => void;
  onClearLoadError?: () => void;
};

/**
 * Recherche dédiée aux vidéos (cadrage v25, R1–R4) : overlay dialog, portée limitée
 * aux vidéos déjà chargées (après filtres de la vue).
 */
export function VideosMobileSearchDialog({
  open,
  viewLabel,
  items,
  activeVideoId = null,
  hasMoreFeed,
  isLoadingMore,
  loadMoreError = false,
  onClose,
  onSelectVideo,
  onSearchMore,
  onClearLoadError,
}: VideosMobileSearchDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(
    () => filterVideosPortalItemsBySearch(items, query),
    [items, query],
  );
  const trimmed = query.trim();
  const loadedCount = items.length;
  const hasQuery = trimmed.length > 0;

  if (!open) return null;

  const exhaustedCopy = formatVideosMobileSearchExhausted(trimmed, viewLabel);
  const noneAmongLoaded = formatVideosMobileSearchNoneAmongLoaded(loadedCount, trimmed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 flex flex-col bg-white"
      style={{ zIndex: Z_INDEX.VIDEO_REPORT }}
      data-videos-mobile-search=""
    >
      <h2 id={titleId} className="sr-only">
        Recherche vidéo
      </h2>
      <div className="flex items-center gap-1 border-b border-neutral-200 px-2 pb-2 pt-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={VIDEOS_MOBILE_SEARCH_BACK}
          className={`flex h-11 w-11 shrink-0 items-center justify-center text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{VIDEOS_MOBILE_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              onClearLoadError?.();
            }}
            placeholder={VIDEOS_MOBILE_SEARCH_PLACEHOLDER}
            className="h-11 w-full rounded-full border border-yunicity-primary bg-white py-2 pl-10 pr-10 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onClearLoadError?.();
                inputRef.current?.focus();
              }}
              aria-label={VIDEOS_MOBILE_SEARCH_CLEAR_FIELD}
              className={`absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500 ${VIDEO_IMMERSIVE_FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      <div className="border-b border-neutral-100 px-4 py-2.5">
        <p className="text-[13px] font-semibold text-neutral-800">
          {formatVideosMobileSearchInView(viewLabel)}
        </p>
        <p className="text-[12px] text-neutral-500">{VIDEOS_MOBILE_SEARCH_SCOPE_HINT}</p>
      </div>

      {!hasQuery ? (
        <div className="px-4 py-4">
          <p
            role="status"
            className="rounded-2xl bg-neutral-100 px-3.5 py-3 text-[13px] leading-5 text-neutral-700"
          >
            {formatVideosMobileSearchLoadedBanner(loadedCount)}
          </p>
        </div>
      ) : (
        <>
          <p role="status" className="px-4 py-2.5 text-[13px] text-neutral-600">
            <span className="font-bold text-neutral-900">
              {formatVideosMobileSearchResultStatus(results.length, loadedCount, viewLabel).split(" · ")[0]}
            </span>
            {" · "}
            vue {viewLabel}
          </p>

          {results.length > 0 ? (
            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {results.map((item) => {
                const current = item.id === activeVideoId;
                const title = resolveLocalVideoTeaserTitle(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectVideo(item.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left ${
                        current ? "bg-[#EEF0FF]" : "hover:bg-neutral-50"
                      } ${VIDEO_IMMERSIVE_FOCUS}`}
                    >
                      <span className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                        {item.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- miniature feed locale
                          <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white">
                          {formatLocalVideoDuration(item.duration_seconds)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-neutral-900">
                          <HighlightedTitle title={title} query={trimmed} />
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
                          {formatVideoAuthorDisplayName(item)}
                          {item.neighborhood_name ? ` · ${item.neighborhood_name}` : ""}
                        </span>
                        {current ? (
                          <span className="mt-1 block text-[12px] font-semibold text-yunicity-primary">
                            {VIDEOS_MOBILE_SEARCH_CURRENT}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : hasMoreFeed ? (
            <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <Search className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-4 text-[17px] font-bold text-neutral-900">{noneAmongLoaded.title}</p>
              <p className="mt-2 text-[14px] leading-5 text-neutral-600">{noneAmongLoaded.hint}</p>
              {loadMoreError ? (
                <button
                  type="button"
                  onClick={onSearchMore}
                  disabled={isLoadingMore}
                  className={`mt-6 h-12 w-full max-w-sm rounded-full border border-neutral-300 bg-white text-[15px] font-semibold text-neutral-900 disabled:opacity-60 ${VIDEO_IMMERSIVE_FOCUS}`}
                >
                  {VIDEOS_MOBILE_SEARCH_RETRY}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSearchMore}
                  disabled={isLoadingMore}
                  className={`mt-6 h-12 w-full max-w-sm rounded-full bg-yunicity-primary text-[15px] font-bold text-white disabled:opacity-60 ${VIDEO_IMMERSIVE_FOCUS}`}
                >
                  {isLoadingMore ? "Chargement…" : VIDEOS_MOBILE_SEARCH_MORE}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <Search className="h-7 w-7" aria-hidden />
              </span>
              <p role="status" className="sr-only">
                {exhaustedCopy.status}
              </p>
              <p className="mt-4 text-[17px] font-bold text-neutral-900">{exhaustedCopy.title}</p>
              <p className="mt-2 text-[14px] leading-5 text-neutral-600">{exhaustedCopy.hint}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className={`mt-6 h-12 w-full max-w-sm rounded-full border border-neutral-300 bg-white text-[15px] font-semibold text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`}
              >
                {VIDEOS_MOBILE_SEARCH_CLEAR}
              </button>
            </div>
          )}

          {results.length > 0 && hasMoreFeed ? (
            <div className="border-t border-neutral-100 px-4 py-3">
              <button
                type="button"
                onClick={onSearchMore}
                disabled={isLoadingMore}
                className={`h-12 w-full rounded-full border border-neutral-300 bg-white text-[15px] font-semibold text-neutral-900 disabled:opacity-60 ${VIDEO_IMMERSIVE_FOCUS}`}
              >
                {isLoadingMore ? "Chargement…" : loadMoreError ? VIDEOS_MOBILE_SEARCH_RETRY : VIDEOS_MOBILE_SEARCH_MORE}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const index = title.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return <>{title}</>;
  const before = title.slice(0, index);
  const match = title.slice(index, index + query.length);
  const after = title.slice(index + query.length);
  return (
    <>
      {before}
      <span className="underline decoration-neutral-900 underline-offset-2">{match}</span>
      {after}
    </>
  );
}
