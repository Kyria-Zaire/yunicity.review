import type { PassportMe, PassportStamp, PassportTierCode, Tribe } from "@yunicity/types";

import { PASSPORT_LEVEL_UNAVAILABLE_LABEL, PASSPORT_TIER_LABELS } from "./passport-level-labels";

/**
 * Niveau Passport affiché (PASSPORT-LEVEL-SCALE-01).
 *
 * Le niveau EST le tier Passport, avec son libellé contractuel
 * (`PASSPORT_TIER_LABELS`) — PRD-301 §8.3. Il ne dépend d'AUCUN score : l'échelle
 * front à cinq paliers calculée sur les points (« Habitant… Référent local »),
 * qui empruntait les noms des badges, est retirée.
 *
 * - `tierCode` : `null` quand aucun tier reconnu n'est connu → « Niveau indisponible ».
 * - `nextLabel` : prochain niveau selon les règles EXISTANTES du backend
 *   (`build_progression_hint` : basic/neo_arrivant → silver, silver → gold, gold et
 *   statuts → aucun). Jamais de niveau au-dessus de Gold.
 */
export type PassportLevelView = {
  tierCode: PassportTierCode | null;
  currentLabel: string;
  nextLabel: string | null;
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

export function formatPassportPoints(points: number | null | undefined): string {
  const safe = typeof points === "number" && Number.isFinite(points) ? Math.max(0, points) : 0;
  return `${safe} pts`;
}

/** Les six codes de tier du contrat (PRD-301 §2.1) — rien d’autre n’est un niveau. */
export function isPassportTierCode(value: unknown): value is PassportTierCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PASSPORT_TIER_LABELS, value);
}

export function buildUnavailablePassportLevel(): PassportLevelView {
  return { tierCode: null, currentLabel: PASSPORT_LEVEL_UNAVAILABLE_LABEL, nextLabel: null };
}

/**
 * Seules transitions de niveau cohérentes — miroir des règles EXISTANTES du backend
 * (`PassportLevelService.build_progression_hint`) : Basic → Silver, Néo-arrivant →
 * Silver, Silver → Gold. Gold, Créateur·rice local·e et Business n'ont aucun niveau
 * suivant : les statuts ne sont pas forcés dans l'échelle Basic → Silver → Gold.
 */
const PASSPORT_NEXT_TIER: Readonly<Record<PassportTierCode, PassportTierCode | null>> = {
  basic: "silver",
  neo_arrivant: "silver",
  silver: "gold",
  gold: null,
  press_creator: null,
  business: null,
};

/**
 * Niveau depuis `/passport/me` : le tier porté ; le prochain tier n'est affiché que
 * si l'API l'annonce ET qu'il correspond à la seule transition cohérente pour ce
 * tier. Toute autre combinaison (incohérente, hors contrat, au-delà de Gold) est
 * ignorée : aucun prochain niveau plutôt qu'un niveau faux.
 */
export function buildPassportLevel(passport: PassportMe): PassportLevelView {
  const tierCode = passport.tier?.code;
  if (!isPassportTierCode(tierCode)) return buildUnavailablePassportLevel();

  const announced = passport.progression?.next_tier_code;
  const expected = PASSPORT_NEXT_TIER[tierCode];
  const nextLabel = expected !== null && announced === expected ? PASSPORT_TIER_LABELS[expected] : null;

  return { tierCode, currentLabel: PASSPORT_TIER_LABELS[tierCode], nextLabel };
}

/**
 * Repli quand `/passport/me` manque (décision D3) : le tier du résumé
 * `/me/passport` s’il est un code du contrat, SANS prochain niveau — aucune
 * progression n’est déduite de ces données ; sinon « Niveau indisponible ».
 * Aucun calcul depuis les points.
 */
export function buildPassportLevelFromSummaryTier(tier: string | null | undefined): PassportLevelView {
  if (!isPassportTierCode(tier)) return buildUnavailablePassportLevel();
  return { tierCode: tier, currentLabel: PASSPORT_TIER_LABELS[tier], nextLabel: null };
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
