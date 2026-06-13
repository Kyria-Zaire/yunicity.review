"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_1,
  NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_2,
  NEIGHBORHOOD_V2_CONTRIBUTION_SEE_MORE_LABEL,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_SUBTITLE,
  NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_TITLE,
  NEIGHBORHOOD_V2_SHARE_MEMORY_CTA,
  NEIGHBORHOOD_V2_SHARE_MEMORY_SOON,
  createInitialContributionFormState,
  selectApprovedContributionsForDisplay,
  shouldShowContributionSeeMore,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useNeighborhoodContributionSubmit } from "@/hooks/use-neighborhood-contribution-submit";
import { NeighborhoodContributionCard } from "@/components/neighborhoods/v2/neighborhood-contribution-card";
import { NeighborhoodContributionModal } from "@/components/neighborhoods/v2/neighborhood-contribution-modal";

type NeighborhoodV2BelongingSectionProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2BelongingSection({ detail }: NeighborhoodV2BelongingSectionProps) {
  const { user, yunicityApi } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasActivePassport, setHasActivePassport] = useState(false);

  const { status, errorMessage, submit, reset } = useNeighborhoodContributionSubmit({
    slug: detail.slug,
    city: detail.city,
  });

  const contributions = selectApprovedContributionsForDisplay(detail.contributions);
  const contributionsCount = detail.stats?.contributions_count ?? contributions.length;
  const showSeeMore = shouldShowContributionSeeMore(contributionsCount);
  const displayName = user?.full_name?.trim() || "Vous";

  const loadPassportEligibility = useCallback(async () => {
    if (!user) {
      setHasActivePassport(false);
      return;
    }
    try {
      const overview = await yunicityApi.getMyPassport();
      setHasActivePassport(overview.passport?.status === "active");
    } catch {
      setHasActivePassport(false);
    }
  }, [user, yunicityApi]);

  useEffect(() => {
    if (!modalOpen) return;
    void loadPassportEligibility();
  }, [loadPassportEligibility, modalOpen]);

  async function handleSubmit(
    form: ReturnType<typeof createInitialContributionFormState>,
  ) {
    await submit(form);
  }

  useEffect(() => {
    if (status !== "success") return;
    setSuccessMessage(NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE);
    setModalOpen(false);
    reset();
  }, [reset, status]);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">
        {NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_TITLE}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_SUBTITLE}
      </p>

      {successMessage ? (
        <p
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {contributions.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {contributions.map((contribution) => (
            <li key={contribution.id}>
              <NeighborhoodContributionCard contribution={contribution} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-5">
          <p className="text-sm text-neutral-700">{NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_1}</p>
          <p className="mt-2 text-sm text-neutral-600">{NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_2}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary/90"
        >
          {NEIGHBORHOOD_V2_SHARE_MEMORY_CTA}
        </button>

        {showSeeMore ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            {NEIGHBORHOOD_V2_CONTRIBUTION_SEE_MORE_LABEL}
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              {NEIGHBORHOOD_V2_SHARE_MEMORY_SOON}
            </span>
          </button>
        ) : null}
      </div>

      <NeighborhoodContributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        displayName={displayName}
        hasActivePassport={hasActivePassport}
        status={status}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onReset={reset}
      />
    </section>
  );
}
