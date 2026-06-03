"use client";

import { partnerPublicPlaceUrl } from "@/lib/partners-workspace";
import type { AdminPartnerLinks } from "@yunicity/types";
import Link from "next/link";

interface PartnerDetailLinksProps {
  links: AdminPartnerLinks;
  city: string;
}

function AdminLinkItem({
  label,
  href,
  description,
}: {
  label: string;
  href: string | null;
  description: string;
}) {
  if (!href?.trim()) {
    return (
      <div className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3 opacity-60">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-xs text-stone-400">{description} — indisponible</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
    >
      <p className="text-sm font-medium text-stone-900">{label}</p>
      <p className="mt-1 font-mono text-xs text-stone-500">{href}</p>
      <p className="mt-1 text-xs text-stone-500">{description}</p>
    </Link>
  );
}

export function PartnerDetailLinks({ links, city }: PartnerDetailLinksProps) {
  const publicUrl = partnerPublicPlaceUrl(links.public_place_slug, city);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Liens admin & public
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminLinkItem
          label="Modération offres"
          href={links.offers_admin}
          description="File offres passport pour cette organisation"
        />
        <AdminLinkItem
          label="Contenus créateurs"
          href={links.creator_content_admin}
          description="Espace modération contenus partenaires"
        />
        <AdminLinkItem
          label="File de vérification"
          href={links.verification_queue}
          description="Retour à l'onglet vérifications avec focus organisation"
        />
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
        >
          <p className="text-sm font-medium text-stone-900">Fiche publique (web citoyen)</p>
          <p className="mt-1 font-mono text-xs text-stone-500">{links.public_place_slug}</p>
          <p className="mt-1 text-xs text-stone-500">Ouvre le lieu public dans un nouvel onglet</p>
        </a>
      </div>
    </section>
  );
}
