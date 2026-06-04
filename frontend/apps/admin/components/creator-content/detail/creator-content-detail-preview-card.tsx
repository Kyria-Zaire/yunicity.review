import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  adminCreatorContentExcerpt,
  creatorContentMediaPreviewDisclaimerCopy,
  isCreatorContentMediaImageUrl,
} from "@yunicity/utils";

interface CreatorContentDetailPreviewCardProps {
  content: PartnerCreatorContentAdmin;
}

export function CreatorContentDetailPreviewCard({
  content,
}: CreatorContentDetailPreviewCardProps) {
  const excerpt = adminCreatorContentExcerpt(content.body, 400);
  const showImage = isCreatorContentMediaImageUrl(content.media_url);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Aperçu contenu
      </h2>
      <p className="mt-2 text-xs text-stone-500">{creatorContentMediaPreviewDisclaimerCopy}</p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-stone-500">Titre</p>
          <p className="mt-1 text-sm font-medium text-stone-900">{content.title}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-stone-500">Extrait</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {excerpt}
          </p>
        </div>
        {content.body && content.body.trim().length > 400 ? (
          <div>
            <p className="text-xs font-medium text-stone-500">Corps complet</p>
            <p className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {content.body.trim()}
            </p>
          </div>
        ) : null}
        {content.media_url ? (
          <div>
            <p className="text-xs font-medium text-stone-500">Média</p>
            <a
              href={content.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
            >
              {content.media_url}
            </a>
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL partenaire externe
              <img
                src={content.media_url}
                alt=""
                className="mt-4 max-h-80 rounded-lg border border-stone-200 object-contain"
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-stone-500">Aucun média associé.</p>
        )}
      </div>
    </section>
  );
}
