import { PlaceDetailScreen } from "@/components/places/place-detail-screen";

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
};

export default async function PlaceDetailPage({ params, searchParams }: PlaceDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  return <PlaceDetailScreen slug={slug} city={query.city?.trim() ?? ""} />;
}
