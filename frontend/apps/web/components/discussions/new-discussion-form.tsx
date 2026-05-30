"use client";

import type { DiscussionCategoryId, Tribe } from "@yunicity/types";
import {
  DISCUSSION_BODY_MAX,
  DISCUSSION_NEW_BODY_PLACEHOLDER,
  DISCUSSION_NEW_CANCEL,
  DISCUSSION_NEW_PUBLISH,
  DISCUSSION_NEW_PUBLISHING,
  DISCUSSION_NEW_STEP1_HINT,
  DISCUSSION_NEW_STEP1_TITLE,
  DISCUSSION_NEW_STEP2_HINT,
  DISCUSSION_NEW_STEP2_TITLE,
  DISCUSSION_NEW_STEP3_HINT,
  DISCUSSION_NEW_STEP3_TITLE,
  DISCUSSION_NEW_STEP4_HINT,
  DISCUSSION_NEW_STEP4_OPTIONAL,
  DISCUSSION_NEW_STEP4_TITLE,
  DISCUSSION_NEW_STEP5_HINT,
  DISCUSSION_NEW_STEP5_OPTIONAL,
  DISCUSSION_NEW_STEP5_TITLE,
  DISCUSSION_NEW_TAG_PLACEHOLDER,
  DISCUSSION_NEW_TITLE_PLACEHOLDER,
  DISCUSSION_NEW_TRIBE_PLACEHOLDER,
  DISCUSSION_TAGS_MAX,
  DISCUSSION_TITLE_MAX,
  DISCUSSION_NEW_CATEGORY_CARDS,
  prefixEditorLines,
  wrapEditorSelection,
} from "@yunicity/utils";
import {
  Bold,
  ChevronRight,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Newspaper,
  Palette,
  Plus,
  Send,
  Smile,
  Tag,
  Underline,
  Users,
  X,
  Footprints,
} from "lucide-react";
import { useRef, useState } from "react";

const CATEGORY_ICONS: Record<DiscussionCategoryId, typeof Globe> = {
  all: Globe,
  questions: HelpCircle,
  tips: Tag,
  news: Newspaper,
  culture: Palette,
  sports: Footprints,
  tribes: Users,
};

type NewDiscussionFormProps = {
  memberTribes: Tribe[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (payload: {
    category: DiscussionCategoryId;
    title: string;
    body: string;
    tags: string[];
    linkedTribeId: string | null;
    mediaUrl: string | null;
  }) => Promise<void>;
};

export function NewDiscussionForm({
  memberTribes,
  submitting,
  error,
  onCancel,
  onSubmit,
}: NewDiscussionFormProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [category, setCategory] = useState<DiscussionCategoryId>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkedTribeId, setLinkedTribeId] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || tags.length >= DISCUSSION_TAGS_MAX) return;
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function applyEditorAction(action: "bold" | "italic" | "underline" | "ul" | "ol" | "link" | "emoji") {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let result = { next: body, cursor: end };

    if (action === "bold") result = wrapEditorSelection(body, start, end, "**");
    if (action === "italic") result = wrapEditorSelection(body, start, end, "*");
    if (action === "underline") result = wrapEditorSelection(body, start, end, "__");
    if (action === "ul") result = prefixEditorLines(body, start, end, "• ");
    if (action === "ol") result = prefixEditorLines(body, start, end, "1. ");
    if (action === "link") {
      const url = window.prompt("URL du lien");
      if (url) {
        const selected = body.slice(start, end) || "lien";
        result = {
          next: `${body.slice(0, start)}[${selected}](${url})${body.slice(end)}`,
          cursor: start + selected.length + url.length + 4,
        };
      } else {
        return;
      }
    }
    if (action === "emoji") {
      result = {
        next: `${body.slice(0, start)}🙂${body.slice(end)}`,
        cursor: start + 2,
      };
    }

    setBody(result.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursor, result.cursor);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSubmit({
      category,
      title: title.trim(),
      body: body.trim(),
      tags,
      linkedTribeId: linkedTribeId || null,
      mediaUrl,
    });
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-8">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={1} title={DISCUSSION_NEW_STEP1_TITLE} hint={DISCUSSION_NEW_STEP1_HINT} />
        <div className="relative mt-5 -mx-1">
          <div className="overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-3 pr-10">
              {DISCUSSION_NEW_CATEGORY_CARDS.map((card) => {
                const Icon = CATEGORY_ICONS[card.id];
                const active = category === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setCategory(card.id)}
                    className={`flex w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition ${
                      active
                        ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                    <span className="text-center text-xs font-semibold leading-tight">{card.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <span
            className="pointer-events-none absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={2} title={DISCUSSION_NEW_STEP2_TITLE} hint={DISCUSSION_NEW_STEP2_HINT} />
        <div className="relative mt-4">
          <input
            type="text"
            value={title}
            maxLength={DISCUSSION_TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={DISCUSSION_NEW_TITLE_PLACEHOLDER}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-neutral-400">
            {title.length}/{DISCUSSION_TITLE_MAX}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <StepHeader step={3} title={DISCUSSION_NEW_STEP3_TITLE} hint={DISCUSSION_NEW_STEP3_HINT} />
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
          <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-2">
            <EditorTool label="Gras" onClick={() => applyEditorAction("bold")}>
              <Bold className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Italique" onClick={() => applyEditorAction("italic")}>
              <Italic className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Souligné" onClick={() => applyEditorAction("underline")}>
              <Underline className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Liste à puces" onClick={() => applyEditorAction("ul")}>
              <List className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Liste numérotée" onClick={() => applyEditorAction("ol")}>
              <ListOrdered className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Lien" onClick={() => applyEditorAction("link")}>
              <Link2 className="h-4 w-4" />
            </EditorTool>
            <EditorTool
              label="Image"
              onClick={() => {
                const url = window.prompt("URL de l'image");
                if (url?.trim()) setMediaUrl(url.trim());
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </EditorTool>
            <EditorTool label="Emoji" onClick={() => applyEditorAction("emoji")}>
              <Smile className="h-4 w-4" />
            </EditorTool>
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            maxLength={DISCUSSION_BODY_MAX}
            onChange={(event) => setBody(event.target.value)}
            placeholder={DISCUSSION_NEW_BODY_PLACEHOLDER}
            rows={8}
            className="w-full resize-y px-4 py-3 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2 text-xs text-neutral-400">
            <span>{mediaUrl ? "Image jointe" : ""}</span>
            <span>
              {body.length}/{DISCUSSION_BODY_MAX}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
          <StepHeader
            step={4}
            title={DISCUSSION_NEW_STEP4_TITLE}
            hint={DISCUSSION_NEW_STEP4_HINT}
            optional={DISCUSSION_NEW_STEP4_OPTIONAL}
          />
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={DISCUSSION_NEW_TAG_PLACEHOLDER}
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
            />
            <button
              type="button"
              onClick={() => addTag(tagInput)}
              disabled={tags.length >= DISCUSSION_TAGS_MAX}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary text-white transition hover:bg-yunicity-primary/90 disabled:opacity-50"
              aria-label="Ajouter le tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-semibold text-yunicity-primary"
                  >
                    {tag}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
          <StepHeader
            step={5}
            title={DISCUSSION_NEW_STEP5_TITLE}
            hint={DISCUSSION_NEW_STEP5_HINT}
            optional={DISCUSSION_NEW_STEP5_OPTIONAL}
          />
          <select
            value={linkedTribeId}
            onChange={(event) => setLinkedTribeId(event.target.value)}
            className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
          >
            <option value="">{DISCUSSION_NEW_TRIBE_PLACEHOLDER}</option>
            {memberTribes.map((tribe) => (
              <option key={tribe.id} value={tribe.id}>
                {tribe.name}
              </option>
            ))}
          </select>
        </section>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {DISCUSSION_NEW_CANCEL}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 disabled:opacity-60"
        >
          {submitting ? DISCUSSION_NEW_PUBLISHING : DISCUSSION_NEW_PUBLISH}
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

function StepHeader({
  step,
  title,
  hint,
  optional,
}: {
  step: number;
  title: string;
  hint: string;
  optional?: string;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-neutral-900">
        <span className="mr-2 text-yunicity-primary">{step}.</span>
        {title}
        {optional ? (
          <span className="ml-1 text-sm font-medium text-neutral-500">{optional}</span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{hint}</p>
    </div>
  );
}

function EditorTool({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-white hover:text-yunicity-primary"
    >
      {children}
    </button>
  );
}
