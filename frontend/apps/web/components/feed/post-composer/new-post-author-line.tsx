"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { POST_NEW_PUBLIC_MENTION } from "@yunicity/utils";
import { Globe2 } from "lucide-react";

/**
 * Ligne d'auteur du composeur.
 *
 * La mention d'audience n'est **PAS** un bouton : aucune autre audience
 * n'existe côté serveur pour ce parcours. Un sélecteur laisserait croire à un
 * choix, et l'ancien écran en offrait quatre dont trois sans effet.
 */
export function NewPostAuthorLine({
  authorLabel,
  avatarUrl,
}: {
  authorLabel: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <ProfileAvatar name={authorLabel} src={avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-900">{authorLabel}</p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Globe2 className="h-3.5 w-3.5" aria-hidden />
          {POST_NEW_PUBLIC_MENTION}
        </p>
      </div>
    </div>
  );
}
