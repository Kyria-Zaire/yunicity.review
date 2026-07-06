"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { NewPostDraft } from "@/hooks/use-new-post-draft";
import type { PostVisibilityId } from "@yunicity/types";
import {
  POST_COMPOSER_BODY_MAX,
  POST_FORMAT_TABS,
  POST_NEW_ALLOW_COMMENTS,
  POST_NEW_ALLOW_SHARES,
  POST_NEW_AUDIENCE_TITLE,
  POST_NEW_MEDIA_CAPTION,
  POST_NEW_PREVIEW_TITLE,
  POST_NEW_SELECT_MEDIA,
  POST_VISIBILITY_OPTIONS,
} from "@yunicity/utils";
import { ChevronRight, Globe2, ImageIcon, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";

type NewPostOptionsPanelProps = {
  draft: NewPostDraft;
  authorLabel: string;
  onOpenMedia: () => void;
};

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-neutral-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-yunicity-primary" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

function OptionRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition hover:bg-neutral-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yunicity-primary-soft text-yunicity-primary">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-neutral-900">{label}</span>
      <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
    </button>
  );
}

export function NewPostOptionsPanel({ draft, authorLabel, onOpenMedia }: NewPostOptionsPanelProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Options
        </p>
        <OptionRow icon={<Users className="h-4 w-4" />} label="Identifier des personnes" />
        <OptionRow icon={<MapPin className="h-4 w-4" />} label="Identifier un lieu" onClick={onOpenMedia} />
        <OptionRow icon={<Globe2 className="h-4 w-4" />} label="Ajouter une activité" />
        <OptionRow icon={<Users className="h-4 w-4" />} label="Partager dans une tribu" />
        <OptionRow icon={<Globe2 className="h-4 w-4" />} label="Programmer la publication" />
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">{POST_NEW_AUDIENCE_TITLE}</h3>
        <ul className="space-y-2">
          {POST_VISIBILITY_OPTIONS.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-1 py-2 hover:bg-neutral-50">
                <input
                  type="radio"
                  name="post-visibility"
                  className="mt-1 accent-yunicity-primary"
                  checked={draft.visibility === option.id}
                  onChange={() => draft.setVisibility(option.id as PostVisibilityId)}
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-900">{option.label}</span>
                  <span className="block text-xs text-neutral-500">{option.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-2">
        <ToggleRow
          label={POST_NEW_ALLOW_COMMENTS}
          checked={draft.allowComments}
          onChange={draft.setAllowComments}
        />
        <ToggleRow
          label={POST_NEW_ALLOW_SHARES}
          checked={draft.allowShares}
          onChange={draft.setAllowShares}
        />
        <ToggleRow
          label={POST_NEW_MEDIA_CAPTION}
          checked={draft.useMediaCaption}
          onChange={draft.setUseMediaCaption}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">{POST_NEW_PREVIEW_TITLE}</h3>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <ProfileAvatar name={authorLabel} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">{authorLabel}</p>
              <p className="text-xs text-neutral-500">À l&apos;instant · Public</p>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-neutral-800">
            {draft.body.trim() || "Votre texte apparaîtra ici…"}
          </p>
          {draft.selectedMedia.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-1">
              {draft.selectedMedia.slice(0, 3).map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-3">
        <button
          type="button"
          onClick={onOpenMedia}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-3 py-3 text-sm text-neutral-600 hover:border-yunicity-primary hover:text-yunicity-primary"
        >
          <ImageIcon className="h-4 w-4" />
          {POST_NEW_SELECT_MEDIA}
        </button>
        <p className="mt-2 px-1 text-xs text-neutral-500">
          {draft.charCount}/{POST_COMPOSER_BODY_MAX} caractères
        </p>
      </section>
    </div>
  );
}

export function NewPostFormatTabs({
  active,
  onChange,
}: {
  active: NewPostDraft["format"];
  onChange: (format: NewPostDraft["format"]) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-0">
      {POST_FORMAT_TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 px-3 pb-2 text-sm font-medium transition ${
              selected
                ? "border-b-2 border-yunicity-primary text-yunicity-primary"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
