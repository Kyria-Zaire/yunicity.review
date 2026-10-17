import {
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_HERO_IMAGE,
  REGISTER_DESKTOP_ROUTES,
} from "@/lib/auth/register-desktop-contract";

/** Copy portail connexion — hero aligné maquette register, titres spécifiques login. */
export const LOGIN_PORTAL_COPY = {
  heroTitle: REGISTER_DESKTOP_COPY.heroTitle,
  heroSubtitle: REGISTER_DESKTOP_COPY.heroSubtitle,
  heroDiscover: REGISTER_DESKTOP_COPY.heroDiscover,
  heroCommunities: REGISTER_DESKTOP_COPY.heroCommunities,
  heroPassport: REGISTER_DESKTOP_COPY.heroPassport,
  heroPrivacy: REGISTER_DESKTOP_COPY.heroPrivacy,
  compactHeroSubtitle: REGISTER_DESKTOP_COPY.compactHeroSubtitle,
  compactHeroPrivacy: REGISTER_DESKTOP_COPY.compactHeroPrivacy,
  pageTitle: "Connectez-vous",
  pageSubtitle: "Retrouvez votre ville et vos communautés.",
  noAccount: "Pas encore de compte ?",
  registerLink: "Créer un compte",
  legalPrefix: REGISTER_DESKTOP_COPY.legalPrefix,
  legalTerms: REGISTER_DESKTOP_COPY.legalTerms,
  legalAnd: REGISTER_DESKTOP_COPY.legalAnd,
  legalPrivacy: REGISTER_DESKTOP_COPY.legalPrivacy,
  footerHelp: REGISTER_DESKTOP_COPY.footerHelp,
  footerPrivacy: REGISTER_DESKTOP_COPY.footerPrivacy,
  footerTerms: REGISTER_DESKTOP_COPY.footerTerms,
} as const;

export const LOGIN_PORTAL_ROUTES = {
  register: "/register",
  help: REGISTER_DESKTOP_ROUTES.help,
  terms: REGISTER_DESKTOP_ROUTES.terms,
  privacy: REGISTER_DESKTOP_ROUTES.privacy,
} as const;

export const LOGIN_PORTAL_HERO_IMAGE = REGISTER_DESKTOP_HERO_IMAGE;
