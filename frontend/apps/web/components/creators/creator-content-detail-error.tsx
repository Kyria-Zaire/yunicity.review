import {
  CREATOR_DETAIL_ERROR,
  CREATOR_DETAIL_RETRY,
  getCreatorContentDetailBackHref,
} from "@yunicity/utils";
import Link from "next/link";

type CreatorContentDetailErrorProps = {
  onRetry: () => void;
};

export function CreatorContentDetailError({ onRetry }: CreatorContentDetailErrorProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <p className="text-sm text-red-800">{CREATOR_DETAIL_ERROR}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {CREATOR_DETAIL_RETRY}
        </button>
        <Link
          href={getCreatorContentDetailBackHref()}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
        >
          Retour au Creator Hub
        </Link>
      </div>
    </div>
  );
}
