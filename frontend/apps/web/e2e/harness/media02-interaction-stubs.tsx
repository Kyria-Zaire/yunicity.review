/**
 * MEDIA-02 — bouchon d'accès média pour les preuves d'interaction.
 *
 * Remplace UNIQUEMENT l'accès réseau autorisé. Le contrat est celui du hook :
 * `fetchAuthorizedMediaBlob` rend `{ blob }`, pas un `Blob` nu — rendre un blob
 * nu laisse la promesse « résolue » sans jamais atteindre l'état prêt.
 *
 * Chaque appel reçoit un PNG de couleur distincte : on peut donc vérifier que
 * la tuile cliquée ouvre bien SON média, et pas un autre.
 */

type Reponse = { blob: Blob };

const COULEURS = [
  "#e11d48",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#4d7c0f",
  "#9333ea",
  "#0f766e",
];

let appels = 0;

/** PNG 8×8 d'une couleur donnée, encodé en blob. */
async function pngCouleur(couleur: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d indisponible");
  ctx.fillStyle = couleur;
  ctx.fillRect(0, 0, 8, 8);
  const dataUrl = canvas.toDataURL("image/png");
  return (await fetch(dataUrl)).blob();
}

/**
 * Instance STABLE, comme le vrai hook.
 *
 * Rendre un objet neuf a chaque rendu relance l'effet du hook media (sa
 * dependance est l'api), ce qui annule l'envoi precedent et relance le suivant :
 * les medias ne deviennent jamais prets, et le harnais mesurerait un artefact.
 */
const api = {
  fetchAuthorizedMediaBlob: async (): Promise<Reponse> => {
    const index = appels;
    appels += 1;
    return { blob: await pngCouleur(COULEURS[index % COULEURS.length]!) };
  },
};

export function useYunicityApi() {
  return api;
}

const auth = { user: { email: "citoyenne@exemple.test" } };
const router = { push: () => {}, replace: () => {}, back: () => {}, refresh: () => {} };

export function useAuth() {
  return auth;
}

export function useRouter() {
  return router;
}

export function usePathname() {
  return "/feed";
}

export function useSearchParams() {
  return { get: () => null };
}

export default function Vide() {
  return null;
}
