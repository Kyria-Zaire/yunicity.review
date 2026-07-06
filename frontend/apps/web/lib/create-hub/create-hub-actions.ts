/**
 * Intentions Create Hub — CREATORS-UX-02B.
 * Source unique des parcours affichés dans le sheet.
 */

import { PARTNER_PORTAL_BASE } from "@yunicity/utils";
import type { LucideIcon } from "lucide-react";
import { Camera, Handshake, Home, PenLine, Video } from "lucide-react";

export const CREATE_HUB_FEED_COMPOSER_HREF = "/feed#feed-composer";

export type CreateHubActionKind = "navigate" | "soon";

export type CreateHubAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  kind: CreateHubActionKind;
  href?: string;
  soonLabel?: string;
};

const CITIZEN_ACTIONS: readonly CreateHubAction[] = [
  {
    id: "local-video",
    title: "Filmer mon quartier",
    description: "Partage une vidéo locale (90 s max).",
    icon: Video,
    kind: "navigate",
    href: "/videos/new",
  },
  {
    id: "story",
    title: "Story éphémère",
    description: "Partage un moment visible pendant 24 h.",
    icon: Camera,
    kind: "navigate",
    href: "/stories/new",
  },
  {
    id: "feed-post",
    title: "Publier sur le fil",
    description: "Texte, photo ou information locale.",
    icon: PenLine,
    kind: "navigate",
    href: "/feed/new",
  },
  {
    id: "neighborhood-memory",
    title: "Souvenir de quartier",
    description: "Racontez un moment de mémoire locale lié à votre quartier.",
    icon: Home,
    kind: "soon",
    soonLabel: "Bientôt disponible",
  },
] as const;

const PARTNER_ACTION: CreateHubAction = {
  id: "partner-place",
  title: "Animer un lieu",
  description: "Gérez offres, événements et contenus partenaire.",
  icon: Handshake,
  kind: "navigate",
  href: PARTNER_PORTAL_BASE,
};

export function buildCreateHubActions(options: { showPartnerAction: boolean }): CreateHubAction[] {
  const actions = [...CITIZEN_ACTIONS];
  if (options.showPartnerAction) {
    actions.push(PARTNER_ACTION);
  }
  return actions;
}
