/**
 * Registre z-index chrome citoyen — CREATORS-UX-02A / CREATORS-ARCH-01.
 * Source unique : ne pas disperser de z-[…] arbitraires hors de cette table.
 */
export const Z_INDEX = {
  /** CitizenTopNav, viewport vidéo mobile */
  CHROME: 40,
  /** Header overlay /videos */
  VIDEO_HEADER: 50,
  /** Toast partage vidéo */
  VIDEO_HINT: 55,
  /** FAB Create Hub (au-dessus player, sous sheets hub) */
  CREATE_FAB: 65,
  /** FAB Menu Yunicity (mobile, droite) */
  YUNICITY_MENU_FAB: 65,
  /** Commentaires vidéo */
  VIDEO_COMMENTS: 60,
  /** Signalement vidéo, modales quartier */
  VIDEO_REPORT: 70,
  /** Create Hub sheet / dialog */
  CREATE_HUB: 75,
} as const;

export type ZIndexLayer = (typeof Z_INDEX)[keyof typeof Z_INDEX];
