import { CreatorProfileScreen } from "@/components/creators/creator-profile-screen";
import { CreatorProfileSkeleton } from "@/components/creators/creator-profile-skeleton";
import { buildPageMetadata, plainTextExcerpt, truncateForMeta } from "@/lib/seo/metadata";
import { fetchCreatorProfileForSeo } from "@/lib/seo/public-fetch";
import { resolveMediaUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { Suspense } from "react";

type CreatorProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CreatorProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/creators/${id}`;
  const profile = await fetchCreatorProfileForSeo(id);

  if (!profile) {
    return buildPageMetadata({
      title: "Créateur introuvable",
      description: "Ce profil créateur n'est pas disponible sur Yunicity.",
      path,
      noIndex: true,
    });
  }

  const city = profile.territory.city || "Reims";
  const title = `${profile.display_name} — créateur·rice à ${city}`;
  const description = truncateForMeta(
    plainTextExcerpt(profile.description) ||
      `Découvrez les contenus de ${profile.display_name} sur la scène locale de ${city}.`,
  );
  const image = resolveMediaUrl(profile.banner_url || profile.logo_url);

  return buildPageMetadata({
    title,
    description,
    path,
    image,
    imageAlt: profile.display_name,
  });
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorProfileSkeleton />
          </div>
        </div>
      }
    >
      <CreatorProfileScreen creatorId={id} />
    </Suspense>
  );
}
