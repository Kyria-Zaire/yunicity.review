/** Abonnements portal micro-copy (WEB-SUBSCRIPTIONS-01). */

export const SUBSCRIPTION_PAGE_TITLE = "Choisissez l'abonnement qui vous correspond";
export const SUBSCRIPTION_PAGE_SUBTITLE =
  "Plus d'avantages pour découvrir, rencontrer et profiter de votre ville.";

export const SUBSCRIPTION_BILLING_MONTHLY = "Mensuel";
export const SUBSCRIPTION_BILLING_MONTHLY_HINT = "Sans engagement";
export const SUBSCRIPTION_BILLING_ANNUAL = "Annuel";
export const SUBSCRIPTION_BILLING_ANNUAL_BADGE = "-20%";
export const SUBSCRIPTION_BILLING_ANNUAL_HINT = "Économisez 2 mois";

export const SUBSCRIPTION_PLAN_POPULAR_BADGE = "Le plus populaire";
export const SUBSCRIPTION_CURRENT_PLAN = "Votre offre actuelle";
export const SUBSCRIPTION_CHOOSE_PLUS = "Choisir Plus";
export const SUBSCRIPTION_CHOOSE_PREMIUM = "Choisir Premium";
export const SUBSCRIPTION_PRICE_PER_MONTH = "/mois";

export const SUBSCRIPTION_COMMUNITY_TITLE = "Merci de soutenir Yunicity !";
export const SUBSCRIPTION_COMMUNITY_BODY =
  "Chaque abonnement nous permet de continuer à développer une app utile, locale et indépendante.";
export const SUBSCRIPTION_COMMUNITY_COUNT = (count: number) =>
  `${count.toLocaleString("fr-FR")} membre${count > 1 ? "s" : ""} soutien${count > 1 ? "nent" : ""} déjà Yunicity`;

export const SUBSCRIPTION_BENEFITS_TITLE = "Vos avantages Plus";
export const SUBSCRIPTION_PAYMENT_METHODS_TITLE = "Modes de paiement acceptés";
export const SUBSCRIPTION_SECURITY_TITLE = "Vos données sont sécurisées";
export const SUBSCRIPTION_SECURITY_BODY =
  "Nous utilisons un chiffrement de niveau bancaire pour protéger toutes vos informations.";
export const SUBSCRIPTION_SECURITY_LINK = "En savoir plus";

export const SUBSCRIPTION_TRUST_NO_COMMITMENT = "Sans engagement";
export const SUBSCRIPTION_TRUST_NO_COMMITMENT_HINT = "Résiliez à tout moment.";
export const SUBSCRIPTION_TRUST_SECURE = "Paiement sécurisé";
export const SUBSCRIPTION_TRUST_SECURE_HINT = "Vos données sont protégées.";
export const SUBSCRIPTION_TRUST_LOCAL = "Soutien local";
export const SUBSCRIPTION_TRUST_LOCAL_HINT = "Vous aidez à faire vivre votre ville.";
export const SUBSCRIPTION_TRUST_CANCEL = "Annulation facile";
export const SUBSCRIPTION_TRUST_CANCEL_HINT = "Depuis vos paramètres.";

export const SUBSCRIPTION_FAQ_TITLE = "Questions fréquentes";
export const SUBSCRIPTION_FAQ_ITEMS = [
  {
    id: "cancel",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui. Sans engagement : vous pouvez résilier depuis vos paramètres. L'accès payant reste actif jusqu'à la fin de la période en cours.",
  },
  {
    id: "end",
    question: "Que se passe-t-il à la fin de mon abonnement ?",
    answer:
      "Vous repassez automatiquement sur l'offre gratuite. Vos publications et votre historique local restent accessibles.",
  },
  {
    id: "payment",
    question: "Quels moyens de paiement sont acceptés ?",
    answer:
      "Carte bancaire (Visa, Mastercard), Apple Pay et PayPal lorsque le paiement en ligne est activé sur votre environnement.",
  },
] as const;

export const SUBSCRIPTION_LEFT_HOME = "Accueil";
export const SUBSCRIPTION_LEFT_SUBSCRIPTIONS = "Abonnements";
export const SUBSCRIPTION_LEFT_POPULAR = "Populaires";
export const SUBSCRIPTION_LEFT_NEARBY = "Près de moi";
export const SUBSCRIPTION_LEFT_DISCUSSIONS = "Discussions";
export const SUBSCRIPTION_LEFT_CONTRIBUTIONS = "Contributions";
export const SUBSCRIPTION_LEFT_SAVED = "Enregistrés";

export const SUBSCRIPTION_PROMO_TITLE = "Passez au supérieur 👑";
export const SUBSCRIPTION_PROMO_BODY =
  "Soutenez Yunicity et profitez d'avantages exclusifs pour vivre votre ville à 100%.";
export const SUBSCRIPTION_PROMO_CTA = "Comparer les offres";

export const SUBSCRIPTION_HELP_TITLE = "Besoin d'aide ?";
export const SUBSCRIPTION_HELP_BODY = "Notre équipe est là pour répondre à toutes vos questions.";
export const SUBSCRIPTION_HELP_CTA = "Voir le centre d'aide";

export const SUBSCRIPTION_LOADING = "Chargement des offres…";
export const SUBSCRIPTION_ERROR = "Impossible de charger les abonnements.";
export const SUBSCRIPTION_RETRY = "Réessayer";
export const SUBSCRIPTION_CHECKOUT_UNAVAILABLE_TITLE = "Paiement pas encore activé";

export const SUBSCRIPTION_PLUS_BENEFIT_HIGHLIGHTS = [
  {
    id: "messages",
    title: "Messages illimités",
    description: "Discutez sans limite avec vos contacts.",
  },
  {
    id: "tonight",
    title: "Activités de vos tribus ce soir",
    description: "Suivez les sorties liées à vos tribus (sans présence fictive).",
  },
  {
    id: "filters",
    title: "Filtres avancés",
    description: "Trouvez exactement ce que vous cherchez.",
  },
  {
    id: "early",
    title: "Accès anticipé",
    description: "Réservez avant tout le monde.",
  },
  {
    id: "badge",
    title: "Badge exclusif",
    description: "Affichez votre soutien à la communauté.",
  },
] as const;
