/** Conseils points Yunicity — Explorer /search (données produit réelles, TICKET-502). */

export type ExplorerPointsTip = {
  id: string;
  title: string;
  body: string;
  /** Indication de gain documentée — pas de promesse inventée. */
  pointsHint: string;
  href: string;
};

export const SEARCH_EXPLORER_POINTS_RAIL_TITLE = "Gagnez des points Yunicity";
export const SEARCH_EXPLORER_POINTS_RAIL_SUBTITLE =
  "Participez à la vie locale à Reims — chaque geste compte pour votre Passport.";
export const SEARCH_EXPLORER_POINTS_RAIL_CTA = "Voir mon Passport";

/**
 * Mécaniques alignées sur `docs/product/passport-levels.md` et parcours citoyen.
 * Pas de métriques fictives ni de classements.
 */
export const EXPLORER_POINTS_TIPS: ExplorerPointsTip[] = [
  {
    id: "activate-passport",
    title: "Activez votre Passport",
    body: "Votre identité citoyenne locale — gratuit, sans abonnement.",
    pointsHint: "Parcours débloqué",
    href: "/passport",
  },
  {
    id: "partner-stamp",
    title: "Visitez un partenaire",
    body: "Tamponnez chez un commerce ou lieu partenaire à Reims.",
    pointsHint: "+5 pts · tampon",
    href: "/passport",
  },
  {
    id: "redeem-offer",
    title: "Utilisez une offre locale",
    body: "Profitez d’un privilège partenaire depuis votre Passport.",
    pointsHint: "+10 pts · utilisation",
    href: "/passport",
  },
  {
    id: "flash-offer",
    title: "Saisissez une offre flash",
    body: "Les offres limitées dans le temps boostent votre engagement local.",
    pointsHint: "Offre limitée",
    href: "/passport",
  },
  {
    id: "local-post",
    title: "Partagez sur le fil local",
    body: "Un post citoyen sur votre quartier ou une sortie récente.",
    pointsHint: "+5 pts · publication",
    href: "/feed",
  },
  {
    id: "event-interest",
    title: "Marquez un moment qui vous intéresse",
    body: "Construisez votre agenda des sorties à venir.",
    pointsHint: "Engagement local",
    href: "/events",
  },
  {
    id: "join-tribe",
    title: "Rejoignez une tribu",
    body: "Rencontrez des voisins autour d’une passion commune.",
    pointsHint: "Communauté",
    href: "/tribes",
  },
  {
    id: "explore-neighborhood",
    title: "Explorez un quartier",
    body: "Découvrez les morceaux humains de Reims — tampons de passage.",
    pointsHint: "+5 pts · tampon",
    href: "/neighborhoods",
  },
  {
    id: "discover-place",
    title: "Découvrez un lieu culturel",
    body: "Parcourez les adresses locales et enrichissez votre carte.",
    pointsHint: "Exploration",
    href: "/places",
  },
  {
    id: "level-silver",
    title: "Visez le niveau Silver",
    body: "Votre réputation locale grandit avec vos gestes réguliers.",
    pointsHint: "Palier Silver · 25+",
    href: "/passport",
  },
];

export function explorerPointsTipsForCarousel(): ExplorerPointsTip[] {
  return EXPLORER_POINTS_TIPS;
}
