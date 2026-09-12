import type { DiscussionNewFormState } from "./discussion-new-portal";

export function discussionNewProgressPercent(state: DiscussionNewFormState): number {
  const checkpoints = [
    state.category !== "all",
    state.title.trim().length >= 3,
    state.body.trim().length >= 10,
    state.tags.length > 0,
    Boolean(state.linkedTribeId),
  ];
  const done = checkpoints.filter(Boolean).length;
  return Math.round((done / checkpoints.length) * 100);
}
