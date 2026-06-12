import {
  CREATOR_DETAIL_BACK,
  CREATOR_DETAIL_NOT_FOUND,
  getCreatorContentDetailBackHref,
} from "@yunicity/utils";
import Link from "next/link";

export function CreatorContentDetailNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-6 py-12 text-center">
      <p className="text-sm text-neutral-600">{CREATOR_DETAIL_NOT_FOUND}</p>
      <Link
        href={getCreatorContentDetailBackHref()}
        className="mt-4 inline-block text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {CREATOR_DETAIL_BACK}
      </Link>
    </div>
  );
}
