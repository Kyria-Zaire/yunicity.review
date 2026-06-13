"use client";

import type { VideoGoCta } from "@yunicity/utils";
import { yunicityBtnPrimary } from "@/lib/brand-classes";
import Link from "next/link";

export function LocalVideoGoCta({ cta }: { cta: VideoGoCta }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium italic leading-snug text-white/90">{cta.microCopy}</p>
      <Link href={cta.href} className={`block w-full text-center ${yunicityBtnPrimary}`}>
        {cta.label}
      </Link>
    </div>
  );
}
