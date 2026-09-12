/** Detail medium portrait : poster + frame en contain (720×1328 entier visible). */
export function isPortraitMediumDetail(
  mediaWidth: number | null | undefined,
  mediaHeight: number | null | undefined,
  portraitContain: boolean,
): boolean {
  if (!portraitContain) return false;
  const width = mediaWidth ?? 0;
  const height = mediaHeight ?? 0;
  return height > width;
}

/** Object-fit du lecteur detail medium : portrait entier (contain), paysage inchangé (cover). */
export function resolveMobileDetailObjectFit(
  mediaWidth: number | null | undefined,
  mediaHeight: number | null | undefined,
  portraitContain: boolean,
): "object-contain" | "object-cover" {
  if (!portraitContain) return "object-cover";
  const width = mediaWidth ?? 0;
  const height = mediaHeight ?? 0;
  return height > width ? "object-contain" : "object-cover";
}
