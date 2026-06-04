"use client";

import type { AdminLocalEventDetail } from "@yunicity/types";
import { buildPublicEventUrl } from "@yunicity/utils";

interface EventDetailLinksSectionProps {
  event: AdminLocalEventDetail;
}

export function EventDetailLinksSection({ event }: EventDetailLinksSectionProps) {
  const webBase = process.env.NEXT_PUBLIC_WEB_APP_URL;
  const publicUrl = buildPublicEventUrl(event.id, webBase);
  const hasAbsoluteUrl = Boolean(webBase?.trim());

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Aperçu public & liens
      </h2>
      {hasAbsoluteUrl ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
        >
          <p className="text-sm font-medium text-stone-900">Fiche événement (web citoyen)</p>
          <p className="mt-1 font-mono text-xs text-stone-500">{publicUrl}</p>
          <p className="mt-1 text-xs text-stone-500">Ouvre l&apos;événement public dans un nouvel onglet</p>
        </a>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3">
          <p className="text-sm font-medium text-stone-700">Lien public</p>
          <p className="mt-1 font-mono text-xs text-stone-500">{publicUrl}</p>
          <p className="mt-2 text-xs text-stone-500">
            Définissez <code className="text-xs">NEXT_PUBLIC_WEB_APP_URL</code> pour ouvrir le web
            citoyen depuis l&apos;admin.
          </p>
        </div>
      )}
    </section>
  );
}
