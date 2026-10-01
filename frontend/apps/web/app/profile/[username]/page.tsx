"use client";

import { ProfilePublicPortalScreen } from "@/components/profile/profile-public-portal-screen";
import { PROFILE_ME_HREF } from "@yunicity/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const username = params.username;

  useEffect(() => {
    if (username.toLowerCase() === "me") {
      router.replace(PROFILE_ME_HREF);
    }
  }, [router, username]);

  if (username.toLowerCase() === "me") {
    return null;
  }

  return <ProfilePublicPortalScreen kind="username" username={username} />;
}
