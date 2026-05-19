"use client";

import { ProfilePageAside } from "@/components/layout/web-page-asides";
import { WebAppShell } from "@/components/layout";
import { InterestPicker } from "@/components/interest-picker";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProtectedRoute } from "@/components/protected-route";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { ProfileMe, ProfileVisibility } from "@yunicity/types";
import { VISIBILITY_OPTIONS, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

function ProfileMeContent() {
  const api = useYunicityApi();
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProfileMe();
      setProfile(data);
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
      setCity(data.city ?? "");
      setInterests(data.interests);
      setVisibility(data.visibility);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger le profil.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await api.updateProfileMe({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        interests,
        visibility,
      });
      setProfile(updated);
      setMessage("Profil mis à jour.");
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Échec de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteOnboarding() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.completeProfileOnboarding({
        city: city.trim() || undefined,
        interests,
      });
      setProfile(updated);
      setMessage("Bienvenue sur Yunicity — ton profil est activé.");
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Complète ville et au moins un intérêt.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <WebAppShell header={{ title: "Mon profil" }} context={<ProfilePageAside />} contentWidth="readable">
        <p className="text-sm text-neutral-600">Chargement…</p>
      </WebAppShell>
    );
  }

  if (!profile) {
    return (
      <WebAppShell header={{ title: "Mon profil" }} context={<ProfilePageAside />} contentWidth="readable">
        <p className="text-sm text-red-600">{error}</p>
      </WebAppShell>
    );
  }

  return (
    <WebAppShell
      header={{
        title: "Mon profil",
        subtitle: "Ton identité sociale sur le réseau local.",
      }}
      context={<ProfilePageAside />}
      contentWidth="readable"
    >
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <ProfileAvatar name={profile.display_name ?? profile.username} size="md" />
        <div>
          <p className="text-lg font-semibold">{profile.display_name ?? profile.username}</p>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          <Link
            href={`/profile/${profile.username}`}
            className="mt-1 inline-block text-sm text-yunicity-primary hover:underline"
          >
            Voir le profil public
          </Link>
        </div>
      </div>

      {!profile.onboarding_completed ? (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <h2 className="font-semibold text-amber-900">Active ton profil</h2>
          <p className="mt-1 text-sm text-amber-800">
            Choisis ta ville et au moins un centre d&apos;intérêt pour rejoindre la communauté.
          </p>
          <button
            type="button"
            onClick={() => void handleCompleteOnboarding()}
            disabled={isSaving || !city.trim() || interests.length === 0}
            className="mt-4 rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Activer mon profil
          </button>
        </section>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Nom affiché</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-neutral-900 focus:outline-none"
            placeholder="Quelques mots sur toi…"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Ville</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Intérêts</legend>
          <InterestPicker value={interests} onChange={setInterests} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Visibilité</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                  visibility === option.value
                    ? "border-neutral-900 bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
                <span
                  className={`mt-1 block text-xs ${
                    visibility === option.value ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {option.hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-yunicity-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </WebAppShell>
  );
}

export default function ProfileMePage() {
  return (
    <ProtectedRoute>
      <ProfileMeContent />
    </ProtectedRoute>
  );
}
