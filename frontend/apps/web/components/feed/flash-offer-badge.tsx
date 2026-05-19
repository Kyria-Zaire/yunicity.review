import { FLASH_BADGE_LABEL, formatFlashTimerLabel, type FlashTimerInput } from "@yunicity/utils";

export function FlashOfferBadge({ offer }: { offer: FlashTimerInput | null | undefined }) {
  if (!offer?.is_flash) {
    return null;
  }
  const timer = formatFlashTimerLabel({
    is_flash: true,
    remaining_hours: offer.remaining_hours,
    remaining_minutes: offer.remaining_minutes,
    flash_ends_at: offer.flash_ends_at,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-yunicity-primary-soft px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
        {FLASH_BADGE_LABEL}
      </span>
      {timer ? <span className="text-xs text-neutral-500">{timer}</span> : null}
    </div>
  );
}
