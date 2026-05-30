export type MembershipPlanCode = "free" | "plus" | "premium";
export type MembershipBillingInterval = "monthly" | "annual";
export type MembershipStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export type SubscriptionPlanFeature = {
  key: string;
  label: string;
  included: boolean;
};

export type SubscriptionPlanPrice = {
  monthly_cents: number;
  annual_cents: number;
  annual_monthly_equivalent_cents: number;
  currency: string;
};

export type SubscriptionPlan = {
  code: MembershipPlanCode;
  name: string;
  tagline: string;
  display_order: number;
  is_highlighted: boolean;
  price: SubscriptionPlanPrice;
  features: SubscriptionPlanFeature[];
};

export type SubscriptionPlansResponse = {
  plans: SubscriptionPlan[];
  annual_discount_percent: number;
  checkout_enabled: boolean;
};

export type SubscriptionMe = {
  plan_code: MembershipPlanCode;
  billing_interval: MembershipBillingInterval | null;
  status: MembershipStatus;
  is_paid: boolean;
  current_period_end: string | null;
  can_upgrade: boolean;
};

export type SubscriptionSupporterAvatar = {
  display_name: string;
  avatar_url: string | null;
};

export type SubscriptionCommunityStats = {
  supporter_count: number;
  avatars: SubscriptionSupporterAvatar[];
};

export type SubscriptionCheckoutRequest = {
  plan_code: "plus" | "premium";
  billing_interval: MembershipBillingInterval;
};

export type SubscriptionCheckoutResponse = {
  status: "redirect" | "unavailable";
  checkout_url: string | null;
  message: string | null;
};
