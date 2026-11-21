"use client";

/**
 * FEED-NEW-UX-01 — options héritées de l'écran `/feed/new` actuel.
 *
 * Onglet de format, audience, sondage, partages croisés : l'UI reconstruite ne
 * les proposera plus. Elles vivent ici, isolées, pour deux raisons — garder
 * `use-new-post-draft` à la taille d'un brouillon (texte + médias + payload), et
 * rendre leur retrait trivial quand l'écran changera.
 *
 * TODO(debt): supprimer ce module avec les vues `new-post-{mobile,desktop}-view`
 * au lot UI de FEED-NEW-UX-01. Aucune nouvelle option ne doit y être ajoutée.
 */

import type { PostCrossPostTargets, PostFormatId, PostVisibilityId } from "@yunicity/types";
import { useCallback, useState } from "react";

export function useNewPostLegacyOptions() {
  const [format, setFormat] = useState<PostFormatId>("photo");
  const [visibility, setVisibility] = useState<PostVisibilityId>("public");
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [useMediaCaption, setUseMediaCaption] = useState(true);
  const [audienceUserIds, setAudienceUserIds] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [crossPost, setCrossPost] = useState<PostCrossPostTargets>({
    instagram: true,
    tiktok: true,
    facebook: false,
    twitter: false,
  });

  const toggleCrossPost = useCallback((key: keyof PostCrossPostTargets) => {
    setCrossPost((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
  }, []);

  const addPollOption = useCallback(() => {
    setPollOptions((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
  }, []);

  return {
    format,
    setFormat,
    visibility,
    setVisibility,
    allowComments,
    setAllowComments,
    allowShares,
    setAllowShares,
    useMediaCaption,
    setUseMediaCaption,
    audienceUserIds,
    setAudienceUserIds,
    pollOptions,
    updatePollOption,
    addPollOption,
    crossPost,
    toggleCrossPost,
  };
}
