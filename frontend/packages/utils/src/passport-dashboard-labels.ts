/** Copy UI — dashboard Passport citoyen (WEB-PASSPORT-01A). */

export const PASSPORT_DASHBOARD_TITLE = "Passport";
export const PASSPORT_DASHBOARD_SUBTITLE = "Votre parcours citoyen dans Reims.";

export const PASSPORT_NAV_OVERVIEW = "Vue d'ensemble";
export const PASSPORT_NAV_STATS = "Mes statistiques";
export const PASSPORT_NAV_BADGES = "Mes badges";
export const PASSPORT_NAV_PRIVILEGES = "Mes privilèges";
export const PASSPORT_NAV_HISTORY = "Historique d'activité";
export const PASSPORT_NAV_TIPS = "Conseils personnalisés";

export const PASSPORT_AMBASSADOR_TITLE = "Devenez Ambassadeur";
export const PASSPORT_AMBASSADOR_BODY =
  "Participez activement à la vie locale et accédez à des privilèges exclusifs.";
export const PASSPORT_AMBASSADOR_CTA = "En savoir plus";

export const PASSPORT_HERO_LEVEL_LABEL = "NIVEAU ACTUEL";
export const PASSPORT_HERO_POINTS_TITLE = "Points Yunicity";
export const PASSPORT_HERO_POINTS_HINT = "Gagnez des points en participant à la vie locale.";
export const PASSPORT_HERO_NEXT_PREFIX = "Prochain niveau :";

export const PASSPORT_ACHIEVEMENTS_TITLE = "Vos accomplissements";
export const PASSPORT_PROGRESSION_TITLE = "Votre progression";
export const PASSPORT_BADGES_TITLE = "Badges récents";
export const PASSPORT_BADGES_VIEW_ALL = "Voir tous mes badges";
export const PASSPORT_BADGES_EMPTY =
  "Vos premiers badges apparaîtront ici au fil de vos découvertes locales.";

export const PASSPORT_ACTIVATE_TITLE = "Activez votre passeport Yunicity";
export const PASSPORT_ACTIVATE_BODY =
  "Identité citoyenne locale, progression douce et privilèges partenaires — sans paiement.";
export const PASSPORT_ACTIVATE_CTA = "Activer mon passeport";

export const PASSPORT_LOADING = "Chargement de votre passeport…";

export type PassportNavItem = {
  href: string;
  label: string;
  match?: "prefix" | "exact";
};

export const PASSPORT_TOP_NAV_ITEMS: PassportNavItem[] = [
  { href: "/passport", label: "Passport", match: "prefix" },
];

export const PASSPORT_OFFERS_SECTION_TITLE = "Avantages partenaires";
export const PASSPORT_OFFERS_SECTION_SUBTITLE =
  "Offres locales liées à votre passeport citoyen.";
export const PASSPORT_OFFERS_EMPTY = "Aucune offre partenaire pour le moment.";
export const PASSPORT_OFFERS_CTA_PARTNER = "Voir le partenaire";
export const PASSPORT_OFFERS_CTA_CONDITIONS = "Conditions";
