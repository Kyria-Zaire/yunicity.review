/** Nouvelle discussion — micro-copy (WEB-DISCUSSIONS-02). */

export const DISCUSSION_NEW_PAGE_TITLE = "Nouvelle discussion";
export const DISCUSSION_NEW_PAGE_SUBTITLE =
  "Posez une question, partagez votre avis ou proposez une idée à la communauté.";

export const DISCUSSION_NEW_STEP1_TITLE = "Choisissez un sujet";
export const DISCUSSION_NEW_STEP1_HINT =
  "Sélectionnez la catégorie qui correspond le mieux à votre discussion.";

export const DISCUSSION_NEW_STEP2_TITLE = "Donnez un titre à votre discussion";
export const DISCUSSION_NEW_STEP2_HINT =
  "Soyez clair et précis : un bon titre attire plus de réponses.";
export const DISCUSSION_NEW_TITLE_PLACEHOLDER =
  "Ex : Quels sont vos cafés préférés pour travailler ?";

export const DISCUSSION_NEW_STEP3_TITLE = "Décrivez votre discussion";
export const DISCUSSION_NEW_STEP3_HINT =
  "Ajoutez le maximum de détails pour aider la communauté à vous répondre.";
export const DISCUSSION_NEW_BODY_PLACEHOLDER =
  "Décrivez votre question, partagez votre avis ou expliquez votre idée…";

export const DISCUSSION_NEW_STEP4_TITLE = "Ajoutez des tags";
export const DISCUSSION_NEW_STEP4_OPTIONAL = "(optionnel)";
export const DISCUSSION_NEW_STEP4_HINT = "Aidez les membres à trouver votre discussion.";
export const DISCUSSION_NEW_TAG_PLACEHOLDER = "Ajouter un tag…";

export const DISCUSSION_NEW_STEP5_TITLE = "Associez à une tribu";
export const DISCUSSION_NEW_STEP5_OPTIONAL = "(optionnel)";
export const DISCUSSION_NEW_STEP5_HINT = "Choisissez une tribu liée à votre sujet.";
export const DISCUSSION_NEW_TRIBE_PLACEHOLDER = "Sélectionnez une tribu";

export const DISCUSSION_NEW_CANCEL = "Annuler";
export const DISCUSSION_NEW_PUBLISH = "Publier la discussion";
export const DISCUSSION_NEW_PUBLISHING = "Publication…";

export const DISCUSSION_NEW_TIPS_TITLE = "Conseils pour une bonne discussion";
export const DISCUSSION_NEW_TIPS = [
  {
    id: "clear",
    title: "Soyez clair et précis",
    body: "Un titre et une description clairs attirent plus de réponses.",
  },
  {
    id: "category",
    title: "Choisissez la bonne catégorie",
    body: "Cela permet aux bons membres de voir votre discussion.",
  },
  {
    id: "kind",
    title: "Restez bienveillant",
    body: "Respectez les autres membres et les règles de la communauté.",
  },
  {
    id: "details",
    title: "Ajoutez des détails",
    body: "Plus vous donnez d'informations, plus les réponses seront utiles.",
  },
] as const;

export const DISCUSSION_NEW_EXAMPLES_TITLE = "Exemples de discussions";
export const DISCUSSION_NEW_EXAMPLES_EMPTY =
  "Les exemples apparaîtront au fil des échanges locaux.";

export const DISCUSSION_NEW_RULES_TITLE = "Règles de la communauté";
export const DISCUSSION_NEW_RULES_LINK = "Voir toutes les règles";
export const DISCUSSION_NEW_RULES_NOTICE =
  "En publiant, vous acceptez nos règles de communauté et vous engagez à respecter les autres membres.";

export const DISCUSSION_NEW_ERROR_GENERIC =
  "Impossible de publier la discussion. Vérifiez les champs et réessayez.";

export const DISCUSSION_NEW_TITLE_MIN = "Le titre doit contenir au moins 3 caractères.";
export const DISCUSSION_NEW_BODY_MIN = "La description doit contenir au moins 10 caractères.";

export const DISCUSSION_TITLE_MAX = 80;
export const DISCUSSION_BODY_MAX = 2000;
export const DISCUSSION_TAGS_MAX = 8;
