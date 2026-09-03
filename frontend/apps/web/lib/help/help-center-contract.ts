export const HELP_CENTER_COPY = {
  pageTitle: "Centre d'aide",
  heroTitle: "Comment pouvons-nous vous aider ?",
  heroSubtitle: "Retrouvez rapidement les réponses essentielles pour utiliser Yunicity.",
  searchPlaceholder: "Rechercher dans l'aide",
  browseTitle: "Parcourir l'aide",
  faqTitle: "Questions fréquentes",
  contactTitle: "Vous n'avez pas trouvé votre réponse ?",
  contactBody: "Expliquez-nous votre situation depuis notre formulaire public.",
  contactCta: "Nous contacter",
  securityNote: "Ne partagez jamais votre mot de passe.",
} as const;

export const HELP_CENTER_ROUTES = {
  contact: "mailto:contact@yunicity.city",
  home: "/",
  neighborhoods: "/neighborhoods",
  tribes: "/tribes",
  passport: "/passport",
  settings: "/settings",
  feedNew: "/feed/new",
} as const;

export const HELP_CENTER_CATEGORIES = [
  {
    id: "getting-started",
    title: "Premiers pas",
    href: "#faq-explorer-sans-compte",
    icon: "rocket",
    tone: "blue",
  },
  {
    id: "account",
    title: "Compte et profil",
    href: "#faq-modifier-ville",
    icon: "account",
    tone: "purple",
  },
  {
    id: "discover",
    title: "Découvrir Reims",
    href: HELP_CENTER_ROUTES.neighborhoods,
    icon: "discover",
    tone: "rose",
  },
  {
    id: "tribes",
    title: "Tribus",
    href: "#faq-rejoindre-tribu",
    icon: "tribes",
    tone: "green",
  },
  {
    id: "passport",
    title: "Passport et offres",
    href: "#faq-passport",
    icon: "passport",
    tone: "amber",
  },
  {
    id: "publish",
    title: "Publier et créer",
    href: "#faq-publier",
    icon: "publish",
    tone: "teal",
  },
] as const;

export const HELP_CENTER_FAQ_ITEMS = [
  {
    id: "explorer-sans-compte",
    question: "Puis-je explorer Yunicity sans compte ?",
    answer:
      "Oui. Les quartiers, les tribus et les lieux publics restent accessibles avant la connexion.",
  },
  {
    id: "modifier-ville",
    question: "Comment modifier ma ville ?",
    answer:
      "Connectez-vous, ouvrez Paramètres, puis mettez à jour votre ville dans la section Profil.",
  },
  {
    id: "rejoindre-tribu",
    question: "Comment rejoindre ou quitter une tribu ?",
    answer:
      "Rendez-vous sur Tribus, ouvrez une communauté et utilisez Rejoindre. Pour quitter, retrouvez la tribu depuis votre espace membre.",
  },
  {
    id: "passport",
    question: "Comment fonctionne le Passport ?",
    answer:
      "Le Passport regroupe vos visites et offres partenaires à Reims. Consultez Passport pour voir vos tampons et avantages locaux.",
  },
  {
    id: "publier",
    question: "Comment publier sur Yunicity ?",
    answer:
      "Depuis le fil local ou les espaces de création (événement, tribu, lieu), utilisez Publier lorsque vous êtes connecté.",
  },
] as const;

export type HelpCenterCategory = (typeof HELP_CENTER_CATEGORIES)[number];
export type HelpCenterFaqItem = (typeof HELP_CENTER_FAQ_ITEMS)[number];

export function filterHelpCenterContent(query: string): {
  categories: HelpCenterCategory[];
  faqItems: HelpCenterFaqItem[];
} {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      categories: [...HELP_CENTER_CATEGORIES],
      faqItems: [...HELP_CENTER_FAQ_ITEMS],
    };
  }

  const categories = HELP_CENTER_CATEGORIES.filter((item) =>
    item.title.toLowerCase().includes(normalized),
  );
  const faqItems = HELP_CENTER_FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(normalized) ||
      item.answer.toLowerCase().includes(normalized),
  );

  return { categories, faqItems };
}
