import { NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE, type RegisterAccountTypeId, type RegisterStepId } from "@yunicity/utils";

export const REGISTER_DESKTOP_COPY = {
  heroTitle: "Votre ville, au bon moment.",
  heroSubtitle: "Découvrez ce qui se passe autour de vous et participez à la vie locale.",
  heroDiscover: "Découvrez les sorties et lieux proches",
  heroCommunities: "Rejoignez les communautés locales",
  heroPassport: "Profitez des avantages Passport",
  heroPrivacy: "Votre position exacte n'est jamais affichée publiquement.",
  pageTitle: "Créer votre compte",
  pageSubtitle: "Commençons par choisir le profil qui vous correspond.",
  typeTitle: "Vous êtes…",
  typeSubtitle:
    "Ce choix adapte votre expérience. Vous pourrez le modifier plus tard si nécessaire.",
  alreadyMember: "Déjà membre ?",
  loginLink: "Se connecter",
  alreadyAccount: "Déjà un compte ?",
  legalPrefix: "En continuant, vous acceptez les",
  legalTerms: "Conditions d'utilisation",
  legalAnd: "et la",
  legalPrivacy: "Politique de confidentialité",
  footerHelp: "Aide",
  footerPrivacy: "Confidentialité",
  footerTerms: "Conditions",
  compactHeroSubtitle: "Découvrez ce qui se passe autour de vous.",
  compactHeroPrivacy: "Votre position exacte reste privée.",
  compactPageSubtitle:
    "Choisissez le profil qui vous correspond. Vous pourrez le modifier plus tard si nécessaire.",
} as const;

export function registerCompactStepLabel(current: number, total: number): string {
  return `Étape ${current} sur ${total}`;
}

export const REGISTER_DESKTOP_ROUTES = {
  login: "/login",
  help: "/settings",
  terms: "/legal/conditions-generales",
  privacy: "/legal/confidentialite",
} as const;

export const REGISTER_DESKTOP_HERO_IMAGE = NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE;

export const REGISTER_DESKTOP_STEPS: ReadonlyArray<{
  id: RegisterStepId;
  label: string;
  order: number;
}> = [
  { id: "type", label: "Votre profil", order: 1 },
  { id: "info", label: "Vos informations", order: 2 },
  { id: "verify", label: "Vérification", order: 3 },
  { id: "finish", label: "Bienvenue", order: 4 },
] as const;

export const REGISTER_DESKTOP_ACCOUNT_TYPE_IDS = [
  "citizen",
  "commerce",
  "association",
  "school",
  "other",
] as const satisfies readonly RegisterAccountTypeId[];

export type RegisterDesktopAccountTypeId = (typeof REGISTER_DESKTOP_ACCOUNT_TYPE_IDS)[number];

export const REGISTER_DESKTOP_ACCOUNT_COPY: Partial<
  Record<
    RegisterAccountTypeId,
    {
      title: string;
      description: string;
      badge?: string;
      iconClassName: string;
    }
  >
> = {
  citizen: {
    title: "Habitant",
    description: "Je découvre et participe à la vie locale.",
    badge: "YUNICIZEN",
    iconClassName: "bg-[#EEF0FF] text-yunicity-primary",
  },
  commerce: {
    title: "Commerce",
    description: "Je présente mon commerce et mes offres.",
    iconClassName: "bg-violet-50 text-violet-600",
  },
  association: {
    title: "Association",
    description: "Je rassemble une communauté locale.",
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  school: {
    title: "École",
    description: "Je partage la vie de mon établissement.",
    iconClassName: "bg-amber-50 text-amber-600",
  },
  other: {
    title: "Indépendant / Freelance",
    description: "Je développe mon activité localement.",
    iconClassName: "bg-fuchsia-50 text-fuchsia-600",
  },
};
