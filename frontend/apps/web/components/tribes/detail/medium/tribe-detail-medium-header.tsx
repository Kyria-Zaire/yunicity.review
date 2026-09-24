"use client";

import { TRIBE_DETAIL_MEDIUM_BACK } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type TribeDetailMediumHeaderProps = {
  tribesHref: string;
};

export function TribeDetailMediumHeader({ tribesHref }: TribeDetailMediumHeaderProps) {
  return (
    <header className="flex items-center" data-tribe-detail-medium-header="">
      <Link
        href={tribesHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-yunicity-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {TRIBE_DETAIL_MEDIUM_BACK}
      </Link>
    </header>
  );
}
