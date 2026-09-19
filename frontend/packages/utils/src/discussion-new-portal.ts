import type { DiscussionCategoryId, DiscussionThread } from "@yunicity/types";

import { discussionTagTone } from "./discussions-portal";
import {
  DISCUSSIONS_CATEGORY_ALL,
  DISCUSSIONS_CATEGORY_CULTURE,
  DISCUSSIONS_CATEGORY_NEWS,
  DISCUSSIONS_CATEGORY_QUESTIONS,
  DISCUSSIONS_CATEGORY_SPORTS,
  DISCUSSIONS_CATEGORY_TIPS,
  DISCUSSIONS_CATEGORY_TRIBES,
} from "./discussions-portal-labels";
import {
  DISCUSSION_BODY_MAX,
  DISCUSSION_TAGS_MAX,
  DISCUSSION_TITLE_MAX,
} from "./discussion-new-portal-labels";

export type DiscussionNewCategoryCard = {
  id: DiscussionCategoryId;
  label: string;
};

export const DISCUSSION_NEW_CATEGORY_CARDS: DiscussionNewCategoryCard[] = [
  { id: "all", label: DISCUSSIONS_CATEGORY_ALL },
  { id: "questions", label: DISCUSSIONS_CATEGORY_QUESTIONS },
  { id: "tips", label: DISCUSSIONS_CATEGORY_TIPS },
  { id: "news", label: DISCUSSIONS_CATEGORY_NEWS },
  { id: "culture", label: DISCUSSIONS_CATEGORY_CULTURE },
  { id: "sports", label: DISCUSSIONS_CATEGORY_SPORTS },
  { id: "tribes", label: DISCUSSIONS_CATEGORY_TRIBES },
];

export const DISCUSSION_NEW_SELECTABLE_CATEGORIES = DISCUSSION_NEW_CATEGORY_CARDS.filter(
  (card) => card.id !== "all",
);

export type DiscussionNewExample = {
  title: string;
  categoryId: string;
  categoryLabel: string;
  toneClass: string;
};

export function buildDiscussionNewExamples(threads: DiscussionThread[]): DiscussionNewExample[] {
  return threads.slice(0, 4).map((thread) => {
    const categoryId = thread.category_ids[0] ?? "questions";
    return {
      title: thread.discussion_title,
      categoryId,
      categoryLabel: thread.category_labels[0] ?? DISCUSSIONS_CATEGORY_QUESTIONS,
      toneClass: discussionTagTone(categoryId),
    };
  });
}

export type DiscussionNewFormState = {
  category: DiscussionCategoryId;
  title: string;
  body: string;
  tags: string[];
  linkedTribeId: string | null;
  mediaUrl: string | null;
};

export function validateDiscussionNewForm(state: DiscussionNewFormState): string | null {
  if (state.title.trim().length < 3) {
    return "Le titre doit contenir au moins 3 caractères.";
  }
  if (state.title.trim().length > DISCUSSION_TITLE_MAX) {
    return `Le titre ne peut pas dépasser ${DISCUSSION_TITLE_MAX} caractères.`;
  }
  if (state.body.trim().length < 10) {
    return "La description doit contenir au moins 10 caractères.";
  }
  if (state.body.trim().length > DISCUSSION_BODY_MAX) {
    return `La description ne peut pas dépasser ${DISCUSSION_BODY_MAX} caractères.`;
  }
  if (state.tags.length > DISCUSSION_TAGS_MAX) {
    return `Maximum ${DISCUSSION_TAGS_MAX} tags.`;
  }
  return null;
}

export function insertTextAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string,
): { next: string; cursor: number } {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const next = `${before}${insert}${after}`;
  return { next, cursor: selectionStart + [...insert].length };
}

export function wrapEditorSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string,
): { next: string; cursor: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  if (selected) {
    const next = `${before}${wrapper}${selected}${wrapper}${after}`;
    return { next, cursor: selectionEnd + wrapper.length * 2 };
  }
  const next = `${before}${wrapper}${wrapper}${after}`;
  return { next, cursor: selectionStart + wrapper.length };
}

export function prefixEditorLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): { next: string; cursor: number } {
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);
  const block = selected || "";
  const lines = block.split("\n").map((line) => (line ? `${prefix}${line}` : line));
  const next = `${before}${lines.join("\n")}${after}`;
  return { next, cursor: before.length + lines.join("\n").length };
}
