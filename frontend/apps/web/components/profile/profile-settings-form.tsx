"use client";

import { InterestPicker } from "@/components/interest-picker";
import type { ProfileMe, ProfileVisibility } from "@yunicity/types";
import { PROFILE_PORTAL_SETTINGS_TITLE, VISIBILITY_OPTIONS, isAuthError } from "@yunicity/utils";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ProfileSettingsFormProps = {
  profile: ProfileMe;
  onUpdated: (profile: ProfileMe) => void;
};

export function ProfileSettingsForm({ profile, onUpdated }: ProfileSettingsFormProps) {
  const api = useYunicityApi();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
    setInterests(profile.interests);
    setVisibility(profile.visibility);
  }, [profile]);

  const handleSave = useCallback(
    async (event: FormEvent) => {
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
        onUpdated(updated);
        setMessage("Profil mis à jour.");
      } catch (err) {
        setError(isAuthError(err) ? err.message : "Échec de la mise à jour.");
      } finally {
        setIsSaving(false);
      }
    },
    [api, bio, city, displayName, interests, onUpdated, visibility],
  );

  return (
    <section
      id="profile-settings"
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-neutral-900">{PROFILE_PORTAL_SETTINGS_TITLE}</h2>

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Nom affiché</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            placeholder="Quelques mots sur vous…"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Ville</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-800">Intérêts</legend>
          <InterestPicker value={interests} onChange={setInterests} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-800">Visibilité</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                  visibility === option.value
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white hover:border-yunicity-primary/30"
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
                    visibility === option.value ? "text-white/80" : "text-neutral-500"
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
          className="w-full rounded-full bg-yunicity-primary py-3 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>
    </section>
  );
}
