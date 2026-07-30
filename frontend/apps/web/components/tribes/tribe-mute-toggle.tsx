"use client";

import type { Tribe } from "@yunicity/types";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

/** Cloche 🔔/🔕 — mute des notifications de la tribu pour le membre courant (bloc 3). */
export function TribeMuteToggle({ tribe }: { tribe: Tribe }) {
  const api = useYunicityApi();
  const [muted, setMuted] = useState(tribe.viewer_notifications_muted);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) {
      return;
    }
    const next = !muted;
    setMuted(next); // optimiste
    setPending(true);
    try {
      await api.tribes.setTribeNotifications(tribe.slug, tribe.city, next);
    } catch {
      setMuted(!next); // rollback si l'appel échoue
    } finally {
      setPending(false);
    }
  }

  const Icon = muted ? BellOff : Bell;
  const label = muted ? "Réactiver les notifications de la tribu" : "Couper les notifications de la tribu";
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={muted}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition hover:bg-neutral-50 hover:text-yunicity-primary disabled:opacity-50"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
