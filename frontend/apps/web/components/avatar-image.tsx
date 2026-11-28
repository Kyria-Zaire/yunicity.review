"use client";

import { resolveApiMediaUrl } from "@yunicity/utils";
import type { ImgHTMLAttributes } from "react";
import { useEffect, useState } from "react";

type AvatarImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string | null | undefined;
};

/**
 * Photo de profil rendue dans une pastille deja dimensionnee par l'appelant.
 *
 * Remplace un `<img>` nu partout ou l'avatar n'est pas rendu par
 * `ProfileAvatar` (lequel apporte sa propre boite et son initiale). Toutes les
 * props sont transmises telles quelles — `className`, `loading`, `alt`… — donc
 * le design, la taille et l'arrondi de l'appelant ne changent pas d'un pixel.
 *
 * Deux choses seulement sont ajoutees :
 *   • la resolution de l'URL relative a l'API (sinon 404 sur l'origine web) ;
 *   • le repli en cas d'echec de chargement.
 *
 * Le repli ne rend RIEN : ces appelants dessinent deja la pastille (fond,
 * bordure, souvent une initiale en dessous). Laisser le `<img>` en place
 * afficherait l'icone d'image cassee du navigateur ; le retirer laisse
 * apparaitre la pastille de l'appelant, sans introduire de nouveau design.
 */
export function AvatarImage({ src, alt = "", ...rest }: AvatarImageProps) {
  const resolved = resolveApiMediaUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} src={resolved} alt={alt} onError={() => setFailed(true)} />;
}
