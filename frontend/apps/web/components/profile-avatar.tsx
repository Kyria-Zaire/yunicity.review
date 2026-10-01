"use client";

import { resolveApiMediaUrl } from "@yunicity/utils";
import { useEffect, useState } from "react";

const BOX_CLASS = {
  lg: "h-20 w-20",
  sm: "h-10 w-10",
  xs: "h-8 w-8",
  md: "h-14 w-14",
} as const;

const TEXT_CLASS = {
  lg: "text-2xl",
  sm: "text-sm",
  xs: "text-xs",
  md: "text-lg",
} as const;

export function ProfileAvatar({
  name,
  src,
  size = "lg",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof BOX_CLASS;
}) {
  // Le backend renvoie les medias de profil relatifs a l'API : sans resolution,
  // le navigateur les cherche sur l'origine web, qui repond 404 des que l'API a
  // son propre domaine.
  const avatarUrl = resolveApiMediaUrl(src);

  // Une URL peut etre presente et pourtant inatteignable (objet supprime, panne
  // du stockage, reseau). Sans cet etat le navigateur peint son icone d'image
  // cassee dans un avatar rond : on retombe sur l'initiale, deja le repli du
  // produit quand aucune photo n'existe.
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${BOX_CLASS[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary font-bold leading-none text-white ${BOX_CLASS[size]} ${TEXT_CLASS[size]}`}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
