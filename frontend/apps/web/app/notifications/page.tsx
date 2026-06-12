import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsScreen />
    </ProtectedRoute>
  );
}
