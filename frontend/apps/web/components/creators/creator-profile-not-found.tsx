import {
  CREATOR_PROFILE_BACK,
  CREATOR_PROFILE_NOT_FOUND,
  getCreatorProfileBackHref,
} from "@yunicity/utils";
import Link from "next/link";

export function CreatorProfileNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-6 py-12 text-center">
      <p className="text-sm text-neutral-600">{CREATOR_PROFILE_NOT_FOUND}</p>
      <Link
        href={getCreatorProfileBackHref()}
        className="mt-4 inline-block text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {CREATOR_PROFILE_BACK}
      </Link>
    </div>
  );
}
