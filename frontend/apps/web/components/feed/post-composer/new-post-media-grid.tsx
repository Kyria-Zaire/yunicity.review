"use client";

import { NewPostMediaTile } from "@/components/feed/post-composer/new-post-media-tile";
import type { MediaDraft, MediaMoveDirection } from "@/hooks/use-new-post-draft";
import {
  POST_NEW_MEDIA_ADD,
  POST_NEW_MEDIA_COUNT,
  POST_NEW_MEDIA_DROP_HINT,
  POST_NEW_MEDIA_EMPTY_DROP_HINT,
  POST_NEW_MEDIA_FIRST_HINT,
  POST_NEW_MEDIA_LIMIT_HINT,
  POST_NEW_MEDIA_MOVED,
} from "@yunicity/utils";
import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary";

/** La mention de glisser-déposer n'a de sens qu'avec un pointeur fin : desktop. */
const MENTION_DESKTOP = "hidden text-center text-xs text-neutral-500 min-[1024px]:block";

/**
 * Médias du brouillon — vide : une zone d'ajout ; rempli : grille ordonnée,
 * tuile d'ajout en dernière position, compteur, bouton d'ajout (planches).
 *
 * Deux acquis de `MEDIA-MULTI-PHOTO-01` tiennent ici :
 *   - un aperçu par fichier — la mosaïque n'en montrait qu'un ;
 *   - le rang est **calculé** depuis la position dans le tableau, jamais stocké.
 *
 * Un média en échec d'envoi **reste** dans la grille : il est rejouable, et le
 * retirer ferait disparaître ce que l'utilisateur croit joindre.
 *
 * `addDisabled` / `editDisabled` : pendant une tentative en cours ou à
 * l'issue inconnue, le contenu soumis est FIGÉ — ajouter, retirer ou
 * réordonner enverrait sous la même clé autre chose que ce qui est parti.
 */
export function NewPostMediaGrid({
  medias,
  maxCount,
  addDisabled,
  editDisabled,
  showStatus,
  onAdd,
  onMove,
  onRemove,
}: {
  medias: MediaDraft[];
  maxCount: number;
  addDisabled: boolean;
  /** Contenu figé : ni retrait, ni réordonnancement. */
  editDisabled: boolean;
  showStatus: boolean;
  onAdd: () => void;
  onMove: (id: string, direction: MediaMoveDirection) => number;
  onRemove: (id: string) => void;
}) {
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState("");

  // Échap referme le menu d'une vignette.
  useEffect(() => {
    if (menuOuvert === null) return;
    function surTouche(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOuvert(null);
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [menuOuvert]);

  function deplacer(id: string, direction: MediaMoveDirection) {
    const position = onMove(id, direction);
    setAnnonce(POST_NEW_MEDIA_MOVED(position));
    setMenuOuvert(null);
  }

  function retirer(id: string) {
    onRemove(id);
    setMenuOuvert(null);
  }

  const peutAjouter = medias.length < maxCount;

  if (medias.length === 0) {
    return (
      <section className="flex flex-col gap-3 px-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className={`flex min-h-32 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-4 py-5 text-center transition hover:border-yunicity-primary hover:bg-yunicity-primary-soft disabled:opacity-50 ${FOCUS}`}
        >
          <ImagePlus className="h-8 w-8 text-yunicity-primary" aria-hidden />
          <span className="text-sm font-semibold text-yunicity-primary">{POST_NEW_MEDIA_ADD}</span>
          <span className="text-xs text-neutral-600">{POST_NEW_MEDIA_LIMIT_HINT(maxCount)}</span>
        </button>
        <p className={MENTION_DESKTOP}>{POST_NEW_MEDIA_EMPTY_DROP_HINT}</p>
        <p role="status" aria-live="polite" className="sr-only">
          {annonce}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 px-4">
      <div className="grid grid-cols-2 gap-2 min-[640px]:grid-cols-3 min-[640px]:gap-3">
        {medias.map((media, index) => (
          <NewPostMediaTile
            key={media.id}
            media={media}
            index={index}
            total={medias.length}
            menuOpen={!editDisabled && menuOuvert === media.id}
            editDisabled={editDisabled}
            showStatus={showStatus}
            onToggleMenu={() => setMenuOuvert(menuOuvert === media.id ? null : media.id)}
            onForward={() => deplacer(media.id, "forward")}
            onBackward={() => deplacer(media.id, "backward")}
            onMakeFirst={() => deplacer(media.id, "first")}
            onRemove={() => retirer(media.id)}
          />
        ))}

        {peutAjouter ? (
          // Raccourci visuel des planches ; le bouton plein ci-dessous porte
          // le nom accessible, d'où `aria-hidden` et `tabIndex={-1}`.
          <button
            type="button"
            onClick={onAdd}
            disabled={addDisabled}
            aria-hidden
            tabIndex={-1}
            className="flex aspect-[5/4] items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white text-yunicity-primary transition hover:border-yunicity-primary hover:bg-yunicity-primary-soft disabled:opacity-50"
          >
            <ImagePlus className="h-8 w-8" aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="text-center text-xs text-neutral-600">
        {POST_NEW_MEDIA_COUNT(medias.length, maxCount)} · {POST_NEW_MEDIA_FIRST_HINT}
      </p>

      {peutAjouter ? (
        <>
          <button
            type="button"
            onClick={onAdd}
            disabled={addDisabled}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary bg-white px-4 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary-soft disabled:opacity-50 ${FOCUS}`}
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
            {POST_NEW_MEDIA_ADD}
          </button>
          <p className={MENTION_DESKTOP}>{POST_NEW_MEDIA_DROP_HINT}</p>
        </>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {annonce}
      </p>
    </section>
  );
}
