import {
  EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
} from "@yunicity/utils";

export const PUBLIC_HOME_COPY = {
  heroEyebrow: "LE RÉSEAU LOCAL DE VOTRE VILLE",
  heroTitle: "Votre ville, au même endroit.",
  heroBody: "Découvrez les quartiers, les tribus et les lieux qui font vivre Reims.",
  headerDiscover: "Découvrir Reims",
  headerHowItWorks: "Comment ça marche",
  headerLogin: "Se connecter",
  headerRegister: "Créer un compte",
  heroDiscover: "Découvrir Reims",
  heroRegister: "Créer mon compte",
  heroGuestNote: "Vous pouvez explorer sans créer de compte.",
  exploreTitle: "Explorez Reims dès maintenant",
  mobileExploreTitle: "Explorez Reims",
  footerHelp: "Aide",
  footerContact: "Contact",
  footerTerms: "Mentions légales",
  footerPrivacy: "Confidentialité",
} as const;

export const PUBLIC_HOME_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  discover: "/neighborhoods",
  neighborhoods: "/neighborhoods",
  tribes: "/tribes",
  places: "/places",
  howItWorks: "#comment-ca-marche",
  help: "/aide",
  explore: "#explore-reims",
  privacy: "/legal/confidentialite",
  terms: "/legal/conditions-generales",
  contact: "mailto:contact@yunicity.city",
} as const;

export const PUBLIC_HOME_HERO_IMAGES = {
  cathedral: NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  community: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  street: NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
} as const;

export const PUBLIC_HOME_FEATURES = [
  {
    id: "neighborhoods",
    title: "Quartiers",
    body: "Comprenez et explorez Reims quartier par quartier.",
    linkLabel: "Voir les quartiers",
    href: PUBLIC_HOME_ROUTES.neighborhoods,
    tone: "pink",
    icon: "neighborhoods",
  },
  {
    id: "tribes",
    title: "Tribus",
    body: "Trouvez les communautés et les passions qui vous ressemblent.",
    linkLabel: "Découvrir les tribus",
    href: PUBLIC_HOME_ROUTES.tribes,
    tone: "green",
    icon: "tribes",
  },
  {
    id: "places",
    title: "Lieux",
    body: "Repérez les adresses utiles et locales près de chez vous.",
    linkLabel: "Explorer les lieux",
    href: PUBLIC_HOME_ROUTES.places,
    tone: "orange",
    icon: "places",
  },
] as const;

export const PUBLIC_HOME_EXPLORE_CARDS = [
  {
    id: "neighborhoods",
    title: "Quartiers",
    body: "Comprenez la ville, quartier par quartier.",
    linkLabel: "Voir les quartiers",
    href: PUBLIC_HOME_ROUTES.neighborhoods,
    image: NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
    tone: "pink",
    icon: "neighborhoods",
  },
  {
    id: "tribes",
    title: "Tribus",
    body: "Trouvez les communautés qui vous ressemblent.",
    linkLabel: "Découvrir les tribus",
    href: PUBLIC_HOME_ROUTES.tribes,
    image: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
    tone: "green",
    icon: "tribes",
  },
  {
    id: "places",
    title: "Lieux",
    body: "Repérez les adresses utiles et locales.",
    linkLabel: "Explorer les lieux",
    href: PUBLIC_HOME_ROUTES.places,
    image: NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
    tone: "orange",
    icon: "places",
  },
] as const;

export const PUBLIC_HOME_MOBILE_EXPLORE_ITEMS = [
  {
    id: "neighborhoods",
    title: "Quartiers",
    subtitle: "Découvrez les quartiers de Reims",
    href: PUBLIC_HOME_ROUTES.neighborhoods,
    icon: "neighborhoods",
  },
  {
    id: "tribes",
    title: "Tribus",
    subtitle: "Trouvez les communautés près de chez vous",
    href: PUBLIC_HOME_ROUTES.tribes,
    icon: "tribes",
  },
  {
    id: "places",
    title: "Lieux",
    subtitle: "Repérez les adresses utiles et locales",
    href: PUBLIC_HOME_ROUTES.places,
    icon: "places",
  },
] as const;

/** @deprecated Utiliser PUBLIC_HOME_FEATURES — conservé pour tests de migration. */
export const PUBLIC_HOME_PREVIEWS = PUBLIC_HOME_EXPLORE_CARDS;

export const PUBLIC_HOME_FORBIDDEN_COPY = [
  "Statut API",
  "Erreur API",
  "Erreur API (404)",
  "Actualiser",
] as const;

export type PublicHomeFeature = (typeof PUBLIC_HOME_FEATURES)[number];
export type PublicHomeExploreCard = (typeof PUBLIC_HOME_EXPLORE_CARDS)[number];
export type PublicHomeMobileExploreItem = (typeof PUBLIC_HOME_MOBILE_EXPLORE_ITEMS)[number];
