"use client";

import type { VideoGoCta } from "@yunicity/utils";
import { yunicityBtnPrimary } from "@/lib/brand-classes";
import Link from "next/link";

export function LocalVideoGoCta({ cta }: { cta: VideoGoCta }) {
  return (
    <div className="space-y-1.5">
      <p className="text-center text-xs font-medium text-white/85">{cta.microCopy}</p>
      <Link href={cta.href} className={`block w-full text-center ${yunicityBtnPrimary}`}>
        {cta.label}
      </Link>
    </div>
  );
}
