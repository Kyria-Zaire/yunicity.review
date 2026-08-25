/**
 * Fixture image test-only pour les harnais publication.
 *
 * SVG opaque, deterministe, sans reseau : assez grand et contraste pour rendre
 * une visionneuse noire immediatement suspecte si l'image disparait.
 */
export const PUBLICATION_IMAGE_FIXTURE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f8fafc'/%3E%3Crect x='0' y='0' width='640' height='120' fill='%23333cff'/%3E%3Crect x='0' y='240' width='640' height='120' fill='%2316a34a'/%3E%3Ccircle cx='148' cy='180' r='72' fill='%23f97316'/%3E%3Crect x='272' y='130' width='240' height='100' rx='18' fill='%23111827'/%3E%3Cpath d='M312 205 382 145l70 60' fill='none' stroke='%23ffffff' stroke-width='18' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ctext x='320' y='300' text-anchor='middle' font-family='Arial,sans-serif' font-size='32' font-weight='700' fill='%23111827'%3EYunicity QA image%3C/text%3E%3C/svg%3E";
