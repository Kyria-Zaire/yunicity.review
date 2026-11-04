import { settingsSectionDomId } from "@yunicity/utils";

export const LEGAL_ROUTES = {
  privacy: "/legal/confidentialite",
  terms: "/legal/conditions-generales",
  help: "/aide",
  home: "/",
  contact: "mailto:contact@yunicity.city",
  settingsPrivacy: `/settings#${settingsSectionDomId("privacy")}`,
} as const;

export const LEGAL_COPY = {
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDateLabel: "Date d'entrée en vigueur",
  tocTitle: "Sommaire",
  tocOpenLabel: "Afficher le sommaire",
  tocCloseLabel: "Masquer le sommaire",
  relatedTitle: "Documents associés",
  helpCta: "Centre d'aide",
  contactCta: "Nous contacter",
  settingsCta: "Gérer mes préférences de confidentialité",
  backHome: "Retour à l'accueil",
  printHint: "Vous pouvez imprimer ou enregistrer cette page depuis votre navigateur.",
} as const;

export type LegalDocumentId = "privacy" | "terms";

export type LegalDocumentSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type LegalDocumentDefinition = {
  id: LegalDocumentId;
  title: string;
  description: string;
  lastUpdated: string;
  effectiveDate: string;
  intro: string;
  sections: readonly LegalDocumentSection[];
  settingsHref?: string;
  relatedDocuments: readonly { label: string; href: string }[];
};

const PRIVACY_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      "Yunicity est une plateforme sociale locale qui met en relation les habitants, les quartiers, les tribus, les lieux et les événements de Reims.",
      "La présente politique de confidentialité explique quelles données nous collectons, pourquoi nous les utilisons, avec qui nous les partageons et quels droits vous pouvez exercer.",
    ],
  },
  {
    id: "responsable",
    title: "Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement des données personnelles est Yunicity.",
      "Pour toute question relative à vos données, vous pouvez nous écrire à contact@yunicity.city en précisant l'objet « Données personnelles ».",
    ],
  },
  {
    id: "donnees-collectees",
    title: "Données que nous collectons",
    paragraphs: ["Nous collectons uniquement les données nécessaires au fonctionnement du service :"],
    bullets: [
      "Identité de compte : nom d'utilisateur, adresse e-mail, mot de passe (stocké de manière sécurisée).",
      "Profil public : photo, bio, ville, préférences d'affichage que vous choisissez de rendre visibles.",
      "Activité locale : publications, participations aux tribus, interactions (likes, commentaires) et contenus que vous créez.",
      "Données techniques : identifiants de session, logs de connexion, type d'appareil et navigateur, adresse IP approximative.",
      "Localisation : uniquement si vous l'autorisez explicitement, pour les fonctionnalités de carte, quartiers et lieux.",
    ],
  },
  {
    id: "finalites",
    title: "Finalités et bases légales",
    paragraphs: ["Nous utilisons vos données pour les finalités suivantes :"],
    bullets: [
      "Fournir et sécuriser le service (exécution du contrat).",
      "Personnaliser votre expérience locale : fil, tribus, événements et recommandations de quartier (intérêt légitime, avec possibilité d'opposition).",
      "Communiquer avec vous : notifications transactionnelles, alertes de sécurité et, si vous y consentez, actualités Yunicity.",
      "Prévenir les abus, modérer les contenus et garantir la sécurité de la communauté (intérêt légitime).",
      "Respecter nos obligations légales et répondre aux demandes des autorités compétentes.",
    ],
  },
  {
    id: "partage",
    title: "Partage des données",
    paragraphs: [
      "Nous ne vendons pas vos données personnelles. Nous pouvons les partager dans les cas limités suivants :",
    ],
    bullets: [
      "Avec d'autres utilisateurs, selon les paramètres de visibilité que vous définissez sur votre profil et vos contenus.",
      "Avec nos sous-traitants techniques (hébergement, envoi d'e-mails, analytics agrégés) liés par des engagements de confidentialité.",
      "En cas d'obligation légale, de demande judiciaire ou pour protéger les droits, la sécurité et l'intégrité de Yunicity et de ses utilisateurs.",
      "Dans le cadre d'une opération de restructuration, sous réserve que le repreneur respecte la présente politique.",
    ],
  },
  {
    id: "conservation",
    title: "Durée de conservation",
    paragraphs: [
      "Nous conservons vos données aussi longtemps que votre compte est actif, puis pendant la durée nécessaire à nos obligations légales et à la résolution des litiges.",
      "Les contenus que vous supprimez peuvent rester temporairement en cache ou sauvegarde avant effacement définitif. Les logs techniques sont conservés pour une durée limitée, proportionnée aux besoins de sécurité.",
    ],
  },
  {
    id: "droits",
    title: "Vos droits",
    paragraphs: [
      "Conformément au Règlement général sur la protection des données (RGPD), vous disposez des droits suivants :",
    ],
    bullets: [
      "Droit d'accès, de rectification et d'effacement de vos données.",
      "Droit à la limitation du traitement et d'opposition, dans les cas prévus par la loi.",
      "Droit à la portabilité des données que vous nous avez fournies.",
      "Droit de retirer votre consentement à tout moment, sans affecter la licéité du traitement antérieur.",
      "Droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr).",
    ],
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    paragraphs: [
      "Yunicity utilise des cookies essentiels au fonctionnement du site (session, sécurité, préférences d'interface).",
      "Des cookies de mesure d'audience peuvent être déposés uniquement avec votre consentement. Vous pouvez gérer vos choix depuis les paramètres de votre navigateur ou, le cas échéant, depuis notre bandeau de consentement.",
    ],
  },
  {
    id: "securite",
    title: "Sécurité",
    paragraphs: [
      "Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement des communications (HTTPS), contrôle d'accès, journalisation des opérations sensibles et revue régulière de nos pratiques.",
      "Aucune transmission sur Internet n'est totalement inviolable. Nous vous invitons à choisir un mot de passe robuste et à ne jamais le partager.",
    ],
  },
  {
    id: "mineurs",
    title: "Mineurs",
    paragraphs: [
      "Yunicity s'adresse aux personnes âgées de 15 ans et plus. Si nous apprenons qu'un compte a été créé par un mineur en dessous de cet âge sans consentement parental vérifiable, nous pourrons le suspendre et supprimer les données associées.",
    ],
  },
  {
    id: "modifications",
    title: "Modifications de cette politique",
    paragraphs: [
      "Nous pouvons mettre à jour cette politique pour refléter l'évolution du service ou du cadre légal. La date de dernière mise à jour est indiquée en haut de page.",
      "En cas de changement substantiel, nous vous en informerons par un avis visible sur la plateforme ou par e-mail.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "Pour exercer vos droits ou poser une question sur vos données : contact@yunicity.city.",
      "Consultez également nos Conditions générales pour les règles d'utilisation de la plateforme.",
    ],
  },
];

const TERMS_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: "objet",
    title: "Objet et acceptation",
    paragraphs: [
      "Les présentes Conditions générales d'utilisation (« CGU ») encadrent l'accès et l'utilisation de Yunicity, plateforme sociale locale dédiée à Reims et à ses habitants.",
      "En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser Yunicity.",
    ],
  },
  {
    id: "service",
    title: "Description du service",
    paragraphs: [
      "Yunicity permet de découvrir des quartiers, rejoindre des tribus, consulter des lieux et événements locaux, publier des contenus et bénéficier du Passport et des offres partenaires.",
      "Certaines fonctionnalités nécessitent un compte. D'autres restent accessibles en navigation libre, dans les limites définies par le produit.",
    ],
  },
  {
    id: "compte",
    title: "Création et gestion du compte",
    paragraphs: ["Pour créer un compte, vous vous engagez à :"],
    bullets: [
      "Fournir des informations exactes et à les maintenir à jour.",
      "Préserver la confidentialité de vos identifiants et nous signaler toute utilisation non autorisée.",
      "Ne créer qu'un compte personnel, sauf autorisation expresse pour les comptes professionnels ou organisationnels.",
      "Respecter l'âge minimum requis (15 ans) ou disposer du consentement parental requis.",
    ],
  },
  {
    id: "conduite",
    title: "Règles de conduite",
    paragraphs: ["Yunicity promeut une communauté locale respectueuse. Sont notamment interdits :"],
    bullets: [
      "Les propos haineux, discriminatoires, diffamatoires, harcelants ou menaçants.",
      "La publication de contenus illicites, violents, pornographiques impliquant des mineurs, ou portant atteinte à la vie privée d'autrui.",
      "L'usurpation d'identité, le spam, les arnaques et toute tentative de manipulation de la plateforme.",
      "L'utilisation automatisée non autorisée (bots, scraping massif, contournement de limitations techniques).",
    ],
  },
  {
    id: "contenus",
    title: "Contenus publiés par les utilisateurs",
    paragraphs: [
      "Vous restez responsable des contenus que vous publiez (textes, images, vidéos, événements, contributions quartier).",
      "Vous garantissez disposer des droits nécessaires sur les contenus partagés et ne pas enfreindre les droits de tiers.",
      "Yunicity se réserve le droit de modérer, masquer ou supprimer tout contenu contraire aux présentes CGU ou à la loi, sans obligation de publication préalable.",
    ],
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    paragraphs: [
      "La marque Yunicity, l'interface, les bases de données structurées et les éléments graphiques de la plateforme sont protégés. Toute reproduction non autorisée est interdite.",
      "En publiant sur Yunicity, vous accordez à la plateforme une licence non exclusive, mondiale et gratuite pour héberger, afficher, reproduire et distribuer vos contenus dans le cadre du service, y compris pour la promotion de Yunicity, dans le respect de vos paramètres de visibilité.",
    ],
  },
  {
    id: "passport-partenaires",
    title: "Passport et offres partenaires",
    paragraphs: [
      "Le Passport et les offres partenaires sont soumis à des conditions spécifiques affichées sur chaque offre ou espace partenaire.",
      "Yunicity n'est pas responsable des prestations fournies directement par les partenaires locaux, mais s'efforce de maintenir un réseau de confiance.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension et résiliation",
    paragraphs: [
      "Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. La suppression entraîne la désactivation de votre profil public, sous réserve des obligations légales de conservation.",
      "Yunicity peut suspendre ou résilier un compte en cas de violation des CGU, de risque pour la communauté ou sur demande des autorités compétentes.",
    ],
  },
  {
    id: "responsabilite",
    title: "Limitation de responsabilité",
    paragraphs: [
      "Yunicity est fourni « en l'état ». Nous nous efforçons d'assurer la disponibilité et la qualité du service, sans garantie d'absence d'interruption ou d'erreur.",
      "Dans les limites autorisées par la loi, Yunicity ne pourra être tenue responsable des dommages indirects, des pertes de données imputables à l'utilisateur, ou du contenu publié par des tiers.",
    ],
  },
  {
    id: "droit-applicable",
    title: "Droit applicable et litiges",
    paragraphs: [
      "Les présentes CGU sont régies par le droit français. En cas de litige, une solution amiable sera recherchée en priorité.",
      "À défaut, les tribunaux compétents du ressort de Reims pourront être saisis, sous réserve des dispositions légales impératives applicables aux consommateurs.",
    ],
  },
  {
    id: "modifications-cgu",
    title: "Modifications des CGU",
    paragraphs: [
      "Yunicity peut modifier les présentes CGU pour tenir compte de l'évolution du service ou du cadre juridique. La date de dernière mise à jour figure en haut de page.",
      "L'utilisation continue du service après notification vaut acceptation des CGU mises à jour, sauf opposition manifeste dans les délais indiqués.",
    ],
  },
  {
    id: "contact-cgu",
    title: "Contact",
    paragraphs: [
      "Pour toute question relative aux présentes conditions : contact@yunicity.city.",
      "Consultez notre Politique de confidentialité pour le traitement de vos données personnelles.",
    ],
  },
];

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocumentDefinition> = {
  privacy: {
    id: "privacy",
    title: "Politique de confidentialité",
    description:
      "Comment Yunicity collecte, utilise et protège vos données personnelles sur la plateforme locale de Reims.",
    lastUpdated: "3 septembre 2026",
    effectiveDate: "3 septembre 2026",
    intro:
      "Cette politique s'applique à l'ensemble des services Yunicity accessibles sur le web et les applications associées. Nous accordons une importance particulière à la transparence, à la minimisation des données et au contrôle que vous gardez sur votre visibilité locale.",
    sections: PRIVACY_SECTIONS,
    settingsHref: LEGAL_ROUTES.settingsPrivacy,
    relatedDocuments: [
      { label: "Conditions générales", href: LEGAL_ROUTES.terms },
    ],
  },
  terms: {
    id: "terms",
    title: "Conditions générales d'utilisation",
    description:
      "Les règles d'utilisation de Yunicity pour les citoyens, créateurs et partenaires de la communauté locale de Reims.",
    lastUpdated: "3 septembre 2026",
    effectiveDate: "3 septembre 2026",
    intro:
      "Les présentes conditions encadrent votre relation avec Yunicity. Elles complètent toute condition spécifique affichée sur une fonctionnalité (Passport, offres partenaires, espaces organisationnels).",
    sections: TERMS_SECTIONS,
    relatedDocuments: [
      { label: "Politique de confidentialité", href: LEGAL_ROUTES.privacy },
    ],
  },
};

export function getLegalDocument(id: LegalDocumentId): LegalDocumentDefinition {
  return LEGAL_DOCUMENTS[id];
}

export function getLegalSectionIds(document: LegalDocumentDefinition): string[] {
  return document.sections.map((section) => section.id);
}

/** @deprecated Utiliser LEGAL_DOCUMENTS.privacy.title */
export const LEGAL_PRIVACY_PAGE_TITLE = LEGAL_DOCUMENTS.privacy.title;
/** @deprecated Utiliser LEGAL_DOCUMENTS.terms.title */
export const LEGAL_TERMS_PAGE_TITLE = LEGAL_DOCUMENTS.terms.title;
/** @deprecated Utiliser LEGAL_COPY */
export const LEGAL_BACK_LABEL = LEGAL_COPY.backHome;
/** @deprecated */
export const LEGAL_PRIVACY_INTRO = LEGAL_DOCUMENTS.privacy.intro;
/** @deprecated */
export const LEGAL_PRIVACY_BODY = LEGAL_DOCUMENTS.privacy.sections[0]?.paragraphs[0] ?? "";
/** @deprecated */
export const LEGAL_TERMS_INTRO = LEGAL_DOCUMENTS.terms.intro;
/** @deprecated */
export const LEGAL_TERMS_BODY = LEGAL_DOCUMENTS.terms.sections[0]?.paragraphs[0] ?? "";
/** @deprecated Utiliser LEGAL_COPY.settingsCta */
export const LEGAL_SETTINGS_CTA = LEGAL_COPY.settingsCta;
