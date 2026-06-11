"use client";

import { SettingsErrorState } from "@/components/settings/settings-error-state";
import { SettingsField } from "@/components/settings/settings-field";
import { SettingsLoadingState } from "@/components/settings/settings-loading-state";
import { SettingsReadonlyFooter } from "@/components/settings/settings-readonly-footer";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useAdminPlatformConfig } from "@/lib/hooks/use-admin-platform-config";
import {
  formatBoolean,
  formatComingSoonLabel,
  formatGeneratedAt,
  formatModuleLabel,
  formatPartnerStatus,
  formatPilotGoals,
  formatPriceCents,
  formatReadinessStatus,
} from "@/lib/settings-display";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "—";
}

export function SettingsPage() {
  const { snapshot, isLoading, error, reload } = useAdminPlatformConfig();

  if (isLoading && !snapshot) {
    return <SettingsLoadingState />;
  }

  if (error && !snapshot) {
    return <SettingsErrorState message={error} onRetry={() => void reload()} />;
  }

  if (!snapshot) {
    return (
      <SettingsErrorState
        message="Aucune donnée de configuration disponible."
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Configuration</h1>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Read-only
          </span>
        </div>
        <p className="text-sm text-stone-600">
          Snapshot plateforme généré le {formatGeneratedAt(snapshot.generated_at)} — données réelles,
          sans secrets.
        </p>
        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}
      </header>

      <SettingsSectionCard
        title="Général"
        description="Territoire pilote et objectifs de lancement."
        badge="read-only"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Application" value={snapshot.general.app_name} />
          <SettingsField label="Ville pilote" value={snapshot.general.pilot_city} />
          <SettingsField
            label="Statut pilote"
            value={snapshot.general.pilot_status === "active" ? "Actif" : snapshot.general.pilot_status}
          />
          <SettingsField
            label="Objectifs pilote"
            value={formatPilotGoals(snapshot)}
            hint="Seuils définis dans les constantes backend."
          />
        </dl>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Passport"
        description="Tiers, badges et règles de tamponnage."
        badge="active"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Seuil badge Argent"
            value={`${snapshot.passport.badge_thresholds.silver_reputation} points de réputation`}
          />
          <SettingsField
            label="Seuil badge Or"
            value={`${snapshot.passport.badge_thresholds.gold_reputation} points de réputation`}
          />
          <SettingsField
            label="Expiration QR tampon"
            value={`${snapshot.passport.stamp_qr_expires_minutes} minutes`}
          />
          <SettingsField
            label="Max redemptions / passeport"
            value={String(snapshot.passport.default_max_redemptions_per_passport)}
          />
          <SettingsField
            label="Événements feed tampon"
            value={formatBoolean(snapshot.passport.passport_stamp_feed_events_enabled)}
          />
        </dl>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Tiers passport</p>
          {snapshot.passport.tiers.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Aucun tier configuré.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-100">
              {snapshot.passport.tiers.map((tier) => (
                <li
                  key={tier.code}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-stone-900">
                    {tier.name}{" "}
                    <span className="font-normal text-stone-500">({tier.code})</span>
                  </span>
                  <span className="text-xs text-stone-500">
                    {tier.is_active ? "Actif" : "Inactif"} ·{" "}
                    {tier.is_publicly_visible ? "Visible public" : "Masqué public"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Partenaires"
        description="Statuts partenaires et vérification des organisations."
        badge="read-only"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Statuts supportés"
            value={snapshot.partners.supported_statuses.map(formatPartnerStatus).join(", ")}
          />
          <SettingsField
            label="Statuts visibles public"
            value={snapshot.partners.public_visible_statuses.map(formatPartnerStatus).join(", ")}
          />
          <SettingsField
            label="Vérification manuelle org."
            value={formatBoolean(snapshot.partners.organization_manual_verification)}
          />
        </dl>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Modération"
        description="Workflows de validation et seuils d'attention."
        badge="active"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Événements auto-approuvés (org. vérifiée)"
            value={formatBoolean(snapshot.moderation.events_auto_approve_when_org_verified)}
          />
          <SettingsField
            label="Contenus créateurs — revue requise"
            value={formatBoolean(snapshot.moderation.creator_content_requires_review)}
          />
          <SettingsField
            label="Offres — revue requise"
            value={formatBoolean(snapshot.moderation.offers_require_review)}
          />
          <SettingsField
            label="Seuil attention modération"
            value={String(snapshot.moderation.attention_threshold)}
          />
        </dl>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Notifications"
        description="Canaux de notification disponibles."
        badge="soon"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Push Expo"
            value={formatBoolean(snapshot.notifications.expo_push_enabled)}
          />
          <SettingsField
            label="Système email"
            value={
              snapshot.notifications.email_system_available ? "Disponible" : "Bientôt disponible"
            }
          />
        </dl>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Sécurité & système"
        description="Environnement, santé infrastructure et permissions du viewer."
        badge="protected"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Environnement" value={snapshot.system.environment} />
          <SettingsField label="Service API" value={snapshot.system.service_name} />
          <SettingsField
            label="Readiness global"
            value={formatReadinessStatus(snapshot.system.readiness.status)}
          />
          <SettingsField
            label="Base de données"
            value={formatReadinessStatus(snapshot.system.readiness.database)}
          />
          <SettingsField
            label="Redis"
            value={formatReadinessStatus(snapshot.system.readiness.redis)}
          />
          <SettingsField
            label="Rate limits"
            value="Configurés dans le code (non éditables)"
          />
        </dl>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Modules activés
            </p>
            <p className="mt-2 text-sm text-stone-800">
              {snapshot.enabled_modules.map(formatModuleLabel).join(" · ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Rôles plateforme
            </p>
            <p className="mt-2 text-sm text-stone-800">
              {snapshot.system.platform_roles.map((role) => role.name).join(" · ")}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SettingsField label="Vos rôles" value={formatList(snapshot.viewer.roles)} />
          <SettingsField
            label="Vos permissions"
            value={formatList(snapshot.viewer.permissions)}
            hint="Permissions RBAC du compte connecté."
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Business / monétisation"
        description="Plans d'abonnement et intégration paiement."
        badge="read-only"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Stripe configuré"
            value={formatBoolean(snapshot.business.stripe_configured)}
            hint="Indique seulement si une clé est présente — jamais exposée."
          />
        </dl>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Plans d&apos;abonnement
          </p>
          <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-100">
            {snapshot.business.membership_plans.map((plan) => (
              <li
                key={plan.code}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium text-stone-900">{plan.name}</span>
                <span className="text-stone-600">{formatPriceCents(plan.monthly_price_cents)}</span>
              </li>
            ))}
          </ul>
        </div>
        {snapshot.coming_soon.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Fonctionnalités à venir
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshot.coming_soon.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                >
                  {formatComingSoonLabel(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SettingsSectionCard>

      <SettingsReadonlyFooter />
    </div>
  );
}
