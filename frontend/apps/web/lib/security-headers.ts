/**
 * En-têtes de sécurité HTTP de l'application web (AIF SEC-01).
 *
 * Aucun en-tête de sécurité n'était émis : ni `headers()` dans `next.config.ts`,
 * ni `middleware.ts`. Mesuré sur Preview comme en production : 0 des 6 attendus.
 *
 * Ils vivent ici plutôt que dans `next.config.ts` pour être testables — le
 * runner vitest de `apps/web` couvre `lib/**`, pas la configuration Next.
 *
 * DEUX PRUDENCES DÉLIBÉRÉES
 *
 * 1. HSTS n'est pas réversible côté navigateur : une fois la directive mise en
 *    cache, elle s'applique jusqu'à expiration de `max-age`, quoi que réponde
 *    ensuite le serveur. D'où une durée volontairement COURTE, sans `preload`
 *    (qui suppose une inscription quasi définitive dans les navigateurs) et
 *    sans `includeSubDomains` (l'apex partage son domaine avec `api.` et
 *    `admin.`, qui ne sont pas couverts par cette vague). Allonger la durée
 *    plus tard sera une décision distincte, prise une fois la beta stabilisée.
 *
 * 2. La CSP est en REPORT-ONLY : elle signale sans bloquer, donc elle ne peut
 *    casser aucune ressource existante. Les origines listées sont celles
 *    réellement utilisées (cartes OpenStreetMap et Google, agenda Google,
 *    médias distants), pour que les rapports soient exploitables plutôt que
 *    noyés. `'unsafe-inline'` et `'unsafe-eval'` restent tolérés : Next.js en
 *    dépend pour l'hydratation, et s'en passer demande une stratégie de nonce
 *    — hors périmètre de cette vague.
 */

/** Durée courte et assumée : la directive s'efface d'elle-même en une heure. */
export const HSTS_MAX_AGE_SECONDS = 3600;

/** Origines externes réellement chargées par l'application. */
const ORIGINES_CARTES = ["https://maps.googleapis.com", "https://maps.gstatic.com"];
const ORIGINES_IFRAMES = [
  "https://www.openstreetmap.org",
  "https://www.google.com",
  "https://calendar.google.com",
];

const DIRECTIVES_CSP: readonly string[] = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js injecte des scripts inline pour l'hydratation : sans nonce, les
  // retirer produirait un rapport de violation à chaque page, sans valeur.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ORIGINES_CARTES.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Les médias distants sont déjà bornés par `images.remotePatterns` côté Next.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' https: ${ORIGINES_CARTES.join(" ")}`,
  `frame-src 'self' ${ORIGINES_IFRAMES.join(" ")}`,
  "worker-src 'self' blob:",
];

export const CSP_REPORT_ONLY = DIRECTIVES_CSP.join("; ");

/**
 * `payment` est refusé : le paiement en ligne est désactivé (PAY-01-GUARD).
 * `geolocation`, `camera` et `microphone` restent ouverts à l'origine même —
 * la carte, le fil territorial et la capture vidéo en dépendent.
 */
export const PERMISSIONS_POLICY = [
  "geolocation=(self)",
  "camera=(self)",
  "microphone=(self)",
  "payment=()",
  "usb=()",
  "serial=()",
  "midi=()",
].join(", ");

export type SecurityHeader = { key: string; value: string };

export const SECURITY_HEADERS: readonly SecurityHeader[] = [
  { key: "Strict-Transport-Security", value: `max-age=${HSTS_MAX_AGE_SECONDS}` },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

/**
 * Routes dont l'URL porte un secret en paramètre — AUTH-02A / AUTH-01 / AUTH-03.
 *
 * `strict-origin-when-cross-origin` ne transmet déjà que l'origine à un tiers,
 * donc le jeton ne franchit pas la frontière. Il reste en revanche transmis
 * ENTIER lors d'une navigation de même origine, et c'est suffisant pour qu'il
 * atterrisse dans un journal applicatif ou un outil de mesure interne.
 *
 * `no-referrer` ferme les deux cas, et ne coûte rien sur des pages qui n'ont
 * aucun besoin de connaître leur provenance.
 */
export const TOKEN_BEARING_PATHS: readonly string[] = [
  "/login/cancel-deletion",
  "/login/verify-email",
  "/login/reset-password",
];

export const NO_REFERRER_HEADER: SecurityHeader = {
  key: "Referrer-Policy",
  value: "no-referrer",
};
