export interface AdminPlatformConfigPilotGoals {
  active_passports: number;
  published_offers: number;
  upcoming_events: number;
  approved_creator_contents: number;
  qualified_leads: number;
}

export interface AdminPlatformConfigGeneral {
  app_name: string;
  pilot_city: string;
  pilot_status: string;
  pilot_goals: AdminPlatformConfigPilotGoals;
}

export interface AdminPlatformConfigPassportTier {
  code: string;
  name: string;
  display_order: number;
  is_active: boolean;
  is_publicly_visible: boolean;
}

export interface AdminPlatformConfigBadgeThresholds {
  silver_reputation: number;
  gold_reputation: number;
}

export interface AdminPlatformConfigPassport {
  tiers: AdminPlatformConfigPassportTier[];
  badge_thresholds: AdminPlatformConfigBadgeThresholds;
  stamp_qr_expires_minutes: number;
  default_max_redemptions_per_passport: number;
  passport_stamp_feed_events_enabled: boolean;
}

export interface AdminPlatformConfigPartners {
  supported_statuses: string[];
  public_visible_statuses: string[];
  organization_manual_verification: boolean;
}

export interface AdminPlatformConfigModeration {
  events_auto_approve_when_org_verified: boolean;
  creator_content_requires_review: boolean;
  offers_require_review: boolean;
  attention_threshold: number;
}

export interface AdminPlatformConfigNotifications {
  expo_push_enabled: boolean;
  email_system_available: boolean;
}

export interface AdminPlatformConfigReadiness {
  status: string;
  database: string;
  redis: string;
}

export interface AdminPlatformConfigPlatformRole {
  key: string;
  name: string;
}

export interface AdminPlatformConfigSystem {
  environment: string;
  service_name: string;
  readiness: AdminPlatformConfigReadiness;
  platform_roles: AdminPlatformConfigPlatformRole[];
  rate_limits_mode: string;
}

export interface AdminPlatformConfigMembershipPlan {
  code: string;
  name: string;
  monthly_price_cents: number;
}

export interface AdminPlatformConfigBusiness {
  membership_plans: AdminPlatformConfigMembershipPlan[];
  stripe_configured: boolean;
}

export interface AdminPlatformConfigViewer {
  roles: string[];
  permissions: string[];
}

export interface AdminPlatformConfigSnapshot {
  generated_at: string;
  read_only: boolean;
  general: AdminPlatformConfigGeneral;
  passport: AdminPlatformConfigPassport;
  partners: AdminPlatformConfigPartners;
  moderation: AdminPlatformConfigModeration;
  notifications: AdminPlatformConfigNotifications;
  system: AdminPlatformConfigSystem;
  business: AdminPlatformConfigBusiness;
  enabled_modules: string[];
  coming_soon: string[];
  viewer: AdminPlatformConfigViewer;
}
