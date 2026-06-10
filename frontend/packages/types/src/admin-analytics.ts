export type AdminAnalyticsPeriod = "7d" | "30d" | "90d";

export interface AdminAnalyticsScope {
  city: string;
  period: AdminAnalyticsPeriod;
  compare_enabled: boolean;
}

export interface AdminAnalyticsGrowth {
  active_users: number;
  new_users: number;
  new_users_previous_period: number;
  growth_rate_percent: number | null;
}

export interface AdminAnalyticsPassport {
  active_passports: number;
  activated_in_period: number;
  stamps_total: number;
  stamps_in_period: number;
  qr_claims_in_period: number;
  partner_claims_in_period: number;
  redemptions_in_period: number;
}

export interface AdminAnalyticsPartners {
  total_partners: number;
  signed: number;
  active: number;
  premium: number;
  founding: number;
  public_visible: number;
  pending_verification: number;
}

export interface AdminAnalyticsOffers {
  total: number;
  published: number;
  pending_review: number;
  draft: number;
  archived: number;
}

export interface AdminAnalyticsEvents {
  total: number;
  approved: number;
  pending_review: number;
  cancelled: number;
  archived: number;
}

export interface AdminAnalyticsCreators {
  contents_total: number;
  published: number;
  pending_review: number;
  rejected: number;
  active_creators: number;
}

export interface AdminAnalyticsCrm {
  total_leads: number;
  new: number;
  contacted: number;
  interested: number;
  meeting_scheduled: number;
  converted: number;
  rejected: number;
  archived: number;
}

export interface AdminAnalyticsAttention {
  pending_offers: number;
  pending_events: number;
  pending_creator_contents: number;
  pending_partner_verifications: number;
  open_leads: number;
}

export interface AdminAnalyticsSummary {
  generated_at: string;
  scope: AdminAnalyticsScope;
  growth: AdminAnalyticsGrowth;
  passport: AdminAnalyticsPassport;
  partners: AdminAnalyticsPartners;
  offers: AdminAnalyticsOffers;
  events: AdminAnalyticsEvents;
  creators: AdminAnalyticsCreators;
  crm: AdminAnalyticsCrm;
  attention: AdminAnalyticsAttention;
}

export interface AdminAnalyticsSummaryParams {
  city?: string;
  period?: AdminAnalyticsPeriod;
  compare?: boolean;
}
