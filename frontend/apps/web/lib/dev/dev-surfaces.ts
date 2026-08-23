/**
 * Surfaces de diagnostic réservées au développement local.
 * Jamais exposées en production (NODE_ENV=production).
 */
export function isDevOnlySurfaceEnabled(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "production";
}
