"use client";

import type { PostCreatePayload, PostMediaItem } from "@yunicity/types";
import {
  COMPOSER_MEDIA_TIMEOUT,
  composerMediaErrorMessage,
  composerMediaUploadTimeoutMs,
  isComposerAbortError,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { MediaDraft } from "@/lib/feed/post-media-drafts";
import { newClientRequestId } from "@/lib/feed/client-request-id";
import {
  clearPendingRequestId,
  readPendingRequestId,
  writePendingRequestId,
} from "@/lib/feed/pending-request-id";
import { classifyCreationError } from "@/lib/feed/publication-outcome";

export type PublicationState =
  | { kind: "idle" }
  | { kind: "uploading"; done: number; total: number }
  | { kind: "creating" }
  | { kind: "failed"; mediaId: string | null; message: string }
  /** 409 `POST_REQUEST_CONFLICT` — la publication existe déjà. ⛔ Pas rejouable. */
  | { kind: "already_sent" }
  /**
   * La création est partie, aucune réponse n'est revenue (§3.4 bis).
   * ⛔ Ce n'est PAS un échec : la publication peut exister. Action primaire =
   * réessayer, sous la MÊME clé, donc sans doublon possible.
   */
  | { kind: "undetermined" }
  | { kind: "done" };

/**
 * Part du brouillon dont l'envoi dépend réellement — pas tout le hook.
 *
 * `useNewPostDraft()` la satisfait structurellement ; la déclarer ici garde ce
 * module indépendant de la surface historique de l'écran.
 */
/**
 * Échéance de la requête de CRÉATION (I3 de la revue finale). Sans elle, une
 * requête avalée par le réseau laissait l'écran en « création » sans fin. Le
 * délai dépassé mène à l'issue INDÉTERMINÉE — la requête a pu arriver — et la
 * clé est conservée.
 */
export const POST_CREATE_TIMEOUT_MS = 30_000;

export type NewPostPublicationDraft = {
  medias: MediaDraft[];
  canPublish: boolean;
  markUploading: (id: string) => void;
  markUploaded: (id: string, url: string, mediaType: "image" | "video") => void;
  markFailed: (id: string, reason: string) => void;
  /** Lot courant, lu de façon synchrone — voir `useNewPostDraft.mediaIdsNow`. */
  mediaIdsNow: () => string[];
  buildCreatePayload: (uploaded: PostMediaItem[]) => PostCreatePayload;
  /** Empreinte du contenu À ENVOYER (texte + médias ordonnés). */
  contentSignature: () => string;
};

/**
 * @param accountId Compte connecté, sous lequel la clé en attente est isolée.
 *   ⛔ Aucune clé ne traverse une bascule d'utilisateur (§3.4 bis a). `null`
 *   désactive la persistance : la protection se limite à la vie de l'écran.
 */
export function useNewPostPublication(
  draft: NewPostPublicationDraft,
  accountId: string | null,
): {
  state: PublicationState;
  publish: () => void;
  startNewPublication: () => void;
  recoveredPendingKey: boolean;
  submitting: boolean;
  /**
   * Le contenu soumis est FIGÉ : une tentative est en cours, ou une issue est
   * restée inconnue sous la clé courante. Le modifier ferait partir, sous la
   * même clé, un contenu différent de celui qui a peut-être déjà été créé.
   */
  contentLocked: boolean;
} {
  const api = useYunicityApi();
  const router = useRouter();
  const [state, setState] = useState<PublicationState>({ kind: "idle" });
  // Verrou SYNCHRONE : `state` n'est pas encore appliqué quand deux clics
  // arrivent dans le même tick. Couvre le double-clic, RIEN D'AUTRE — une
  // réponse serveur perdue est un autre risque, que couvre la clé ci-dessous.
  const publishingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutsRef = useRef<Set<number>>(new Set());
  const mountedRef = useRef(true);
  /**
   * Une clé par TENTATIVE LOGIQUE, pas par clic : la ref survit aux rendus et
   * aux réessais. Elle n'est renouvelée qu'après un succès — sans quoi le
   * serveur créerait une seconde publication au réessai d'une réponse perdue.
   */
  const requestIdRef = useRef<string | null>(null);
  /**
   * Une issue INDÉTERMINÉE a-t-elle eu lieu sous la clé courante ? (I1)
   *
   * Un 422 ou un 429 prouve que la requête COURANTE n'a rien créé — rien sur
   * une tentative antérieure faite sous la même clé. Tant qu'une issue est
   * restée inconnue sous cette clé, elle ne repart JAMAIS automatiquement :
   * la renouveler pourrait créer un doublon irréparable.
   */
  const issueInconnueSousCleRef = useRef(false);
  // Miroir d'affichage de la ref ci-dessus : l'écran en dépend pour figer.
  const [cleIncertaine, setCleIncertaine] = useState(false);
  const marquerIssueInconnue = useCallback((inconnue: boolean) => {
    issueInconnueSousCleRef.current = inconnue;
    setCleIncertaine(inconnue);
  }, []);
  /**
   * Empreinte du contenu envoyé sous la clé courante. ⛔ Une même clé ne sert
   * jamais à envoyer un contenu modifié : le serveur répondrait 409 — ou, pire,
   * rejouerait une publication que l'utilisateur croit avoir corrigée.
   * `null` : clé retrouvée après rechargement, contenu d'origine inconnu.
   */
  const signatureRef = useRef<string | null>(null);
  const [recoveredPendingKey, setRecoveredPendingKey] = useState(false);

  /**
   * Une tentative précédente a pu partir sans réponse : sa clé survit en
   * `sessionStorage`. On la reprend — ⛔ ELLE SEULE, aucun contenu de brouillon.
   * Une clé d'un autre compte est ignorée et effacée par `readPendingRequestId`.
   */
  useEffect(() => {
    const pending = readPendingRequestId(accountId);
    requestIdRef.current = pending;
    signatureRef.current = null;
    // Une clé retrouvée vient, par construction, d'une issue jamais confirmée.
    issueInconnueSousCleRef.current = pending !== null;
    setCleIncertaine(pending !== null);
    setRecoveredPendingKey(pending !== null);
  }, [accountId]);

  useEffect(() => {
    mountedRef.current = true;
    // La ref n'est jamais réaffectée : la copier ici donne au nettoyage une
    // référence stable sur le MÊME ensemble, ce que la règle react-hooks exige.
    const echeances = timeoutsRef.current;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      for (const echeance of echeances) window.clearTimeout(echeance);
      echeances.clear();
      publishingRef.current = false;
    };
  }, []);

  /** Libère la clé : la tentative suivante en frappera une neuve. */
  const releaseKey = useCallback(() => {
    requestIdRef.current = null;
    signatureRef.current = null;
    marquerIssueInconnue(false);
    clearPendingRequestId();
  }, [marquerIssueInconnue]);

  /**
   * Geste EXPLICITE de l'utilisateur après un 409 ou une issue indéterminée :
   * repartir sur une publication neuve. ⛔ Jamais appelé par le code à sa place.
   */
  const startNewPublication = useCallback(() => {
    releaseKey();
    setRecoveredPendingKey(false);
    setState({ kind: "idle" });
  }, [releaseKey]);

  const publish = useCallback(() => {
    if (publishingRef.current) return;
    if (!draft.canPublish) return;

    const signature = draft.contentSignature();
    const contenuModifie =
      requestIdRef.current !== null &&
      signatureRef.current !== null &&
      signatureRef.current !== signature;
    if (contenuModifie) {
      if (issueInconnueSousCleRef.current) {
        // ⛔ Défense en profondeur — l'écran fige déjà le contenu dans ce cas.
        // Une tentative a peut-être abouti sous cette clé : rien ne part, et
        // l'incertitude reste affichée.
        setState({ kind: "undetermined" });
        return;
      }
      // Aucune issue incertaine : la tentative précédente n'a rien créé. Un
      // contenu nouveau est une tentative nouvelle — clé neuve.
      releaseKey();
    }
    publishingRef.current = true;

    /**
     * UN contrôleur par TENTATIVE, partagé par ses envois séquentiels : une
     * seule requête est en vol à la fois, et l'échec de l'une termine la
     * tentative. Quitter l'écran ou dépasser une échéance annule tout le lot.
     */
    const controller = new AbortController();
    controllerRef.current = controller;
    if (requestIdRef.current === null) {
      requestIdRef.current = newClientRequestId();
      marquerIssueInconnue(false);
    }
    signatureRef.current = signature;

    void (async () => {
      try {
        // Instantané pris AVANT la boucle : un média ajouté pendant l'envoi
        // n'appartient pas à cette tentative (l'ajout est d'ailleurs inerte
        // pendant l'envoi, voir l'écran).
        const lot = draft.medias;
        const restants = lot.filter((item) => item.status.kind !== "uploaded");
        let envoyes = lot.length - restants.length;

        /**
         * ⚠️ Les URL s'accumulent ICI, pas dans l'état.
         *
         * `draft` est figé au rendu du clic : `draft.medias` ne verra jamais les
         * `markUploaded` de cette boucle. Lire l'état pour construire le payload
         * enverrait `media_urls: []`.
         *
         * On AMORCE avec ce qui était déjà passé lors d'une tentative
         * précédente — c'est ce qui rend la reprise possible. Indexées par
         * identité : l'ordre publié est recomposé à la fin depuis le lot
         * VISIBLE, pas depuis l'ordre d'envoi.
         */
        const transferes = new Map<string, PostMediaItem>();
        for (const item of lot) {
          if (item.status.kind === "uploaded") {
            transferes.set(item.id, { url: item.status.url, media_type: item.status.mediaType });
          }
        }
        const estToujoursJoint = (id: string) => draft.mediaIdsNow().includes(id);

        for (const item of restants) {
          if (controller.signal.aborted) return;
          // I8 : un média retiré pendant l'envoi ne part pas.
          if (!estToujoursJoint(item.id)) continue;
          setState({ kind: "uploading", done: envoyes, total: lot.length });
          draft.markUploading(item.id);
          // Budget de temps proportionnel à la taille : un délai fixe condamne
          // un média conforme sur un lien mobile lent.
          const echeance = window.setTimeout(
            () => controller.abort(),
            composerMediaUploadTimeoutMs(item.file.size),
          );
          timeoutsRef.current.add(echeance);
          try {
            const reponse = await api.uploadPostMedia(item.file, controller.signal);
            if (!mountedRef.current) return;
            // L'état sert l'AFFICHAGE de la vignette ; la table locale sert le
            // PAYLOAD. Les deux sont nécessaires, pour deux raisons.
            draft.markUploaded(item.id, reponse.url, reponse.media_type);
            transferes.set(item.id, { url: reponse.url, media_type: reponse.media_type });
            envoyes += 1;
          } catch (erreur) {
            if (!mountedRef.current) return;
            const message =
              controller.signal.aborted || isComposerAbortError(erreur)
                ? COMPOSER_MEDIA_TIMEOUT
                : composerMediaErrorMessage(erreur);
            draft.markFailed(item.id, message);
            setState({ kind: "failed", mediaId: item.id, message });
            return;
          } finally {
            window.clearTimeout(echeance);
            timeoutsRef.current.delete(echeance);
          }
        }

        // I8 : seul ce qui est ENCORE joint est publié, dans l'ordre affiché.
        const publies = draft
          .mediaIdsNow()
          .flatMap((id) => {
            const media = transferes.get(id);
            return media ? [media] : [];
          });

        setState({ kind: "creating" });
        const cle = requestIdRef.current;
        // La clé est persistée AVANT l'appel : c'est à cet instant que l'issue
        // peut devenir inconnue, y compris si l'onglet se ferme en plein vol.
        if (cle !== null) writePendingRequestId(accountId, cle);
        // 200 (rejeu) comme 201 (création) sont des succès : le client ne
        // distingue pas, le serveur a tranché dans les deux cas.
        // I3 : l'attente est bornée. Un délai dépassé est une issue INCONNUE,
        // jamais un échec — `classifyCreationError` la classe ainsi.
        const echeanceCreation = window.setTimeout(() => controller.abort(), POST_CREATE_TIMEOUT_MS);
        timeoutsRef.current.add(echeanceCreation);
        try {
          await api.createFeedPost(
            { ...draft.buildCreatePayload(publies), client_request_id: cle },
            controller.signal,
          );
        } finally {
          window.clearTimeout(echeanceCreation);
          timeoutsRef.current.delete(echeanceCreation);
        }
        // ⚠️ Le succès est acquis côté serveur même si l'écran a été quitté :
        // la clé doit être libérée avant toute garde de démontage.
        releaseKey();
        if (!mountedRef.current) return;
        setState({ kind: "done" });
        router.push("/feed");
        router.refresh();
      } catch (erreur) {
        const issue = classifyCreationError(erreur);
        // ⛔ Le sort de la clé se décide même si l'écran est démonté : c'est la
        // seule protection contre le doublon, et elle ne dépend pas de l'UI.
        if (issue.kind === "undetermined") marquerIssueInconnue(true);
        // I1 : la clé ne repart que si l'issue de TOUTES les tentatives faites
        // sous elle est certaine.
        if (issue.kind === "rejected" && issue.renewKey && !issueInconnueSousCleRef.current) {
          releaseKey();
        }
        if (!mountedRef.current) return;
        if (issue.kind === "already_sent") {
          // ⛔ Aucune republication automatique, aucun effacement silencieux :
          // la clé n'est libérée que par `startNewPublication`.
          setState({ kind: "already_sent" });
          return;
        }
        if (issue.kind === "undetermined") {
          setState({ kind: "undetermined" });
          return;
        }
        // Même traduction que les échecs d'envoi média : un 429 sur la création
        // doit lire « vous avez beaucoup publié », pas une erreur générique.
        setState({ kind: "failed", mediaId: null, message: composerMediaErrorMessage(erreur) });
      } finally {
        publishingRef.current = false;
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    })();
  }, [accountId, api, draft, marquerIssueInconnue, releaseKey, router]);

  return {
    state,
    publish,
    startNewPublication,
    recoveredPendingKey,
    submitting: state.kind === "uploading" || state.kind === "creating",
    contentLocked:
      state.kind === "uploading" ||
      state.kind === "creating" ||
      state.kind === "undetermined" ||
      (state.kind === "failed" && cleIncertaine),
  };
}
