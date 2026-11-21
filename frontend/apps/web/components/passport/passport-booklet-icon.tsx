type PassportBookletIconProps = {
  className?: string;
  /** `hero` : carnet immersif (globe + Yunicity). `mark` : compact pour nav / QR. */
  variant?: "hero" | "mark";
};

/**
 * Carnet Passport maquette — rectangle arrondi, globe, wordmark Yunicity.
 */
export function PassportBookletIcon({ className, variant = "mark" }: PassportBookletIconProps) {
  if (variant === "hero") {
    return (
      <svg
        viewBox="0 0 80 108"
        className={className}
        fill="none"
        aria-hidden
      >
        <rect x="4" y="4" width="72" height="100" rx="10" stroke="currentColor" strokeWidth="3.2" />
        <path d="M18 16h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="44" r="16" stroke="currentColor" strokeWidth="2.6" />
        <ellipse cx="40" cy="44" rx="7" ry="16" stroke="currentColor" strokeWidth="2" />
        <path d="M24 44h32" stroke="currentColor" strokeWidth="2" />
        <path d="M26 36h28M26 52h28" stroke="currentColor" strokeWidth="1.6" />
        <text
          x="40"
          y="86"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          Yunicity
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4 shrink-0"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="3" width="12" height="18" rx="2.2" />
      <path d="M8.5 6.2h7" />
      <circle cx="12" cy="11" r="3.1" />
      <ellipse cx="12" cy="11" rx="1.35" ry="3.1" />
      <path d="M9 11h6" />
      <path d="M9.2 16.6h5.6" />
    </svg>
  );
}

export function PassportBookletMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex h-full items-center justify-center rounded-[1.15rem] border border-white/25 bg-white/10 backdrop-blur-[2px] ${
        compact ? "min-h-[6.75rem] px-2 py-3" : "min-h-[9.5rem] px-4 py-5"
      }`}
    >
      <PassportBookletIcon
        variant="hero"
        className={compact ? "h-[5.5rem] w-[4.1rem] text-white" : "h-[7.25rem] w-[5.4rem] text-white"}
      />
    </div>
  );
}
