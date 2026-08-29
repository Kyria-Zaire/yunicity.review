"use client";

import type {
  CommentCreatePayload,
  CommentListResponse,
  EventInterestToggleResponse,
  FeedComment,
  FeedListParams,
  FeedPost,
  FeedReportReason,
} from "@yunicity/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CitizenPostCard } from "@/components/feed/citizen-post-card";
import { CommentComposer } from "@/components/feed/comment-composer";
import { CommentList } from "@/components/feed/comment-list";
import { FeedCardShell } from "@/components/feed/feed-card-shell";
import { FeedPublicationSocialActions } from "@/components/feed/feed-publication-actions";
import { EventFeedCard } from "@/components/events/event-feed-card";
import { OfferFeedCard } from "@/components/feed/offer-feed-card";
import { OrganizationPostCard } from "@/components/feed/organization-post-card";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

function feedCardVariant(
  post: FeedPost,
): "default" | "event" | "offer" | "organization" | "partner_creator" {
  if (post.type === "offer") return "offer";
  if (post.type === "event") return "event";
  if (post.type === "partner_creator") return "partner_creator";
  if (post.author.type === "organization") return "organization";
  return "default";
}

function FeedCardBody({
  post,
  currentUserId,
  onReport,
  onToggleEventInterest,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
  onToggleEventInterest?: () => Promise<void>;
}) {
  if (post.type === "offer") {
    return <OfferFeedCard post={post} currentUserId={currentUserId} onReport={onReport} />;
  }
  if (post.type === "event") {
    return (
      <EventFeedCard
        post={post}
        currentUserId={currentUserId}
        onReport={onReport}
        onToggleEventInterest={onToggleEventInterest}
      />
    );
  }
  if (post.type === "partner_creator" || post.author.type === "organization") {
    return <OrganizationPostCard post={post} currentUserId={currentUserId} onReport={onReport} />;
  }
  return <CitizenPostCard post={post} currentUserId={currentUserId} onReport={onReport} />;
}

/**
 * Dépendances applicatives de la carte (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-TER).
 *
 * ── Pourquoi ce contrat ──────────────────────────────────────────────────────
 * `FeedCard` appelait `useYunicityApi()` et `useAuth()` dans son corps : il
 * n'était donc montable que sous les providers de l'application. Le harnais E2E
 * crée une racine React SÉPARÉE, hors de l'arbre de contexte — les cinq familles
 * de publication (dont événement, offre et vidéo, absentes de la baseline QA)
 * n'étaient donc prouvables nulle part.
 *
 * Le contrat ci-dessous est le PLUS PETIT utile : quatre méthodes et un
 * identifiant, relevés par lecture du corps de la carte. Injecter les providers
 * entiers aurait fait dépendre la vue de surfaces qu'elle n'utilise pas.
 */
export type FeedCardDependencies = {
  listComments: (postId: string, params: FeedListParams) => Promise<CommentListResponse>;
  createComment: (postId: string, payload: CommentCreatePayload) => Promise<FeedComment>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleEventInterest: (eventId: string) => Promise<EventInterestToggleResponse>;
  /** Identité du lecteur — sert uniquement à autoriser la suppression d'un commentaire. */
  currentUserId: string | null;
};

/**
 * Conteneur applicatif — SEUL point qui touche aux providers.
 *
 * Il traduit `useYunicityApi()` et `useAuth()` en `FeedCardDependencies`, puis
 * rend la vue. Son API publique n'a pas bougé : Feed, Discussions et le mur de
 * Tribu montent toujours `<FeedCard …/>` sans rien changer.
 */
export function FeedCard(props: {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  openCommentsByDefault?: boolean;
}) {
  const api = useYunicityApi();
  const { user } = useAuth();

  const dependencies: FeedCardDependencies = useMemo(
    () => ({
      listComments: (postId, params) => api.listFeedComments(postId, params),
      createComment: (postId, payload) => api.createFeedComment(postId, payload),
      deleteComment: (commentId) => api.deleteFeedComment(commentId),
      toggleEventInterest: (eventId) => api.toggleEventInterest(eventId),
      currentUserId: user?.id ?? null,
    }),
    [api, user?.id],
  );

  return <FeedCardWithDependencies {...props} dependencies={dependencies} />;
}

/**
 * Vue fonctionnelle — n'appelle NI `useAuth` NI `useYunicityApi`.
 *
 * Réservée au conteneur ci-dessus, aux tests unitaires et au harnais E2E. Les
 * consommateurs produit ne la montent jamais directement. Elle utilise
 * exactement les mêmes composants et le même CSS que la carte de production :
 * ce qui est prouvé sur elle est vrai du produit.
 */
export function FeedCardWithDependencies({
  post: initialPost,
  onToggleLike,
  onReport,
  openCommentsByDefault = false,
  dependencies,
}: {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  openCommentsByDefault?: boolean;
  dependencies: FeedCardDependencies;
}) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const [commentsOpen, setCommentsOpen] = useState(openCommentsByDefault);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const response = await dependencies.listComments(post.id, { limit: 50 });
      setComments(response.items);
    } finally {
      setCommentsLoading(false);
    }
  }, [dependencies, post.id]);

  useEffect(() => {
    if (!openCommentsByDefault) return;
    setCommentsOpen(true);
    void loadComments();
  }, [openCommentsByDefault, loadComments]);

  async function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) {
      await loadComments();
    }
  }

  async function addComment(body: string) {
    const created = await dependencies.createComment(post.id, { body });
    setComments((prev) => [...prev, created]);
    setPost((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
  }

  async function removeComment(commentId: string) {
    await dependencies.deleteComment(commentId);
    await loadComments();
    setPost((prev) => ({ ...prev, comment_count: Math.max(0, prev.comment_count - 1) }));
  }

  async function toggleEventInterest() {
    const eventId = post.event?.local_event_id;
    if (!eventId) {
      return;
    }
    const result = await dependencies.toggleEventInterest(eventId);
    setPost((prev) => {
      if (!prev.event) {
        return prev;
      }
      return {
        ...prev,
        event: { ...prev.event, interested_by_me: result.interested },
      };
    });
  }

  /*
   * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A : une seule barre sociale. `Signaler`
   * n'y figure plus — il vit dans le menu `…` de l'en-tete, seul chemin de
   * signalement, identique sur les trois bandes.
   */
  const footer =
    post.type === "event" ? null : (
      <FeedPublicationSocialActions
        post={post}
        commentsOpen={commentsOpen}
        onToggleLike={() => void onToggleLike(post)}
        onToggleComments={() => void toggleComments()}
      />
    );

  return (
    <FeedCardShell
      variant={feedCardVariant(post)}
      footer={footer}
      expanded={
        commentsOpen ? (
          <>
            {commentsLoading ? (
              <p className="text-sm text-neutral-500">Chargement des commentaires…</p>
            ) : (
              <CommentList
                comments={comments}
                currentUserId={dependencies.currentUserId ?? undefined}
                onDelete={removeComment}
              />
            )}
            <CommentComposer onSubmit={addComment} />
          </>
        ) : undefined
      }
    >
      <FeedCardBody
        post={post}
        currentUserId={dependencies.currentUserId}
        onReport={(reason) => onReport(post.id, reason)}
        onToggleEventInterest={
          post.type === "event" && post.event ? () => toggleEventInterest() : undefined
        }
      />
    </FeedCardShell>
  );
}
