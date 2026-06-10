/** Admin staff governance command helpers (STAFF-V2-CLEAN-01) — pure UX logic. */

import type {
  AdminStaffAdminSummaryResponse,
  AdminStaffPlatformRole,
} from "@yunicity/types";

import { buildStaffListPath, staffRoleLabel } from "./admin-staff";

export const STAFF_CRITICAL_ROLE_COUNT = 3;

const PLATFORM_ROLES: AdminStaffPlatformRole[] = [
  "SUPER_ADMIN",
  "CITY_ADMIN",
  "MODERATOR",
];

const ORG_HEALTH_LABELS: Record<AdminStaffPlatformRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  CITY_ADMIN: "Admin ville",
  MODERATOR: "Modérateur",
};

export interface StaffMetrics {
  total: number;
  active: number;
  suspended: number;
  superAdmins: number;
  cityAdmins: number;
  moderators: number;
  dominantRole: AdminStaffPlatformRole | null;
}

export interface StaffSignal {
  title: string;
  description: string;
}

export interface StaffNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface StaffKpiCard {
  id: string;
  label: string;
  displayValue: string;
  hint: string;
}

export interface StaffOrganizationalHealthRole {
  role: AdminStaffPlatformRole;
  label: string;
  present: boolean;
}

export interface StaffOrganizationalHealth {
  presentRolesCount: number;
  totalRoles: number;
  percent: number;
  message: string;
  roles: StaffOrganizationalHealthRole[];
}

export interface StaffFilteredEmptyMessage {
  title: string;
  description: string;
}

export function buildStaffMetricsFromSummary(
  summary: AdminStaffAdminSummaryResponse,
): StaffMetrics {
  const dominantRole =
    summary.dominant_role &&
    PLATFORM_ROLES.includes(summary.dominant_role as AdminStaffPlatformRole)
      ? (summary.dominant_role as AdminStaffPlatformRole)
      : null;

  return {
    total: summary.total,
    active: summary.active,
    suspended: summary.suspended,
    superAdmins: summary.super_admins,
    cityAdmins: summary.city_admins,
    moderators: summary.moderators,
    dominantRole,
  };
}

export function buildStaffSignal(metrics: StaffMetrics): StaffSignal {
  if (metrics.suspended > 0) {
    return {
      title: "Des comptes staff nécessitent une revue.",
      description: `${metrics.suspended} compte${metrics.suspended > 1 ? "s sont" : " est"} suspendu${metrics.suspended > 1 ? "s" : ""} ou désactivé${metrics.suspended > 1 ? "s" : ""}.`,
    };
  }

  if (metrics.total === 0) {
    return {
      title: "Aucun compte staff visible.",
      description: "Aucun accès interne n'est disponible dans cette vue.",
    };
  }

  if (metrics.moderators === 0) {
    return {
      title: "Couverture opérationnelle incomplète.",
      description: "Aucun modérateur n'est référencé sur la plateforme.",
    };
  }

  if (metrics.cityAdmins === 0) {
    return {
      title: "Relais ville manquant.",
      description: "Aucun admin ville n'est référencé pour piloter le territoire.",
    };
  }

  return {
    title: "Gouvernance staff stable.",
    description: "Les comptes internes sont visibles et surveillés.",
  };
}

export function buildStaffNextAction(metrics: StaffMetrics): StaffNextAction {
  if (metrics.total === 0) {
    return {
      id: "refresh",
      title: "Vérifiez le roster staff.",
      description: "Aucun compte interne n'est visible dans la console.",
      ctaLabel: "Actualiser",
      href: "/staff",
    };
  }

  if (metrics.suspended > 0) {
    return {
      id: "suspended",
      title: "Examiner les comptes suspendus.",
      description: "Contrôlez les accès bloqués ou désactivés.",
      ctaLabel: "Voir les suspendus",
      href: buildStaffListPath(new URLSearchParams({ status: "suspended" })),
    };
  }

  if (metrics.moderators === 0) {
    return {
      id: "moderator",
      title: "Attribuer un rôle modérateur.",
      description: "Sélectionnez un membre puis attribuez le rôle depuis sa fiche.",
      ctaLabel: "Voir les modérateurs",
      href: buildStaffListPath(new URLSearchParams({ role: "MODERATOR" })),
    };
  }

  if (metrics.cityAdmins === 0) {
    return {
      id: "city-admin",
      title: "Attribuer un admin ville.",
      description: "Ajoutez un relais opérationnel pour piloter le territoire.",
      ctaLabel: "Voir les admins ville",
      href: buildStaffListPath(new URLSearchParams({ role: "CITY_ADMIN" })),
    };
  }

  if (metrics.superAdmins > 2) {
    return {
      id: "super-admin-audit",
      title: "Auditer les rôles critiques.",
      description: "Limitez les super administrateurs aux comptes strictement nécessaires.",
      ctaLabel: "Voir les super admins",
      href: buildStaffListPath(new URLSearchParams({ role: "SUPER_ADMIN" })),
    };
  }

  return {
    id: "roster",
    title: "Maintenir la gouvernance.",
    description: "Surveillez régulièrement les accès staff et les permissions.",
    ctaLabel: "Voir tout le staff",
    href: "/staff",
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildStaffKpiCards(metrics: StaffMetrics): StaffKpiCard[] {
  const dominantDisplay = metrics.dominantRole ? staffRoleLabel(metrics.dominantRole) : "—";

  return [
    {
      id: "total",
      label: "Comptes staff",
      displayValue: String(metrics.total),
      hint: kpiHint(metrics.total, "Roster vide", "Équipe référencée"),
    },
    {
      id: "active",
      label: "Actifs",
      displayValue: String(metrics.active),
      hint: kpiHint(metrics.active, "Aucun actif", "Accès opérationnels"),
    },
    {
      id: "suspended",
      label: "Suspendus",
      displayValue: String(metrics.suspended),
      hint: kpiHint(metrics.suspended, "Aucune suspension", "À auditer"),
    },
    {
      id: "super_admins",
      label: "Super admins",
      displayValue: String(metrics.superAdmins),
      hint: kpiHint(metrics.superAdmins, "Couverture critique", "Gouvernance plateforme"),
    },
    {
      id: "dominant_role",
      label: "Rôle dominant",
      displayValue: dominantDisplay,
      hint: metrics.dominantRole ? "Répartition principale" : "Aucun rôle détecté",
    },
  ];
}

function organizationalHealthMessage(presentRolesCount: number): string {
  if (presentRolesCount <= 0) {
    return "Aucune couverture opérationnelle critique n'est détectée.";
  }
  if (presentRolesCount === 1) {
    return "La plateforme dépend d'un seul profil critique.";
  }
  if (presentRolesCount === 2) {
    return "La couverture progresse mais reste incomplète.";
  }
  return "Les rôles critiques sont couverts.";
}

export function buildStaffOrganizationalHealth(
  metrics: StaffMetrics,
): StaffOrganizationalHealth {
  const presence: Record<AdminStaffPlatformRole, boolean> = {
    SUPER_ADMIN: metrics.superAdmins > 0,
    CITY_ADMIN: metrics.cityAdmins > 0,
    MODERATOR: metrics.moderators > 0,
  };
  const presentRolesCount = PLATFORM_ROLES.filter((role) => presence[role]).length;
  const totalRoles = STAFF_CRITICAL_ROLE_COUNT;

  return {
    presentRolesCount,
    totalRoles,
    percent: Math.min(Math.round((presentRolesCount / totalRoles) * 100), 100),
    message: organizationalHealthMessage(presentRolesCount),
    roles: PLATFORM_ROLES.map((role) => ({
      role,
      label: ORG_HEALTH_LABELS[role],
      present: presence[role],
    })),
  };
}

export function buildStaffConseilMessage(metrics: StaffMetrics): string {
  if (metrics.suspended > 0) {
    return "Documentez chaque suspension et réactivez uniquement les accès justifiés.";
  }
  if (metrics.moderators === 0) {
    return "Sans modérateur référencé, la file citoyenne peut s'accumuler sans relais humain.";
  }
  if (metrics.cityAdmins === 0) {
    return "Un relais ville manquant complique le pilotage territorial au quotidien.";
  }
  if (metrics.superAdmins > 2) {
    return "Réduisez les super administrateurs au strict nécessaire pour limiter la surface d'attaque.";
  }
  return "Un roster staff à jour protège Yunicity autant qu'un pare-feu technique.";
}

export function buildStaffConseilAction(): StaffNextAction {
  return {
    id: "all-staff",
    title: "Roster complet",
    description: "",
    ctaLabel: "Voir tout le staff",
    href: "/staff",
  };
}

export function staffHasActiveFilters(state: {
  role: string;
  status: string;
  page: number;
}): boolean {
  return Boolean(state.role || state.status || state.page > 1);
}

export function staffRoleFilteredEmptyMessage(
  role: string,
): StaffFilteredEmptyMessage {
  if (role === "MODERATOR") {
    return {
      title: "Aucun modérateur assigné.",
      description: "Attribuez ce rôle depuis la fiche d'un membre staff.",
    };
  }
  if (role === "CITY_ADMIN") {
    return {
      title: "Aucun admin ville assigné.",
      description: "Ajoutez un relais opérationnel depuis une fiche staff.",
    };
  }
  if (role === "SUPER_ADMIN") {
    return {
      title: "Aucun super administrateur dans ce filtre.",
      description: "Modifiez les filtres ou revenez au roster complet.",
    };
  }
  return {
    title: "Aucun membre ne correspond à ces critères.",
    description: "Modifiez les filtres ou revenez au roster complet.",
  };
}
