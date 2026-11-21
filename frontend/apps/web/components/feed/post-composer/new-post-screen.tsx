"use client";

import { FeedMediumHeader } from "@/components/feed/portal/feed-medium-header";
import { NewPostAlreadySent } from "@/components/feed/post-composer/new-post-already-sent";
import { NewPostAuthorLine } from "@/components/feed/post-composer/new-post-author-line";
import { NewPostBodyField } from "@/components/feed/post-composer/new-post-body-field";
import { NewPostDiscardDialog } from "@/components/feed/post-composer/new-post-discard-dialog";
import { NewPostDropCard } from "@/components/feed/post-composer/new-post-drop-card";
import { NewPostHeader } from "@/components/feed/post-composer/new-post-header";
import { NewPostMediaGrid } from "@/components/feed/post-composer/new-post-media-grid";
import { NewPostRejectedFiles } from "@/components/feed/post-composer/new-post-rejected-files";
import { NewPostShell } from "@/components/feed/post-composer/new-post-shell";
import { NewPostUndetermined } from "@/components/feed/post-composer/new-post-undetermined";
import {
  NewPostUploadFailure,
  type NewPostFailureCause,
} from "@/components/feed/post-composer/new-post-upload-failure";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";
import { useNewPostLeave } from "@/hooks/use-new-post-leave";
import { useNewPostPublication } from "@/hooks/use-new-post-publication";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  POST_MEDIA_MAX_COUNT,
  POST_NEW_PENDING_KEY_NOTICE,
  POST_NEW_SELECTION_EMPTY,
  POST_NEW_UPLOAD_PROGRESS,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * `/feed/new` — **une composition unique adaptée aux trois formats**, fidèle
 * aux deux planches validées par Kyria le 2026-11-03.
 *
 * L'écran **assemble**, point : l'état du brouillon vit dans `useNewPostDraft`,
 * l'envoi dans `useNewPostPublication`, la sortie confirmée dans
 * `useNewPostLeave`. C'est la bascule sur `useNewPostPublication` qui rend la
 * clé d'idempotence RÉELLE en production.
 *
 * ⛔ Plus de double arbre mobile/desktop départagé par CSS : les deux étaient
 * montés en même temps, d'où deux boutons « Publier » dans l'arbre
 * d'accessibilité et deux champs de saisie à renseigner.
 */
export function NewPostScreen() {
  const router = useRouter();
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState("Reims");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const draft = useNewPostDraft(city);
  // La clé en attente est isolée par compte : aucune ne traverse une bascule
  // d'utilisateur (§3.4 bis a du contrat).
  const publication = useNewPostPublication(draft, user?.id ?? null);
  const state = publication.state;
  const sortie = useNewPostLeave({ hasContent: draft.hasContent, state });

  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";

  useEffect(() => {
    void api
      .getProfileMe()
      .then((profile) => {
        setDisplayName(profile.display_name ?? profile.username ?? null);
        setAvatarUrl(profile.avatar_url ?? null);
        if (profile.city) setCity(profile.city);
      })
      .catch(() => {
        /* ProtectedRoute gère la session */
      });
  }, [api]);

  /**
   * `state.done` compte les envois TERMINÉS ; l'utilisateur, lui, lit un rang.
   * Afficher `done` brut donnait « Envoi 0 sur 2 » au démarrage. On annonce donc
   * le fichier EN COURS, borné au total.
   */
  const progressLabel =
    state.kind === "uploading"
      ? POST_NEW_UPLOAD_PROGRESS(Math.min(state.done + 1, state.total), state.total)
      : null;

  const echec = state.kind === "failed" ? state : null;
  const causeEchec: NewPostFailureCause | null = (() => {
    if (echec === null) return null;
    if (echec.mediaId === null) return { kind: "creation" };
    const index = draft.medias.findIndex((media) => media.id === echec.mediaId);
    const media = draft.medias[index];
    // Le média en échec a été retiré : l'échec n'a plus d'objet à l'écran.
    if (!media) return null;
    return {
      kind: "media",
      mediaKind: media.mediaType === "video" ? "vidéo" : "photo",
      rank: index + 1,
      fileName: media.file.name,
    };
  })();

  /**
   * « Publier » est inerte quand une autre action est LA réponse attendue :
   * réessayer (échec, issue inconnue) ou ouvrir le fil (409). Deux boutons qui
   * font la même chose divisaient l'attention (planche « Échec partiel »).
   *
   * Acquis MEDIA-01 : un fichier refusé **bloque** la publication tant qu'il
   * n'est pas arbitré — « Continuer sans eux » débloque, explicitement.
   */
  const publierActif =
    draft.canPublish &&
    !draft.mediaRejected &&
    (state.kind === "idle" || state.kind === "done" || (echec !== null && causeEchec === null));

  return (
    <NewPostShell>
      {/* Barre de contenu medium (640 → 1023 px) de la planche : identité, ville,
          recherche — sans « Filtrer », qui n'a pas d'objet ici. */}
      <FeedMediumHeader city={city} />
      <div className="mx-auto w-full max-w-3xl pb-6 pt-2 min-[640px]:pt-4 min-[1024px]:pt-6">
        <NewPostDropCard disabled={publication.contentLocked} onFiles={draft.addFiles}>
          <NewPostHeader
            canPublish={publierActif}
            submitting={publication.submitting}
            progressLabel={progressLabel}
            onBack={sortie.quitter}
            onPublish={publication.publish}
          />

          <NewPostAuthorLine authorLabel={authorLabel} avatarUrl={avatarUrl} />

          <div className="flex flex-col gap-4">
            <NewPostBodyField
              value={draft.body}
              onChange={draft.setBody}
              city={city}
              charCount={draft.charCount}
              locked={publication.contentLocked}
            />

            <NewPostMediaGrid
              medias={draft.medias}
              maxCount={POST_MEDIA_MAX_COUNT}
              addDisabled={publication.contentLocked}
              editDisabled={publication.contentLocked}
              showStatus={state.kind !== "idle" && draft.medias.some((m) => m.status.kind !== "selected")}
              onAdd={() => draft.fileInputRef.current?.click()}
              onMove={draft.moveMedia}
              onRemove={draft.removeMedia}
            />

            {publication.recoveredPendingKey && state.kind === "idle" ? (
              // ⛔ Jamais « brouillon restauré » : rien du contenu n'est revenu.
              // On nomme l'incertitude et on renvoie au fil (§3.4 bis d).
              <p
                role="status"
                className="mx-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs leading-5 text-neutral-600"
              >
                {POST_NEW_PENDING_KEY_NOTICE}
              </p>
            ) : null}

            {draft.selectionEmpty ? (
              <p
                role="status"
                className="mx-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-5 text-neutral-700"
              >
                {POST_NEW_SELECTION_EMPTY}
              </p>
            ) : null}

            <NewPostRejectedFiles
              files={draft.rejectedFiles}
              onChooseOthers={() => draft.fileInputRef.current?.click()}
              onDismiss={draft.dismissRejectedFiles}
            />

            {state.kind === "already_sent" ? (
              <NewPostAlreadySent
                onOpenFeed={() => router.push("/feed")}
                onStartNew={publication.startNewPublication}
              />
            ) : null}

            {state.kind === "undetermined" ? (
              <NewPostUndetermined
                onRetry={publication.publish}
                onOpenFeed={() => router.push("/feed")}
              />
            ) : null}

            {echec !== null && causeEchec !== null ? (
              <NewPostUploadFailure
                cause={causeEchec}
                message={echec.message}
                mediaCount={draft.medias.length}
                hasUploadedMedia={draft.medias.some((m) => m.status.kind === "uploaded")}
                onRetry={publication.publish}
              />
            ) : null}
          </div>
        </NewPostDropCard>
      </div>

      <input
        ref={draft.fileInputRef}
        type="file"
        accept={draft.acceptedTypes}
        multiple
        className="sr-only"
        onChange={(event) => {
          draft.addFiles(event.target.files);
          // Réinitialiser permet de resélectionner le MÊME fichier après un
          // refus : sans cela, `change` ne se déclenche pas une seconde fois.
          event.target.value = "";
        }}
      />

      <NewPostDiscardDialog
        open={sortie.open}
        variant={sortie.variant}
        onConfirm={sortie.confirmer}
        onCancel={sortie.rester}
      />
    </NewPostShell>
  );
}
