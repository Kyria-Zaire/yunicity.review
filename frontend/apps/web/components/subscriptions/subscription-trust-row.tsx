"use client";

import {
  SUBSCRIPTION_TRUST_CANCEL,
  SUBSCRIPTION_TRUST_CANCEL_HINT,
  SUBSCRIPTION_TRUST_LOCAL,
  SUBSCRIPTION_TRUST_LOCAL_HINT,
  SUBSCRIPTION_TRUST_NO_COMMITMENT,
  SUBSCRIPTION_TRUST_NO_COMMITMENT_HINT,
  SUBSCRIPTION_TRUST_SECURE,
  SUBSCRIPTION_TRUST_SECURE_HINT,
} from "@yunicity/utils";
import { Heart, Lock, ShieldCheck, XCircle } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    tone: "bg-blue-50 text-blue-600",
    title: SUBSCRIPTION_TRUST_NO_COMMITMENT,
    hint: SUBSCRIPTION_TRUST_NO_COMMITMENT_HINT,
  },
  {
    icon: Lock,
    tone: "bg-emerald-50 text-emerald-600",
    title: SUBSCRIPTION_TRUST_SECURE,
    hint: SUBSCRIPTION_TRUST_SECURE_HINT,
  },
  {
    icon: Heart,
    tone: "bg-pink-50 text-pink-600",
    title: SUBSCRIPTION_TRUST_LOCAL,
    hint: SUBSCRIPTION_TRUST_LOCAL_HINT,
  },
  {
    icon: XCircle,
    tone: "bg-orange-50 text-orange-600",
    title: SUBSCRIPTION_TRUST_CANCEL,
    hint: SUBSCRIPTION_TRUST_CANCEL_HINT,
  },
] as const;

export function SubscriptionTrustRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
              <span className="block text-xs text-neutral-500">{item.hint}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
