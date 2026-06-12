import { CreatorContentDetailScreen } from "@/components/creators/creator-content-detail-screen";
import { CreatorContentDetailSkeleton } from "@/components/creators/creator-content-detail-skeleton";
import { buildPageMetadata, plainTextExcerpt, truncateForMeta } from "@/lib/seo/metadata";
import { fetchCreatorContentForSeo } from "@/lib/seo/public-fetch";
import { resolveMediaUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { Suspense } from "react";

type CreatorContentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CreatorContentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/creator-content/${id}`;
  const content = await fetchCreatorContentForSeo(id);

  if (!content) {
    return buildPageMetadata({
      title: "Contenu introuvable",
      description: "Ce contenu créateur n'est pas disponible sur Yunicity.",
      path,
      noIndex: true,
    });
  }

  const title = `${content.title} — ${content.author.display_name}`;
  const description = truncateForMeta(
    plainTextExcerpt(content.body) ||
      `${content.title} par ${content.author.display_name} à ${content.city}.`,
  );
  const image = resolveMediaUrl(content.cover);

  return buildPageMetadata({
    title,
    description,
    path,
    image,
    imageAlt: content.title,
    type: "article",
  });
}

export default async function CreatorContentDetailPage({ params }: CreatorContentDetailPageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorContentDetailSkeleton />
          </div>
        </div>
      }
    >
      <CreatorContentDetailScreen contentId={id} />
    </Suspense>
  );
}
