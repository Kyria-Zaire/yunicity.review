"use client";

import {
  YUNICITY_LOGO_SIZES,
  YUNICITY_MASCOT_ALT,
  YUNICITY_MASCOT_PATH,
  YUNICITY_WORDMARK,
  type YunicityLogoSize,
} from "@yunicity/utils";
import Image from "next/image";
import Link from "next/link";

type YunicityLogoProps = {
  size?: YunicityLogoSize;
  showWordmark?: boolean;
  href?: string;
  className?: string;
  wordmarkClassName?: string;
  mascotClassName?: string;
  priority?: boolean;
};

export function YunicityLogo({
  size = "md",
  showWordmark = false,
  href,
  className = "",
  wordmarkClassName = "",
  mascotClassName = "",
  priority = false,
}: YunicityLogoProps) {
  const px = YUNICITY_LOGO_SIZES[size];

  const content = (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Image
        src={YUNICITY_MASCOT_PATH}
        alt={YUNICITY_MASCOT_ALT}
        width={px}
        height={px}
        priority={priority}
        className={`shrink-0 object-contain ${mascotClassName}`}
      />
      {showWordmark ? (
        <span
          className={`whitespace-nowrap text-xl font-bold tracking-tight text-neutral-900 ${wordmarkClassName}`}
        >
          {YUNICITY_WORDMARK}
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${YUNICITY_WORDMARK} — accueil`}
        className="inline-flex min-w-0 max-w-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
