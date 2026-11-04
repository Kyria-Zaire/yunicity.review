/**
 * FEED-NEW-UX-01 — clé d'idempotence d'une tentative de publication.
 *
 * `crypto.randomUUID()` n'existe qu'en CONTEXTE SÉCURISÉ. Il est donc absent en
 * `http://` sur une IP de réseau local — exactement le cas des essais depuis un
 * téléphone, et exactement le réseau instable que la clé doit protéger. Sans
 * repli, l'écran plantait là où il devait être le plus robuste.
 *
 * ⛔ Jamais `Math.random()` : une clé prédictible laisserait un tiers provoquer
 * un conflit sur la publication d'autrui.
 */

/**
 * UUID v4 tiré d'une source cryptographique, ou `null` si le navigateur n'en
 * offre aucune.
 *
 * `null` est une dégradation EXPLICITE : le champ part absent et le serveur
 * retombe sur son comportement d'avant (contrat §3.1). Inventer une clé faible
 * serait pire que ne pas en envoyer.
 */
export function newClientRequestId(): string | null {
  const source: Crypto | undefined = globalThis.crypto;
  if (typeof source?.randomUUID === "function") return source.randomUUID();
  if (typeof source?.getRandomValues === "function") {
    return uuidV4From(source.getRandomValues(new Uint8Array(16)));
  }
  return null;
}

/** Pose la version (4) et la variante (RFC 4122) sur 16 octets aléatoires. */
function uuidV4From(octets: Uint8Array): string {
  const copie = Uint8Array.from(octets);
  copie[6] = ((copie[6] ?? 0) & 0x0f) | 0x40;
  copie[8] = ((copie[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(copie, (octet) => octet.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
