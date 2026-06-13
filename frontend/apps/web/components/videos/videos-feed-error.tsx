import { LOCAL_VIDEO_ERROR_MESSAGE, LOCAL_VIDEO_RETRY_LABEL } from "@yunicity/utils";

import { yunicityBtnPrimary } from "@/lib/brand-classes";

type VideosFeedErrorProps = {
  onRetry: () => void;
};

export function VideosFeedError({ onRetry }: VideosFeedErrorProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <p className="text-lg font-semibold text-neutral-900">{LOCAL_VIDEO_ERROR_MESSAGE}</p>
      <button type="button" onClick={onRetry} className={`mt-8 ${yunicityBtnPrimary}`}>
        {LOCAL_VIDEO_RETRY_LABEL}
      </button>
    </div>
  );
}
