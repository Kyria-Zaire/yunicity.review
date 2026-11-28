"use client";

import { ProfilePublicPortalScreen } from "@/components/profile/profile-public-portal-screen";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();

  return <ProfilePublicPortalScreen kind="userId" userId={params.id} />;
}
