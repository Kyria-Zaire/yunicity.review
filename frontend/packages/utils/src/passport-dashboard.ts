import type { PassportMe, PassportStamp, Tribe } from "@yunicity/types";

import { PASSPORT_TIER_LABELS } from "./passport-level-labels";

export type PassportJourneyLevelId =
  | "habitant"
  | "contributeur"
  | "explorateur"
  | "ambassadeur"
  | "referent";

export type PassportJourneyLevel = {
  id: PassportJourneyLevelId;
  label: string;
  threshold: number;
  description: string;
};

export type PassportLevelView = {
  level: PassportJourneyLevel;
  points: number;
  nextLevel: PassportJourneyLevel | null;
  nextLevelLabel: string | null;
  pointsToNext: number | null;
  progressPercent: number;
  backendTierLabel: string;
};

export type PassportAchievementId =
  | "moments"
  | "neighborhoods"
  | "tribes"
  | "meetings"
  | "badges";

export type PassportAchievementCard = {
  id: PassportAchievementId;
  label: string;
  subtitle: string;
  value: number;
  valueLabel: string;
  unavailable: boolean;
};

export type PassportProgressionStepState = "locked" | "active" | "unlocked";

export type PassportProgressionStep = {
  level: PassportJourneyLevel;
  state: PassportProgressionStepState;
  pointsLabel: string;
};

export type PassportDerivedBadgeId =
  | "curious_explorer"
  | "engaged_sharer"
  | "connector"
  | "local_supporter"
  | "ambiance_maker";

export type PassportDerivedBadge = {
  id: PassportDerivedBadgeId;
  title: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
};

export type PassportDashboardAchievementInput = {
  passport: PassportMe;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEventsCount: number;
  postsCount: number | null;
};

const BANNED_METRIC_PATTERN =
  /leaderboard|classement|#\d+\s*(sur|\/)\s*\d+|top\s*\d+/i;

/** Paliers UX alignés sur la réputation réelle (TICKET-502). */
export const PASSPORT_JOURNEY_LEVELS: PassportJourneyLevel[] = [
  {
    id: "habitant",
    label: "Habitant",
    threshold: 0,
    description: "Votre place dans la ville commence ici.",
  },
  {
    id: "contributeur",
    label: "Contributeur local",
    threshold: 15,
    description: "Vous faites vivre le territoire par vos passages.",
  },
  {
    id: "explorateur",
    label: "Explorateur",
    threshold: 25,
    description: "Exploration régulière reconnue sur Reims.",
  },
  {
    id: "ambassadeur",
    label: "Ambassadeur",
    threshold: 50,
    description: "Engagement durable au service de la ville.",
  },
  {
    id: "referent",
    label: "Référent local",
    threshold: 70,
    description: "Référence citoyenne sur le territoire.",
  },
];

function resolveJourneyLevel(points: number): PassportJourneyLevel {
  let current = PASSPORT_JOURNEY_LEVELS[0]!;
  for (const level of PASSPORT_JOURNEY_LEVELS) {
    if (points >= level.threshold) {
      current = level;
    }
  }
  return current;
}

function resolveNextJourneyLevel(points: number): PassportJourneyLevel | null {
  return PASSPORT_JOURNEY_LEVELS.find((level) => level.threshold > points) ?? null;
}

export function formatPassportPoints(points: number | null | undefined): string {
  const safe = typeof points === "number" && Number.isFinite(points) ? Math.max(0, points) : 0;
  return `${safe} pts`;
}

export function buildPassportLevel(passport: PassportMe): PassportLevelView {
  const points =
    passport.progression?.reputation_score ??
    passport.reputation_score ??
    0;
  const level = resolveJourneyLevel(points);
  const nextLevel = resolveNextJourneyLevel(points);
  const pointsToNext =
    passport.progression?.points_to_next ??
    (nextLevel ? Math.max(0, nextLevel.threshold - points) : null);

  let progressPercent = 100;
  if (nextLevel) {
    const span = nextLevel.threshold - level.threshold;
    progressPercent = span > 0 ? Math.min(100, Math.round(((points - level.threshold) / span) * 100)) : 0;
  }

  const nextLevelLabel =
    passport.progression?.next_tier_label?.trim() ||
    nextLevel?.label ||
    null;

  return {
    level,
    points,
    nextLevel,
    nextLevelLabel,
    pointsToNext,
    progressPercent,
    backendTierLabel: PASSPORT_TIER_LABELS[passport.tier.code] ?? passport.tier.name,
  };
}

function countUniqueNeighborhoodSlugs(stamps: PassportStamp[]): number {
  const slugs = new Set<string>();
  for (const stamp of stamps) {
    const slug = stamp.slug?.trim();
    if (slug) {
      slugs.add(slug.toLowerCase());
    }
  }
  return slugs.size;
}

export function buildPassportAchievements(
  input: PassportDashboardAchievementInput,
): PassportAchievementCard[] {
  const tribesJoined = input.tribes.filter((tribe) => tribe.viewer_is_member && !tribe.is_archived).length;
  const neighborhoodsExplored = countUniqueNeighborhoodSlugs(input.stamps);
  const badgesEarned = input.passport.stats.stamps_count;
  const meetings = input.savedEventsCount;
  const moments =
    input.postsCount != null && Number.isFinite(input.postsCount) ? input.postsCount : null;

  return [
    {
      id: "moments",
      label: "Moments partagés",
      subtitle:
        moments == null
          ? "Vos publications locales seront comptées prochainement."
          : "Publications sur le fil local.",
      value: moments ?? 0,
      valueLabel: moments == null ? "—" : String(moments),
      unavailable: moments == null,
    },
    {
      id: "neighborhoods",
      label: "Quartiers explorés",
      subtitle: "Repères territoriaux découverts.",
      value: neighborhoodsExplored,
      valueLabel: String(neighborhoodsExplored),
      unavailable: false,
    },
    {
      id: "tribes",
      label: "Tribus rejointes",
      subtitle: "Communautés locales actives.",
      value: tribesJoined,
      valueLabel: String(tribesJoined),
      unavailable: false,
    },
    {
      id: "meetings",
      label: "Rencontres suivies",
      subtitle: "Moments enregistrés pour plus tard.",
      value: meetings,
      valueLabel: String(meetings),
      unavailable: false,
    },
    {
      id: "badges",
      label: "Badges obtenus",
      subtitle: "Tampons et reconnaissances locales.",
      value: badgesEarned,
      valueLabel: String(badgesEarned),
      unavailable: false,
    },
  ];
}

export function buildPassportProgression(passport: PassportMe): PassportProgressionStep[] {
  const points =
    passport.progression?.reputation_score ??
    passport.reputation_score ??
    0;
  const current = resolveJourneyLevel(points);
  const currentIndex = PASSPORT_JOURNEY_LEVELS.findIndex((level) => level.id === current.id);

  return PASSPORT_JOURNEY_LEVELS.map((level, index) => {
    let state: PassportProgressionStepState = "locked";
    if (index < currentIndex) {
      state = "unlocked";
    } else if (index === currentIndex) {
      state = "active";
    } else if (points >= level.threshold) {
      state = "unlocked";
    }

    return {
      level,
      state,
      pointsLabel: level.threshold === 0 ? "Départ" : `${level.threshold} pts`,
    };
  });
}

function latestStampAt(stamps: PassportStamp[]): string | null {
  const sorted = [...stamps].sort(
    (a, b) => Date.parse(b.stamped_at) - Date.parse(a.stamped_at),
  );
  return sorted[0]?.stamped_at ?? null;
}

export function buildPassportRecentBadges(
  input: PassportDashboardAchievementInput,
): PassportDerivedBadge[] {
  const achievements = buildPassportAchievements(input);
  const byId = Object.fromEntries(achievements.map((item) => [item.id, item])) as Record<
    PassportAchievementId,
    PassportAchievementCard
  >;
  const latestStamp = latestStampAt(input.stamps);

  const badges: PassportDerivedBadge[] = [
    {
      id: "curious_explorer",
      title: "Explorateur curieux",
      description: "Découvrir un premier quartier sur le territoire.",
      earned: (byId.neighborhoods?.value ?? 0) > 0,
      earnedAt: (byId.neighborhoods?.value ?? 0) > 0 ? latestStamp : null,
    },
    {
      id: "engaged_sharer",
      title: "Partage engagé",
      description: "Participer au fil local de la ville.",
      earned: (byId.moments?.value ?? 0) > 0,
      earnedAt: null,
    },
    {
      id: "connector",
      title: "Rencontreur",
      description: "Suivre un moment local à venir.",
      earned: (byId.meetings?.value ?? 0) > 0,
      earnedAt: null,
    },
    {
      id: "local_supporter",
      title: "Soutien local",
      description: "Rejoindre une tribu de votre ville.",
      earned: (byId.tribes?.value ?? 0) > 0,
      earnedAt: null,
    },
    {
      id: "ambiance_maker",
      title: "Ambianceur",
      description: "Accumuler des tampons territoriaux.",
      earned: input.passport.stats.stamps_count >= 3,
      earnedAt: input.passport.stats.stamps_count >= 3 ? latestStamp : null,
    },
  ];

  return badges;
}

export function passportDashboardHasNoFakeMetrics(texts: string[]): boolean {
  return texts.every((text) => !BANNED_METRIC_PATTERN.test(text));
}

export function countEarnedPassportBadges(badges: PassportDerivedBadge[]): number {
  return badges.filter((badge) => badge.earned).length;
}
