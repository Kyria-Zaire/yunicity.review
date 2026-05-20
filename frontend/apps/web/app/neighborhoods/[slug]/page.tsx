import { NeighborhoodDetailScreen } from "@/components/neighborhoods/neighborhood-detail-screen";

export default async function NeighborhoodDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const { slug } = await params;
  const { city } = await searchParams;
  return <NeighborhoodDetailScreen slug={slug} city={city ?? "Reims"} />;
}
