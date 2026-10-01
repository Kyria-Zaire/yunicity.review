import { resolveWebApiBaseUrl } from "./api-base-url";

/**
 * Resout une URL de media renvoyee par l'API.
 *
 * Le backend enregistre les medias de profil sous forme RELATIVE a l'API
 * (`/api/v1/profile-media/<user>/avatar.png`, cf. `profile_media_api_url`) :
 * l'objet n'est jamais designe directement, il passe par une route applicative
 * qui verifie qu'il est bien reference par le profil demande.
 *
 * Mais `<img src="/api/v1/...">` est resolu par le NAVIGATEUR, donc contre
 * l'origine WEB — pas contre l'API. Tant que les deux partagent une origine
 * (developpement local, ou le proxy `/api/v1/*` de Next repond), cela marche.
 * Des que l'API vit sur son propre domaine (Preview et production), la meme URL
 * tombe en 404 sur l'origine web et le navigateur peint son icone d'image
 * cassee : le defaut est invisible en local et systematique une fois deploye.
 *
 * On resout donc avec la base PUBLIQUE, celle que le navigateur peut atteindre :
 *   • `NEXT_PUBLIC_API_URL` defini -> origine API absolue (Preview, production) ;
 *   • non defini                   -> chaine vide, donc meme origine (dev local).
 *
 * Volontairement `runtime: "browser"` meme lorsque ce code s'execute au rendu
 * serveur : l'URL produite finit dans un attribut `src`, donc c'est TOUJOURS le
 * navigateur qui la resoudra. `getWebApiBaseUrl()` retomberait ici sur la cible
 * serveur (`http://127.0.0.1:8010`), ce qui inscrirait une adresse loopback dans
 * le HTML envoye au client et ferait diverger le rendu serveur du rendu client.
 *
 * Une URL deja absolue (CDN historique, service media, `data:`/`blob:` d'un
 * apercu local avant televersement) est rendue telle quelle : ce resolveur ne
 * reecrit que ce qui est relatif a la racine.
 */
export function resolveApiMediaUrl(src: string): string;
export function resolveApiMediaUrl(src: string | null | undefined): string | null;
export function resolveApiMediaUrl(src: string | null | undefined): string | null {
  const trimmed = src?.trim();
  if (!trimmed) return null;

  // Absolu, protocole-relatif, ou donnee embarquee : rien a resoudre.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed;
  }

  // Seules les references relatives A LA RACINE designent une route de l'API.
  // Une relative de document (`images/x.png`) n'a pas de sens ici et serait
  // resolue contre la page courante : on la laisse au navigateur plutot que
  // d'inventer une base.
  if (!trimmed.startsWith("/")) {
    return trimmed;
  }

  const base = resolveWebApiBaseUrl({
    publicApiUrl: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined,
    proxyTarget: undefined,
    runtime: "browser",
  });
  return `${base}${trimmed}`;
}
