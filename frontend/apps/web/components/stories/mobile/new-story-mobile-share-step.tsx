"use client";

import type { StoryAudienceId } from "@yunicity/types";
import type { useNewStoryDraft } from "@/hooks/use-new-story-draft";
import {
  STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS,
  STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS_BODY,
  STORIES_MOBILE_AUDIENCE_COMMUNITY,
  STORIES_MOBILE_AUDIENCE_COMMUNITY_BODY,
  STORIES_MOBILE_AUDIENCE_CUSTOM,
  STORIES_MOBILE_AUDIENCE_CUSTOM_BODY,
  STORIES_MOBILE_AUDIENCE_FOLLOWERS,
  STORIES_MOBILE_AUDIENCE_FOLLOWERS_BODY,
  STORIES_MOBILE_AUDIENCE_PUBLIC,
  STORIES_MOBILE_AUDIENCE_PUBLIC_BODY,
  STORIES_MOBILE_AUDIENCE_SOON,
  STORIES_MOBILE_AUDIENCE_TITLE,
  STORIES_MOBILE_CROSSPOST_SOON,
  STORIES_MOBILE_CROSSPOST_TITLE,
  STORIES_MOBILE_EPHEMERAL_BODY,
  STORIES_MOBILE_EPHEMERAL_TITLE,
  STORIES_MOBILE_OPTION_MESSAGES,
  STORIES_MOBILE_OPTION_REPLIES,
  STORIES_MOBILE_OPTION_SAVE,
  STORIES_MOBILE_OPTION_SOON,
  STORIES_MOBILE_OPTIONS_TITLE,
} from "@yunicity/utils";
import {
  ChevronRight,
  Download,
  Eye,
  Globe,
  Lock,
  MessageCircle,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

type Draft = ReturnType<typeof useNewStoryDraft>;

type NewStoryMobileShareStepProps = {
  draft: Draft;
};

type AudienceOption = {
  id: StoryAudienceId | "followers" | "close_friends" | "custom";
  title: string;
  body: string;
  icon: typeof Globe;
  supported: boolean;
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: "public",
    title: STORIES_MOBILE_AUDIENCE_PUBLIC,
    body: STORIES_MOBILE_AUDIENCE_PUBLIC_BODY,
    icon: Globe,
    supported: true,
  },
  {
    id: "followers",
    title: STORIES_MOBILE_AUDIENCE_FOLLOWERS,
    body: STORIES_MOBILE_AUDIENCE_FOLLOWERS_BODY,
    icon: User,
    supported: false,
  },
  {
    id: "close_friends",
    title: STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS,
    body: STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS_BODY,
    icon: UserPlus,
    supported: false,
  },
  {
    id: "custom",
    title: STORIES_MOBILE_AUDIENCE_CUSTOM,
    body: STORIES_MOBILE_AUDIENCE_CUSTOM_BODY,
    icon: Users,
    supported: false,
  },
  {
    id: "community",
    title: STORIES_MOBILE_AUDIENCE_COMMUNITY,
    body: STORIES_MOBILE_AUDIENCE_COMMUNITY_BODY,
    icon: Users,
    supported: true,
  },
];

/** Étape 3 — audience et options (MOBILE-NEW-STORY-01). */
export function NewStoryMobileShareStep({ draft }: NewStoryMobileShareStepProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [allowReplies, setAllowReplies] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowSave, setAllowSave] = useState(false);

  function selectAudience(option: AudienceOption) {
    if (!option.supported) {
      setNotice(STORIES_MOBILE_AUDIENCE_SOON);
      return;
    }
    if (option.id === "public" || option.id === "community") {
      draft.setAudience(option.id);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900">{STORIES_MOBILE_AUDIENCE_TITLE}</h2>
        <ul className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {AUDIENCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.supported && option.id === draft.audience;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => selectAudience(option)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <Icon className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">{option.title}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{option.body}</span>
                  </span>
                  {option.supported ? (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-yunicity-primary bg-yunicity-primary" : "border-neutral-300"
                      }`}
                      aria-hidden
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900">{STORIES_MOBILE_OPTIONS_TITLE}</h2>
        <ul className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          <OptionToggle
            icon={Eye}
            label={STORIES_MOBILE_OPTION_REPLIES}
            enabled={allowReplies}
            onChange={setAllowReplies}
          />
          <OptionToggle
            icon={MessageCircle}
            label={STORIES_MOBILE_OPTION_MESSAGES}
            enabled={allowMessages}
            onChange={setAllowMessages}
          />
          <OptionToggle
            icon={Download}
            label={STORIES_MOBILE_OPTION_SAVE}
            enabled={allowSave}
            onChange={setAllowSave}
          />
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900">{STORIES_MOBILE_CROSSPOST_TITLE}</h2>
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-center text-sm text-neutral-500">
          {STORIES_MOBILE_CROSSPOST_SOON}
        </p>
      </section>

      <div className="rounded-2xl bg-[#EEF0FF] p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{STORIES_MOBILE_EPHEMERAL_TITLE}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {STORIES_MOBILE_EPHEMERAL_BODY}
            </p>
          </div>
        </div>
      </div>

      {notice ? <p className="text-center text-xs text-neutral-500">{notice}</p> : null}
    </div>
  );
}

function OptionToggle({
  icon: Icon,
  label,
  enabled,
  onChange,
}: {
  icon: typeof Eye;
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-neutral-500" aria-hidden />
        <span className="text-sm font-medium text-neutral-900">{label}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-yunicity-primary" : "bg-neutral-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            enabled ? "left-[1.35rem]" : "left-0.5"
          }`}
        />
      </button>
    </li>
  );
}
