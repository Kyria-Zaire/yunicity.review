export const PUBLIC_HOME_COPY = {
  heroTitle: "Reims, plus proche de vous.",
  heroBody:
    "Découvrez les quartiers, événements, lieux et communautés qui font vivre votre ville.",
  headerLogin: "Se connecter",
  headerRegister: "Créer un compte",
  heroDiscover: "Découvrir Reims",
  heroRegister: "Créer mon compte",
  heroExistingAccount: "J’ai déjà un compte",
  previewsEyebrow: "Explorer Reims",
  privacy: "Confidentialité",
  terms: "Conditions générales",
} as const;

export const PUBLIC_HOME_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  discover: "/neighborhoods",
  neighborhoods: "/neighborhoods",
  sortir: "/sortir",
  places: "/places",
  privacy: "/legal/confidentialite",
  terms: "/legal/conditions-generales",
} as const;

export const PUBLIC_HOME_PREVIEWS = [
  {
    id: "neighborhoods",
    title: "Quartiers",
    href: PUBLIC_HOME_ROUTES.neighborhoods,
    body: "Explorez les quartiers de Reims et la vie de leurs habitants.",
    icon: "neighborhoods",
  },
  {
    id: "sortir",
    title: "Sortir à Reims",
    href: PUBLIC_HOME_ROUTES.sortir,
    body: "Découvrez les événements, activités et bons plans.",
    icon: "sortir",
  },
  {
    id: "places",
    title: "Lieux",
    href: PUBLIC_HOME_ROUTES.places,
    body: "Trouvez les lieux incontournables et les pépites locales.",
    icon: "places",
  },
] as const;

export const PUBLIC_HOME_FORBIDDEN_COPY = [
  "Statut API",
  "Erreur API",
  "Erreur API (404)",
  "Actualiser",
] as const;

export type PublicHomePreview = (typeof PUBLIC_HOME_PREVIEWS)[number];
