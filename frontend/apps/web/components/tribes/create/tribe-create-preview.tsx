"use client";

import type { TribeCreateDraft } from "@yunicity/utils";
import {
  TRIBE_CREATE_PREVIEW_CATEGORY,
  TRIBE_CREATE_PREVIEW_DESC,
  TRIBE_CREATE_PREVIEW_MEMBERS,
  TRIBE_CREATE_PREVIEW_NAME,
  TRIBE_CREATE_PREVIEW_TITLE,
  resolveTribeEditorialImage,
  tribeCategoryLabel,
  tribeCreateVisibilityLabel,
} from "@yunicity/utils";

type TribeCreatePreviewProps = {
  draft: TribeCreateDraft;
};

function resolvePreviewCoverUrl(draft: TribeCreateDraft): string | null {
  const customUrl = draft.coverImageUrl.trim();
  if (customUrl) {
    return customUrl;
  }
  if (!draft.category.trim()) {
    return null;
  }
  return resolveTribeEditorialImage({
    id: "preview",
    slug: "preview",
    name: draft.name.trim() || TRIBE_CREATE_PREVIEW_NAME,
    description: draft.description.trim() || TRIBE_CREATE_PREVIEW_DESC,
    city: draft.city,
    category: draft.category,
    visibility: draft.visibility,
    persistence_kind: "default",
    cover_image_url: null,
    is_featured: false,
    member_limit: 80,
    active_member_count: 1,
    is_archived: false,
    viewer_is_member: true,
    viewer_role: "owner",
    viewer_notifications_muted: false,
    created_at: "",
    updated_at: "",
  });
}

export function TribeCreatePreview({ draft }: TribeCreatePreviewProps) {
  const coverUrl = resolvePreviewCoverUrl(draft);
  const name = draft.name.trim() || TRIBE_CREATE_PREVIEW_NAME;
  const description = draft.description.trim() || TRIBE_CREATE_PREVIEW_DESC;
  const categoryLabel = draft.category.trim()
    ? tribeCategoryLabel(draft.category)
    : TRIBE_CREATE_PREVIEW_CATEGORY;

  return (
    <aside className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
        {TRIBE_CREATE_PREVIEW_TITLE}
      </p>
      <article className="mt-4 overflow-hidden rounded-xl border border-neutral-100">
        <div className="relative h-36 bg-neutral-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end bg-gradient-to-br from-[#EEF0FF] to-neutral-100 p-4">
              <p className="text-sm font-semibold text-neutral-700">{name}</p>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs text-neutral-500">
            {categoryLabel} · {tribeCreateVisibilityLabel(draft.visibility)}
          </p>
          <h3 className="text-lg font-bold text-neutral-900">{name}</h3>
          <p className="line-clamp-4 text-sm leading-relaxed text-neutral-600">{description}</p>
          <p className="text-xs text-neutral-500">{TRIBE_CREATE_PREVIEW_MEMBERS} · 1</p>
        </div>
      </article>
    </aside>
  );
}
