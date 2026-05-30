"use client";

import type { ProfileMe } from "@yunicity/types";
import type { StoryAudienceId } from "@yunicity/types";
import {
  STORIES_NEW_IDEAS,
  STORIES_NEW_IDEAS_TITLE,
  STORIES_NEW_PREVIEW_CAPTION_PLACEHOLDER,
  STORIES_NEW_PREVIEW_TITLE,
  STORIES_NEW_PREVIEW_VISIBILITY_COMMUNITY,
  STORIES_NEW_PREVIEW_VISIBILITY_PUBLIC,
  STORIES_NEW_RULES,
  STORIES_NEW_RULES_LINK,
  STORIES_NEW_RULES_TITLE,
} from "@yunicity/utils";
import {
  ArrowRight,
  Calendar,
  Compass,
  Edit3,
  Globe,
  Send,
  Shield,
  Sun,
  TreePine,
  Users,
  Coffee,
} from "lucide-react";
import Link from "next/link";

const IDEA_ICONS = {
  sunset: Sun,
  cafe: Coffee,
  friends: Users,
  event: Calendar,
  nature: TreePine,
} as const;

const IDEA_TONES = {
  sunset: "bg-orange-50 text-orange-600",
  cafe: "bg-sky-50 text-sky-600",
  friends: "bg-emerald-50 text-emerald-600",
  event: "bg-rose-50 text-rose-600",
  nature: "bg-lime-50 text-lime-700",
} as const;

type NewStoryRightRailProps = {
  profile: ProfileMe | null;
  previewUrl: string | null;
  previewMediaType: "image" | "video" | null;
  caption: string;
  audience: StoryAudienceId;
  onApplyIdea: (text: string) => void;
};

export function NewStoryRightRail({
  profile,
  previewUrl,
  previewMediaType,
  caption,
  audience,
  onApplyIdea,
}: NewStoryRightRailProps) {
  const displayName =
    profile?.display_name?.trim() || profile?.username?.trim() || "Votre nom";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{STORIES_NEW_PREVIEW_TITLE}</h2>
        <div className="mx-auto mt-4 w-full max-w-[220px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-lg">
            {previewUrl && previewMediaType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : previewUrl && previewMediaType === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={previewUrl} className="absolute inset-0 h-full w-full object-cover" muted />
            ) : (
              <div className="absolute inset-0 bg-neutral-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-white/90" aria-hidden />
            <header className="relative z-10 flex items-center gap-2 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  displayName.slice(0, 1)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{displayName}</p>
                <p className="text-[10px] text-white/80">À l&apos;instant</p>
              </div>
            </header>
            <footer className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-3">
              <p className="line-clamp-3 text-xs text-white">
                {caption.trim() || STORIES_NEW_PREVIEW_CAPTION_PLACEHOLDER}
              </p>
              <div className="flex items-center justify-between text-[10px] text-white/90">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden />
                  {audience === "community"
                    ? STORIES_NEW_PREVIEW_VISIBILITY_COMMUNITY
                    : STORIES_NEW_PREVIEW_VISIBILITY_PUBLIC}
                </span>
                <Send className="h-3.5 w-3.5" aria-hidden />
              </div>
            </footer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{STORIES_NEW_IDEAS_TITLE}</h2>
        <ul className="mt-4 space-y-3">
          {STORIES_NEW_IDEAS.map((idea) => {
            const Icon = IDEA_ICONS[idea.id];
            const tone = IDEA_TONES[idea.id];
            return (
              <li key={idea.id}>
                <button
                  type="button"
                  onClick={() => onApplyIdea(idea.title)}
                  className="flex w-full items-start gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-neutral-50"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">{idea.title}</span>
                    <span className="block text-xs text-neutral-500">{idea.body}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{STORIES_NEW_RULES_TITLE}</h2>
        <ul className="mt-3 space-y-2.5">
          {STORIES_NEW_RULES.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2 text-sm text-neutral-700">
              {rule.id === "authentic" ? (
                <Edit3 className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : rule.id === "appropriate" ? (
                <Compass className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : rule.id === "respect" ? (
                <Users className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : (
                <Shield className="h-4 w-4 text-yunicity-primary" aria-hidden />
              )}
              {rule.label}
            </li>
          ))}
        </ul>
        <Link
          href="/settings"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {STORIES_NEW_RULES_LINK}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
