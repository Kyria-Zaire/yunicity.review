"use client";

import type { StoryItem } from "@yunicity/types";
import { storyAuthorLine } from "@yunicity/utils";
import { Eye, MapPin, MoreVertical, Send } from "lucide-react";
import { useEffect } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type StoryCardProps = {
  story: StoryItem;
  city: string;
};

export function StoryCard({ story, city }: StoryCardProps) {
  const api = useYunicityApi();

  useEffect(() => {
    const key = `story-view-${story.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void api.recordStoryView(story.id);
  }, [api, story.id]);

  return (
    <article
      id={`story-${story.id}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.media_url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />

      <header className="relative z-10 flex items-start justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/30">
            {story.author.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.author.logo_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              story.author.display_name.slice(0, 1)
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{story.author.display_name}</p>
            <p className="truncate text-xs text-white/80">{storyAuthorLine(story, city)}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Options"
          className="rounded-full p-1 text-white/80 transition hover:bg-white/10"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </header>

      <footer className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-3">
        {story.caption ? (
          <p className="line-clamp-3 text-sm leading-snug text-white">{story.caption}</p>
        ) : null}
        {story.location_label ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" aria-hidden />
            {story.location_label}
          </span>
        ) : null}
        <div className="flex items-center justify-between text-white/90">
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {story.view_count}
          </span>
          <button
            type="button"
            aria-label="Partager"
            className="rounded-full p-1 transition hover:bg-white/10"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </article>
  );
}
