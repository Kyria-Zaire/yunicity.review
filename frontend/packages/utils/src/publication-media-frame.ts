/**
 * Classification et contrat de cadre pour les médias de publication (MEDIA-02).
 *
 * L'orientation vient UNIQUEMENT des dimensions intrinsèques (naturalWidth /
 * naturalHeight ou videoWidth / videoHeight). Jamais du MIME ni de l'extension.
 */

export type MediaOrientation = "portrait" | "square" | "landscape";

export type PublicationMediaFrameVariant = "feed" | "composer" | "viewer" | "thumbnail";

/** Tolérance pour considérer un média « carré » (≈ Instagram). */
const SQUARE_TOLERANCE = 0.05;

/**
 * Détermine l'orientation depuis les dimensions intrinsèques.
 * Renvoie null si les dimensions sont invalides / inconnues.
 */
export function classifyMediaOrientation(
  width: number,
  height: number,
): MediaOrientation | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const ratio = width / height;
  if (Math.abs(ratio - 1) <= SQUARE_TOLERANCE) return "square";
  if (ratio < 1) return "portrait";
  return "landscape";
}

/** Ratio CSS cible du cadre d'aperçu feed (pas le ratio natif). */
export function feedAspectRatioForOrientation(orientation: MediaOrientation): string {
  switch (orientation) {
    case "portrait":
      return "4 / 5";
    case "square":
      return "1 / 1";
    case "landscape":
      return "16 / 9";
  }
}

/**
 * Orientation utilisée tant que les dimensions ne sont pas connues.
 *
 * Portrait 4:5 est le cadre le plus HAUT autorisé. Ce choix garantit la seule
 * propriété qui compte vraiment pour la lecture : **le cadre ne grandit jamais
 * après mesure**, donc rien n'est repoussé vers le bas sous les yeux du lecteur.
 *
 * En contrepartie il se CONTRACTE quand le média mesuré est plus large que 4:5.
 * Mesuré en navigateur (viewport 844 px en mobile, 900 px ailleurs) :
 *
 *   orientation finale   390 px    900 px    1440 px
 *   portrait               0 px      0 px       0 px
 *   carré                  0 px    −64 px     −96 px
 *   paysage / ultra-large −153 px  −256 px    −306 px
 *
 * Aucune valeur de défaut ne supprime ce saut : choisir 16:9 ferait GRANDIR les
 * portraits d'autant, ce qui est pire. Le supprimer demande de connaître les
 * dimensions avant la mise en page, donc des métadonnées servies par l'API —
 * hors du périmètre MEDIA-02. Dette : MEDIA-03-INTRINSIC-DIMENSIONS.
 */
export function defaultFeedOrientation(): MediaOrientation {
  return "portrait";
}

export type PublicationMediaObjectFit = "cover" | "contain";

/** object-fit du média dans le cadre feed (aperçu). */
export function feedObjectFitForKind(kind: "image" | "video"): PublicationMediaObjectFit {
  return kind === "video" ? "contain" : "cover";
}

/** object-fit du viewer plein écran — toujours contain. */
export function viewerObjectFit(): PublicationMediaObjectFit {
  return "contain";
}

/**
 * Découpe une liste de médias pour la grille compacte d'aperçu.
 * Au-delà de 4, les 4 premiers + compteur +N.
 */
export function slicePublicationMediaForGrid<T>(items: readonly T[]): {
  visible: T[];
  overflowCount: number;
} {
  if (items.length <= 4) {
    return { visible: [...items], overflowCount: 0 };
  }
  return { visible: items.slice(0, 4), overflowCount: items.length - 4 };
}

/** Disposition de grille pour 1–4 tuiles visibles. */
export type PublicationMediaGridLayout = "single" | "pair" | "triple" | "quad";

export function publicationMediaGridLayout(visibleCount: number): PublicationMediaGridLayout {
  if (visibleCount <= 1) return "single";
  if (visibleCount === 2) return "pair";
  if (visibleCount === 3) return "triple";
  return "quad";
}
