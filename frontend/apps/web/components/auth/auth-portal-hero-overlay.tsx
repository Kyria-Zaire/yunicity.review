type AuthPortalHeroOverlayProps = {
  variant?: "desktop" | "compact";
};

/** Voile bleu semi-transparent pour garantir la lisibilité du copy blanc sur la photo hero. */
export function AuthPortalHeroOverlay({ variant = "desktop" }: AuthPortalHeroOverlayProps) {
  if (variant === "compact") {
    return (
      <>
        <div className="absolute inset-0 bg-[#1E4BFF]/42" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0B2FD9]/92 via-[#1E4BFF]/78 to-[#2563EB]/48"
          aria-hidden
        />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-[#1E4BFF]/40" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0B2FD9]/92 via-[#1E4BFF]/72 to-[#3B82F6]/22"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0B2FD9]/60 via-[#0B2FD9]/15 to-[#0B2FD9]/35"
        aria-hidden
      />
    </>
  );
}
