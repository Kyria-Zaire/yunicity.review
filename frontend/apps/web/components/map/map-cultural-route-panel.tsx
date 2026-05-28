"use client";

import type { ReactNode } from "react";
import type { CulturalPlaceListItem, MapRouteSummary } from "@yunicity/types";
import type { MapRouteProfile } from "@yunicity/utils";
import {
  MAP_CULTURE_CLOSE_ROUTE,
  MAP_CULTURE_FROM_MY_POSITION,
  MAP_CULTURE_ROUTE_ERROR,
  MAP_CULTURE_ROUTE_PANEL_PREFIX,
  MAP_ROUTE_ADDRESS_NOT_FOUND,
  MAP_ROUTE_ADDRESS_PLACEHOLDER,
  MAP_ROUTE_BACK,
  MAP_ROUTE_CALCULATE,
  MAP_ROUTE_DESTINATION_LABEL,
  MAP_ROUTE_ENTER_ADDRESS,
  MAP_ROUTE_GEO_DENIED,
  MAP_ROUTE_MODE_BIKE,
  MAP_ROUTE_MODE_DRIVE,
  MAP_ROUTE_MODE_WALK,
  MAP_ROUTE_ORIGIN_TITLE,
  MAP_ROUTE_USE_MAP_CENTER,
  formatRouteDistance,
  formatRouteDuration,
  mapRouteModeLabel,
} from "@yunicity/utils";

export type CulturalRoutePanelPhase = "pick-origin" | "enter-address" | "active";

type MapCulturalRoutePanelProps = {
  target: CulturalPlaceListItem | null;
  phase: CulturalRoutePanelPhase | null;
  routeLoading: boolean;
  routeError: boolean;
  routeSummary: MapRouteSummary | null;
  routeProfile: MapRouteProfile;
  geolocationDenied: boolean;
  addressInput: string;
  addressError: boolean;
  onClose: () => void;
  onPickMyPosition: () => void;
  onPickAddressMode: () => void;
  onPickMapCenter: () => void;
  onAddressInputChange: (value: string) => void;
  onSubmitAddress: () => void;
  onBackFromAddress: () => void;
  onChangeProfile: (profile: MapRouteProfile) => void;
};

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
    >
      {children}
    </button>
  );
}

export function MapCulturalRoutePanel({
  target,
  phase,
  routeLoading,
  routeError,
  routeSummary,
  routeProfile,
  geolocationDenied,
  addressInput,
  addressError,
  onClose,
  onPickMyPosition,
  onPickAddressMode,
  onPickMapCenter,
  onAddressInputChange,
  onSubmitAddress,
  onBackFromAddress,
  onChangeProfile,
}: MapCulturalRoutePanelProps) {
  if (!target || !phase) {
    return null;
  }

  const isActive = phase === "active";

  return (
    <div
      className="absolute left-4 right-4 top-4 z-10 rounded-2xl border border-neutral-200/90 bg-white/95 p-4 shadow-md backdrop-blur-sm"
      role="dialog"
      aria-labelledby="cultural-route-panel-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isActive ? (
            <>
              <p
                id="cultural-route-panel-title"
                className="text-xs font-medium uppercase tracking-wide text-neutral-500"
              >
                {MAP_CULTURE_ROUTE_PANEL_PREFIX}
              </p>
              <p className="font-semibold text-neutral-900">{target.name}</p>
            </>
          ) : (
            <>
              <p
                id="cultural-route-panel-title"
                className="text-sm font-semibold text-neutral-900"
              >
                {MAP_ROUTE_ORIGIN_TITLE}
              </p>
              <p className="mt-2 text-xs font-medium text-neutral-500">
                {MAP_ROUTE_DESTINATION_LABEL}
              </p>
              <p className="text-sm text-neutral-800">{target.name}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={MAP_CULTURE_CLOSE_ROUTE}
          className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {MAP_CULTURE_CLOSE_ROUTE}
        </button>
      </div>

      {phase === "pick-origin" ? (
        <div className="mt-4 space-y-2">
          {geolocationDenied ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              {MAP_ROUTE_GEO_DENIED}
            </p>
          ) : null}
          <PrimaryButton onClick={onPickMyPosition} disabled={routeLoading}>
            {MAP_CULTURE_FROM_MY_POSITION}
          </PrimaryButton>
          <SecondaryButton onClick={onPickAddressMode} disabled={routeLoading}>
            {MAP_ROUTE_ENTER_ADDRESS}
          </SecondaryButton>
          <GhostButton onClick={onPickMapCenter}>{MAP_ROUTE_USE_MAP_CENTER}</GhostButton>
        </div>
      ) : null}

      {phase === "enter-address" ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onBackFromAddress}
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_ROUTE_BACK}
          </button>
          <label className="block">
            <span className="sr-only">{MAP_ROUTE_ENTER_ADDRESS}</span>
            <input
              type="text"
              value={addressInput}
              onChange={(event) => onAddressInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && addressInput.trim().length > 0 && !routeLoading) {
                  onSubmitAddress();
                }
              }}
              placeholder={MAP_ROUTE_ADDRESS_PLACEHOLDER}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-yunicity-primary focus:outline-none focus:ring-2 focus:ring-yunicity-primary/20"
              autoComplete="street-address"
            />
          </label>
          {addressError ? (
            <p className="text-xs text-red-700">{MAP_ROUTE_ADDRESS_NOT_FOUND}</p>
          ) : null}
          <PrimaryButton
            onClick={onSubmitAddress}
            disabled={routeLoading || addressInput.trim().length === 0}
          >
            {MAP_ROUTE_CALCULATE}
          </PrimaryButton>
        </div>
      ) : null}

      {isActive ? (
        <div className="mt-3 space-y-3">
          {routeLoading ? (
            <p className="text-sm text-neutral-500">Calcul de l’itinéraire…</p>
          ) : routeError ? (
            <p className="text-sm text-neutral-600">{MAP_CULTURE_ROUTE_ERROR}</p>
          ) : routeSummary ? (
            <p className="text-sm text-neutral-600">
              {formatRouteDuration(routeSummary.durationSeconds)} ·{" "}
              {formatRouteDistance(routeSummary.distanceMeters)} ·{" "}
              {mapRouteModeLabel(routeProfile)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["walking", MAP_ROUTE_MODE_WALK],
                ["driving", MAP_ROUTE_MODE_DRIVE],
                ["cycling", MAP_ROUTE_MODE_BIKE],
              ] as const
            ).map(([profile, label]) => (
              <button
                key={profile}
                type="button"
                disabled={routeLoading}
                onClick={() => onChangeProfile(profile)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  routeProfile === profile
                    ? "bg-yunicity-primary text-white"
                    : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                } disabled:opacity-60`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
