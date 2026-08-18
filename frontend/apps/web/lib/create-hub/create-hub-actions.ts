/**
 * Intentions Create Hub — C3.1-T3.
 * Source unique des parcours affichés dans le dialogue.
 */

import { PARTNER_PORTAL_BASE } from "@yunicity/utils";
import type { LucideIcon } from "lucide-react";
import { Handshake, MapPin, PenLine, Users, Video, Camera } from "lucide-react";

export type PartnerAccessStatus = "idle" | "loading" | "allowed" | "denied";

export type CreateHubAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

const BASE_ACTIONS: readonly CreateHubAction[] = [
  {
    id: "feed-post",
    title: "Publier sur le Fil",
    description: "Texte, photo ou information locale.",
    icon: PenLine,
    href: "/feed/new",
  },
  {
    id: "story",
    title: "Créer une Story",
    description: "Partage un moment visible pendant 24 h.",
    icon: Camera,
    href: "/stories/new",
  },
  {
    id: "local-video",
    title: "Publier une vidéo",
    description: "Partage une vidéo locale (90 s max).",
    icon: Video,
    href: "/videos/new",
  },
  {
    id: "tribe",
    title: "Créer une tribu",
    description: "Rassemble une communauté autour d'un centre d'intérêt.",
    icon: Users,
    href: "/tribes/create",
  },
  {
    id: "propose-place",
    title: "Proposer un lieu",
    description: "Suggérez un lieu manquant à la communauté.",
    icon: MapPin,
    href: "/organizations/request",
  },
] as const;

const PARTNER_ACTION: CreateHubAction = {
  id: "partner-place",
  title: "Animer un lieu",
  description: "Gérez offres, événements et contenus partenaire.",
  icon: Handshake,
  href: PARTNER_PORTAL_BASE,
};

export function buildCreateHubActions(input: {
  isAuthenticated: boolean;
  partnerAccessStatus: PartnerAccessStatus;
}): CreateHubAction[] {
  if (!input.isAuthenticated) {
    return [];
  }

  const actions = [...BASE_ACTIONS];
  if (input.partnerAccessStatus === "allowed") {
    actions.push(PARTNER_ACTION);
  }
  return actions;
}

export function listCreateHubActionHrefs(input: {
  isAuthenticated: boolean;
  partnerAccessStatus: PartnerAccessStatus;
}): string[] {
  return buildCreateHubActions(input).map((action) => action.href);
}
