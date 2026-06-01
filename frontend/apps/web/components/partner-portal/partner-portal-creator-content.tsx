"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type {
  PartnerCreatorContentManagement,
  PartnerCreatorContentStatus,
} from "@yunicity/types";
import {
  isAuthError,
  partnerPortalCreatorContentStatusLabel,
} from "@yunicity/utils";
import { useCallback, useMemo, useState } from "react";

const STATUS_ORDER: PartnerCreatorContentStatus[] = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
];

function canEditContent(item: PartnerCreatorContentManagement): boolean {
  return item.status === "draft" || item.status === "rejected";
}

function canSubmitContent(item: PartnerCreatorContentManagement): boolean {
  return item.status === "draft" || item.status === "rejected";
}

export function PartnerPortalCreatorContent() {
  const ctx = usePartnerPortalContext();
  const api = useYunicityApi();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const buckets = new Map<PartnerCreatorContentStatus, PartnerCreatorContentManagement[]>();
    for (const status of STATUS_ORDER) {
      buckets.set(status, []);
    }
    for (const item of ctx.creatorContents) {
      const list = buckets.get(item.status) ?? [];
      list.push(item);
      buckets.set(item.status, list);
    }
    return STATUS_ORDER.map((status) => ({
      status,
      items: buckets.get(status) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [ctx.creatorContents]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setMediaUrl("");
    setFormError(null);
    setShowForm(false);
  }, []);

  const startEdit = useCallback((item: PartnerCreatorContentManagement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body ?? "");
    setMediaUrl(item.media_url ?? "");
    setShowForm(true);
    setFormError(null);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!ctx.organization || !title.trim()) {
      setFormError("Le titre est obligatoire.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim() || null,
        media_url: mediaUrl.trim() || null,
      };
      if (editingId) {
        await api.organizationCreatorContent.updateContent(editingId, payload);
      } else {
        await api.organizationCreatorContent.createContent({
          organization_id: ctx.organization.id,
          ...payload,
        });
      }
      resetForm();
      await ctx.reload();
    } catch (err) {
      setFormError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }, [api.organizationCreatorContent, body, ctx, editingId, mediaUrl, resetForm, title]);

  const handleSubmit = useCallback(
    async (contentId: string) => {
      setBusy(true);
      setFormError(null);
      try {
        await api.organizationCreatorContent.submitContent(contentId);
        await ctx.reload();
      } catch (err) {
        setFormError(isAuthError(err) ? err.message : "Soumission impossible.");
      } finally {
        setBusy(false);
      }
    },
    [api.organizationCreatorContent, ctx],
  );

  if (!ctx.organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          {ctx.creatorContents.length} contenu{ctx.creatorContents.length !== 1 ? "s" : ""}
        </p>
        {ctx.canManage ? (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Nouveau contenu
          </button>
        ) : null}
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
        L’approbation et la publication sur le feed sont gérées par l’équipe Yunicity — aucun
        changement de statut simulé ici.
      </p>

      {showForm && ctx.canManage ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">
            {editingId ? "Modifier le contenu" : "Nouveau contenu créateur"}
          </h2>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Texte</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">URL média (optionnel)</span>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSaveDraft()}
              className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Enregistrer brouillon
            </button>
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-neutral-600">
              Annuler
            </button>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </div>
      ) : null}

      {ctx.creatorContents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
          Aucun contenu créateur. Enregistrez un brouillon puis soumettez-le pour validation.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.status}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                {partnerPortalCreatorContentStatusLabel(group.status)}
              </h2>
              <ul className="mt-3 space-y-3">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                    {item.body ? (
                      <p className="mt-2 text-sm text-neutral-600 line-clamp-4">{item.body}</p>
                    ) : null}
                    {item.media_url ? (
                      <p className="mt-2 truncate text-xs text-neutral-500">{item.media_url}</p>
                    ) : null}
                    {item.rejection_reason ? (
                      <p className="mt-2 text-xs text-red-600">Motif : {item.rejection_reason}</p>
                    ) : null}
                    {ctx.canManage && (canEditContent(item) || canSubmitContent(item)) ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canEditContent(item) ? (
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-xs font-semibold text-yunicity-primary hover:underline"
                          >
                            Modifier
                          </button>
                        ) : null}
                        {canSubmitContent(item) ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleSubmit(item.id)}
                            className="rounded-full border border-yunicity-primary/30 px-3 py-1 text-xs font-semibold text-yunicity-primary"
                          >
                            Soumettre pour validation
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
