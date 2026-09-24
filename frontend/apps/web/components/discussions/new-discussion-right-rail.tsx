"use client";

import type { DiscussionNewExample } from "@yunicity/utils";
import {
  DISCUSSION_NEW_EXAMPLES_EMPTY,
  DISCUSSION_NEW_EXAMPLES_TITLE,
  DISCUSSION_NEW_RULES_LINK,
  DISCUSSION_NEW_RULES_NOTICE,
  DISCUSSION_NEW_RULES_TITLE,
  DISCUSSION_NEW_TIPS,
  DISCUSSION_NEW_TIPS_TITLE,
} from "@yunicity/utils";
import { ArrowRight, Heart, Info, Lightbulb, ShieldPlus, Tag } from "lucide-react";
import Link from "next/link";

const TIP_ICONS = {
  clear: Lightbulb,
  category: Tag,
  kind: Heart,
  details: Info,
} as const;

const TIP_TONES = {
  clear: "bg-violet-50 text-violet-600",
  category: "bg-emerald-50 text-emerald-600",
  kind: "bg-orange-50 text-orange-600",
  details: "bg-sky-50 text-sky-600",
} as const;

type NewDiscussionRightRailProps = {
  examples: DiscussionNewExample[];
  compact?: boolean;
};

export function NewDiscussionRightRail({ examples, compact = false }: NewDiscussionRightRailProps) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <section className={`rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${compact ? "p-3" : "p-4"}`}>
        <h2 className="text-sm font-bold text-neutral-900">{DISCUSSION_NEW_TIPS_TITLE}</h2>
        <ul className={`mt-3 space-y-3 ${compact ? "" : "mt-4 space-y-4"}`}>
          {(compact ? DISCUSSION_NEW_TIPS.slice(0, 2) : DISCUSSION_NEW_TIPS).map((tip) => {
            const Icon = TIP_ICONS[tip.id];
            const tone = TIP_TONES[tip.id];
            return (
              <li key={tip.id} className="flex gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">{tip.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                    {tip.body}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {!compact ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">{DISCUSSION_NEW_EXAMPLES_TITLE}</h2>
          {examples.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">{DISCUSSION_NEW_EXAMPLES_EMPTY}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {examples.map((example) => (
                <li key={`${example.title}-${example.categoryId}`} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                    ?
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">{example.title}</span>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${example.toneClass}`}
                    >
                      {example.categoryLabel}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className={`rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{DISCUSSION_NEW_RULES_TITLE}</h2>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {DISCUSSION_NEW_RULES_LINK}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 flex gap-3 rounded-xl bg-[#EEF0FF] p-3">
          <ShieldPlus className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-neutral-700">{DISCUSSION_NEW_RULES_NOTICE}</p>
        </div>
      </section>
    </div>
  );
}
