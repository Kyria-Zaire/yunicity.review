import { ProfileEditScreen } from "@/components/profile/edit/profile-edit-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <ProfileEditScreen />
    </ProtectedRoute>
  );
}
