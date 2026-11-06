"use client";

import {
  POST_NEW_MEDIA_MAKE_FIRST,
  POST_NEW_MEDIA_MOVE_BACKWARD,
  POST_NEW_MEDIA_MOVE_FORWARD,
  POST_NEW_MEDIA_REMOVE,
} from "@yunicity/utils";

/**
 * Menu d'un média — **c'est lui qui porte l'accessibilité** du
 * réordonnancement.
 *
 * ⚠️ Le glisser-déposer viendra en surcouche et ne doit **jamais** remplacer ce
 * menu : sans lui, réordonner devient impossible au clavier seul.
 */
export function NewPostMediaItemMenu({
  isFirst,
  isLast,
  onForward,
  onBackward,
  onMakeFirst,
  onRemove,
}: {
  isFirst: boolean;
  isLast: boolean;
  onForward: () => void;
  onBackward: () => void;
  onMakeFirst: () => void;
  onRemove: () => void;
}) {
  const classe =
    "flex min-h-11 w-full items-center px-3 text-left text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-yunicity-primary disabled:text-neutral-400 disabled:hover:bg-transparent";

  return (
    <div className="absolute right-1 top-11 z-10 w-44 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
      <button type="button" className={classe} disabled={isFirst} onClick={onForward}>
        {POST_NEW_MEDIA_MOVE_FORWARD}
      </button>
      <button type="button" className={classe} disabled={isLast} onClick={onBackward}>
        {POST_NEW_MEDIA_MOVE_BACKWARD}
      </button>
      <button type="button" className={classe} disabled={isFirst} onClick={onMakeFirst}>
        {POST_NEW_MEDIA_MAKE_FIRST}
      </button>
      <button type="button" className={`${classe} text-red-600`} onClick={onRemove}>
        {POST_NEW_MEDIA_REMOVE}
      </button>
    </div>
  );
}
