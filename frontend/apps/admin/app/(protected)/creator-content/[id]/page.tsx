"use client";

import { CreatorContentStatusBadge } from "@/components/creator-content-status-badge";
import { useAdminCreatorContentDetail } from "@/lib/hooks/use-admin-creator-content";
import { formatDate } from "@/lib/format";
import {
  adminCreatorContentAuthorLabel,
  adminCreatorContentExcerpt,
  buildCreatorContentListBackPath,
  canAdminApproveCreatorContent,
  canAdminRejectCreatorContent,
} from "@yunicity/utils";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function CreatorContentDetailPageContent() {
  const params = useParams<{ id: string }>();
  const contentId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = useMemo(() => buildCreatorContentListBackPath(searchParams), [searchParams]);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const {
    content,
    isLoading,
    error,
    isModerating,
    actionError,
    successMessage,
    approve,
    reject,
  } = useAdminCreatorContentDetail(contentId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du contenu…</p>;
  }

  if (error || !content) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
          ← Contenus créateurs
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Contenu introuvable."}
        </div>
      </div>
    );
  }

  const canApprove = canAdminApproveCreatorContent(content.status);
  const canReject = canAdminRejectCreatorContent(content.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
        ← Contenus créateurs
      </Link>

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </p>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{content.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.organization.name} · {content.organization.city}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Auteur : {adminCreatorContentAuthorLabel(content.author)}
          </p>
        </div>
        <CreatorContentStatusBadge status={content.status} />
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Résumé
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {adminCreatorContentExcerpt(content.body, 280)}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Créé le</dt>
            <dd>{formatDate(content.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Soumis le</dt>
            <dd>{content.submitted_at ? formatDate(content.submitted_at) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Dernière mise à jour</dt>
            <dd>{formatDate(content.updated_at)}</dd>
          </div>
        </dl>
      </section>

      {content.body ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contenu
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {content.body}
          </p>
        </section>
      ) : null}

      {content.media_url ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Média
          </h3>
          <a
            href={content.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm text-yunicity-primary hover:underline"
          >
            {content.media_url}
          </a>
          {content.media_url.match(/\.(png|jpe?g|gif|webp)(\?|$)/i) ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL partenaire externe
            <img
              src={content.media_url}
              alt=""
              className="mt-4 max-h-80 rounded-lg border border-border object-contain"
            />
          ) : null}
        </section>
      ) : null}

      {content.rejection_reason ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Motif du refus : {content.rejection_reason}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Modération
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Lecture seule — l&apos;approbation déclenche la publication et la synchronisation feed
          existante.
        </p>
        {actionError ? <p className="mt-2 text-sm text-red-600">{actionError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {canApprove ? (
            <button
              type="button"
              disabled={isModerating}
              onClick={() => void approve()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approuver
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              disabled={isModerating}
              onClick={() => setShowReject((v) => !v)}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900"
            >
              Rejeter
            </button>
          ) : null}
        </div>
        {showReject ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus (obligatoire, visible partenaire)…"
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isModerating || !rejectReason.trim()}
              onClick={() =>
                void reject({ reason: rejectReason.trim() }).then(() => {
                  setShowReject(false);
                  setRejectReason("");
                })
              }
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Confirmer le refus
            </button>
          </div>
        ) : null}
      </section>

      {content.status === "published" ? (
        <p className="text-xs text-muted-foreground">
          Ce contenu est visible sur la fiche partenaire et dans le feed (sync existante).
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="text-sm text-muted-foreground hover:underline"
      >
        Retour à la liste
      </button>
    </div>
  );
}

export default function CreatorContentDetailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Chargement du contenu…</p>}
    >
      <CreatorContentDetailPageContent />
    </Suspense>
  );
}
