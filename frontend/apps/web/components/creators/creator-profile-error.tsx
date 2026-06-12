import { CREATOR_PROFILE_ERROR, CREATOR_PROFILE_RETRY } from "@yunicity/utils";

type CreatorProfileErrorProps = {
  onRetry: () => void;
};

export function CreatorProfileError({ onRetry }: CreatorProfileErrorProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm text-red-800">{CREATOR_PROFILE_ERROR}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {CREATOR_PROFILE_RETRY}
      </button>
    </div>
  );
}
