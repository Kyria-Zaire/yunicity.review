"use client";

import { StaffConseil } from "@/components/staff/staff-conseil";
import { StaffFilters } from "@/components/staff/staff-filters";
import { StaffHero } from "@/components/staff/staff-hero";
import { StaffKpiStrip } from "@/components/staff/staff-kpi-strip";
import { StaffNextAction } from "@/components/staff/staff-next-action";
import { StaffOrganizationalHealth } from "@/components/staff/staff-organizational-health";
import { StaffRosterList } from "@/components/staff/staff-roster-list";
import { StaffSignalBanner } from "@/components/staff/staff-signal";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { useAdminStaffCommand } from "@/lib/hooks/use-admin-staff-command";
import { useAdminStaffList } from "@/lib/hooks/use-admin-staff-list";
import { staffStateToSearchParams } from "@/lib/staff-url";
import { staffHasActiveFilters } from "@yunicity/utils";

export function StaffWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    reload,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
    goToPage,
  } = useAdminStaffList();

  const command = useAdminStaffCommand();
  const listSearchQuery = staffStateToSearchParams(state);
  const rosterIsEmpty = (command.metrics?.total ?? 0) === 0;
  const hasActiveFilters = staffHasActiveFilters(state);

  async function handleRefresh() {
    await Promise.all([reload(), command.reload()]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <StaffHero
        isLoading={isLoading || command.isLoading}
        onRefresh={() => void handleRefresh()}
      />
      {command.error && !command.metrics ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {command.error}
          <button
            type="button"
            onClick={() => void command.reload()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      ) : null}
      {command.signal ? <StaffSignalBanner signal={command.signal} /> : null}
      {command.nextAction ? (
        <StaffNextAction action={command.nextAction} onRefresh={handleRefresh} />
      ) : null}
      <StaffKpiStrip cards={command.kpiCards} />
      {command.organizationalHealth ? (
        <StaffOrganizationalHealth health={command.organizationalHealth} />
      ) : null}
      <StaffFilters
        state={state}
        isLoading={isLoading}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onRefresh={() => void handleRefresh()}
      />
      <StaffRosterList
        items={items}
        listSearchQuery={listSearchQuery}
        roleFilter={state.role}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        rosterIsEmpty={rosterIsEmpty}
        onRetry={reload}
        onResetFilters={resetFilters}
      />
      <PassportOpsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={goToPage}
      />
      {command.conseilMessage && command.conseilAction ? (
        <StaffConseil message={command.conseilMessage} action={command.conseilAction} />
      ) : null}
    </div>
  );
}
