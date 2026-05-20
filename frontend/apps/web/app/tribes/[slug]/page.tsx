import { TribeDetailScreen } from "@/components/tribes/tribe-detail-screen";

export default async function TribeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const { slug } = await params;
  const { city } = await searchParams;
  return <TribeDetailScreen slug={slug} city={city ?? "Reims"} />;
}
