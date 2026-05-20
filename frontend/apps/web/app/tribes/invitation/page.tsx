import { TribeInvitationScreen } from "@/components/tribes/tribe-invitation-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default async function TribeInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <ProtectedRoute>
        <p className="p-8 text-neutral-600">Lien d’invitation incomplet.</p>
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute>
      <TribeInvitationScreen token={token} />
    </ProtectedRoute>
  );
}
