"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { VerificationBadge } from "@/components/verification-badge";
import { useAuth } from "@/lib/auth/auth-provider";
import type { OrganizationSummary, ProfilePublic } from "@yunicity/types";
import {
  INTEREST_LABELS,
  filterPublicOrganizations,
  fetchPublicProfileAnonymous,
  getWebApiBaseUrl,
  isAuthError,
} from "@yunicity/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username.toLowerCase();
  const { isAuthenticated, yunicityApi } = useAuth();
  const [profile, setProfile] = useState<ProfilePublic | null>(null);
  const [publicOrgs, setPublicOrgs] = useState<OrganizationSummary[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setIsPrivate(false);
      try {
        const data = await fetchPublicProfileAnonymous(getWebApiBaseUrl(), username);
        if (!cancelled) {
          setProfile(data);
        }

        if (isAuthenticated) {
          try {
            const me = await yunicityApi.getProfileMe();
            if (me.username.toLowerCase() === username) {
              const orgs = await yunicityApi.listMyOrganizations();
              if (!cancelled) {
                setPublicOrgs(filterPublicOrganizations(orgs.items));
              }
            }
          } catch {
            /* ignore — orgs optionnelles sur profil public */
          }
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          if (isAuthError(err) && (err.status === 404 || err.code === "PROFILE_NOT_FOUND")) {
            setIsPrivate(true);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [username, isAuthenticated, yunicityApi]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="border-b border-neutral-200/80 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="font-bold text-neutral-900">
            Yunicity
          </Link>
          {isAuthenticated ? (
            <Link href="/profile/me" className="text-sm text-blue-600 hover:underline">
              Mon profil
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Connexion
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        {isLoading ? (
          <p className="text-center text-sm text-neutral-600">Chargement…</p>
        ) : null}

        {isPrivate ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <p className="text-4xl font-light text-neutral-300">404</p>
            <p className="mt-4 font-medium text-neutral-800">Profil introuvable</p>
            <p className="mt-2 text-sm text-neutral-600">
              Ce profil est privé ou n&apos;existe pas.
            </p>
          </div>
        ) : null}

        {profile ? (
          <article className="space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <header className="flex items-center gap-4">
                <ProfileAvatar
                  name={profile.display_name ?? profile.username}
                  size="lg"
                />
                <div>
                  <h1 className="text-xl font-bold">
                    {profile.display_name ?? profile.username}
                  </h1>
                  <p className="text-sm text-neutral-500">@{profile.username}</p>
                  {profile.city ? (
                    <p className="mt-1 text-sm text-neutral-600">{profile.city}</p>
                  ) : null}
                </div>
              </header>
              {profile.bio ? (
                <p className="mt-4 text-neutral-700 leading-relaxed">{profile.bio}</p>
              ) : null}
              {profile.interests.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.interests.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {INTEREST_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {publicOrgs.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Lieux publics
                </h2>
                <ul className="space-y-2">
                  {publicOrgs.map((org) => (
                    <li
                      key={org.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-neutral-500">{org.city}</p>
                      </div>
                      <VerificationBadge status={org.verification_status} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        ) : null}
      </main>
    </div>
  );
}
