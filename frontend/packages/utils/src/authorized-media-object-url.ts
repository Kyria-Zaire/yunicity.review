/**
 * Compteur de références pour les object URLs média authentifiées (MEDIA-01B).
 *
 * La carte et la visionneuse peuvent partager une même URL : on ne révoque que
 * lorsque plus aucun consommateur ne la détient.
 */

const retains = new Map<string, number>();

export function retainAuthorizedObjectUrl(url: string): void {
  const trimmed = url.trim();
  if (!trimmed.startsWith("blob:")) return;
  retains.set(trimmed, (retains.get(trimmed) ?? 0) + 1);
}

export function releaseAuthorizedObjectUrl(url: string | null | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed || !trimmed.startsWith("blob:")) return;
  const current = retains.get(trimmed) ?? 0;
  if (current <= 1) {
    retains.delete(trimmed);
    URL.revokeObjectURL(trimmed);
    return;
  }
  retains.set(trimmed, current - 1);
}

/** Test-only — ne pas utiliser en production. */
export function __authorizedObjectUrlRetainCountForTests(url: string): number {
  return retains.get(url) ?? 0;
}
