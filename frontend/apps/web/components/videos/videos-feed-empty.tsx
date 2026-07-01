import { LOCAL_VIDEO_EMPTY_MESSAGE, LOCAL_VIDEO_UPLOAD_PUBLISH_CTA } from "@yunicity/utils";
import Link from "next/link";

import { yunicityBtnPrimary, yunicityChipInactive } from "@/lib/brand-classes";

export function VideosFeedEmpty() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <p className="text-lg font-semibold text-neutral-900">{LOCAL_VIDEO_EMPTY_MESSAGE}</p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Link href="/videos/new" className={`block text-center ${yunicityBtnPrimary}`}>
          {LOCAL_VIDEO_UPLOAD_PUBLISH_CTA}
        </Link>
        <Link href="/sortir" className={`block rounded-xl border px-4 py-2.5 text-center text-sm font-semibold ${yunicityChipInactive}`}>
          Découvrir les événements
        </Link>
        <Link
          href="/neighborhoods"
          className={`block rounded-xl border px-4 py-2.5 text-center text-sm font-semibold ${yunicityChipInactive}`}
        >
          Explorer les quartiers
        </Link>
      </div>
    </div>
  );
}
