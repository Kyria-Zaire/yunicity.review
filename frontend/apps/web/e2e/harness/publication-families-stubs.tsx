/**
 * Stubs du harnais « familles de publication » — test only.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * `publication-families-mount.tsx` cree sa PROPRE racine React, injectee dans la
 * page `/login` : elle vit donc HORS de l arbre de providers de l application.
 * `FeedCardWithDependencies` recoit bien ses dependances de donnees par props,
 * mais la famille « image » rend `AuthorizedPostImage`, dont le chemin passe par
 * `useAuthorizedMediaSource` → `useYunicityApi` → `useAuth`. Ce dernier levait
 * « useAuth doit etre utilise dans AuthProvider » et emportait les cinq familles
 * avec lui — pile observee :
 *
 *     at useAuth → at useYunicityApi → at useAuthorizedMediaSource
 *
 * ── Pourquoi un stub, et non un correctif produit ───────────────────────────
 * `useAuthorizedMediaSource` est partage par quatre composants et
 * `AuthorizedPostImage` est rendu depuis cinq surfaces (profil, tribus, offres).
 * Y injecter le fetcher serait un refactor transverse sans besoin produit. Les
 * harnais voisins — `media01-stubs`, `media02-interaction-stubs` — resolvent
 * exactement ce cas par un `alias` esbuild : on suit cette convention.
 *
 * ── Ce que le stub preserve ──────────────────────────────────────────────────
 * Les composants et le CSS restent ceux de la production : seule l E/S est
 * remplacee. L assertion « aucune requete API apres montage » reste donc vraie
 * par construction, et non par tolerance.
 */

/**
 * PNG uni 640x360, genere par l algorithme de `e2e/png-fixture.ts`.
 *
 * Ce generateur depend de `node:zlib` et ne peut pas etre embarque dans un
 * bundle navigateur : son resultat est donc fige ici en base64. Un PNG REEL, et
 * non un SVG, parce que `AuthorizedMediaContentType` n admet que jpeg/png/webp —
 * declarer un type que le blob ne porte pas rendrait le stub menteur. Les 640x360
 * conservent l orientation paysage mesuree par la spec.
 */
const PNG_640x360_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAoAAAAFoCAIAAABIUN0GAAAEg0lEQVR42u3VMQ0AAAgEsffEin9bEEwwNamCWy7VAwA8iwQAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMABgwABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMABgwABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMABgwABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAYMAqAIABA4ABAwAGDAAGDAAYMAAYMABgwABgwACAAQOAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAIABA4ABA4ABAwAGDAAGDAAYMAAYMABgwABgwACAAQOAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAIABA4ABA4ABAwAGDAAGDAAYMAAYMABgwABgwACAAQOAAQOAAQMABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAIABA4ABA4ABqwAABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMAAYMABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAGDAAYMAAYMABgwABgwACAAQOAAQMABgwABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMAAYMABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAGDAAYMAAYMABgwABgwACAAQOAAQMABgwABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMAAYMABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAGDAAYMAAYMABgwABgwACAAQOAAQMABgwABgwABgwAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMAAYsAQAYMAAYMABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMAAYMABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMAAYMABgwABgwACAAQOAAQMABgwABgwAGDAAGDAAGDAAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwABgwAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMAAYsAoAYMAAYMAAgAEDgAEDAAYMAAYMABgwABgwAGDAAGDAAGDAAIABA4ABAwAGDAAGDAAYMAAYMABwFl3AA2oFhy5VAAAAAElFTkSuQmCC";

/** Decode le base64 en octets, sans dependance Node. */
function pngEnBlob(): Blob {
  const binaire = atob(PNG_640x360_BASE64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  return new Blob([octets], { type: "image/png" });
}

/**
 * Instance UNIQUE, hissee au niveau module.
 *
 * C'est le point le plus facile a rater. Le vrai `useYunicityApi()` rend
 * `useAuth().yunicityApi`, une instance portee par le contexte : son identite ne
 * change JAMAIS entre deux rendus. `useAuthorizedMediaSource` s'appuie sur cette
 * stabilite — il memoise `fetchBlob` sur `[api]`, et son effet de chargement
 * depend de `fetchBlob`.
 *
 * Un stub qui rendait un objet litteral neuf a chaque rendu changeait donc
 * l'identite de `api` a chaque rendu : l'effet se relancait, son `cleanup`
 * abandonnait le fetch precedent, et le statut restait indefiniment `loading`.
 * L'image affichait « Chargement de l'image » sans jamais decoder — aucun
 * `<img>` dans le DOM, donc `imgs === 0`.
 */
const API_STUB = {
  /**
   * Meme forme que `YunicityApi.fetchAuthorizedMediaBlob` : `{ blob, contentType }`.
   *
   * Rendre un `Blob` nu faisait echouer la destructuration `const { blob } = …`
   * du hook, puis `URL.createObjectURL(undefined)` levait : la carte affichait
   * « Image momentanement indisponible ». Mesure a l appui, dans les deux cas.
   */
  fetchAuthorizedMediaBlob: async (
    _mediaUrl: string,
    signal?: AbortSignal,
  ): Promise<{ blob: Blob; contentType: "image/png" }> => {
    // Un signal deja abaisse doit se comporter comme le vrai client : rejeter,
    // pour que le harnais ne masque pas une annulation mal geree.
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return { blob: pngEnBlob(), contentType: "image/png" };
  },
};

export function useYunicityApi() {
  return API_STUB;
}

/**
 * `next/navigation` hors App Router.
 *
 * `FeedMediaViewerHost` — que le harnais monte comme `app/layout.tsx` le fait —
 * lit `usePathname()` pour refermer la visionneuse a chaque changement de route.
 * Sans contexte de routeur Next, l appel leve. Une valeur fixe suffit : le
 * harnais ne navigue jamais, donc la visionneuse ne doit jamais se refermer
 * d elle-meme pendant la mesure.
 */
export function usePathname(): string {
  return "/feed";
}
