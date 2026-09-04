"use client";

import { NeighborhoodsDesktopScreen } from "@/components/neighborhoods/desktop";
import { NeighborhoodsMediumScreen } from "@/components/neighborhoods/medium";
import { NeighborhoodsMobileScreen } from "@/components/neighborhoods/mobile/neighborhoods-mobile-screen";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { useNeighborhoodsPortalContext } from "@/hooks/use-neighborhoods-portal-context";
import { useSearchParams } from "next/navigation";

export function NeighborhoodsScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useNeighborhoodsPortalContext(cityParam);

  return (
    <NeighborhoodsAppShell>
      <div className="web-mobile-neighborhoods-only">
        <NeighborhoodsMobileScreen
          city={context.city}
          loading={context.loading}
          error={context.error}
          neighborhoods={context.neighborhoods}
          events={context.events}
          culturalPlaces={context.culturalPlaces}
          onReload={() => void context.reload()}
        />
      </div>
      <div className="web-medium-neighborhoods-only">
        <NeighborhoodsMediumScreen
          city={context.city}
          loading={context.loading}
          error={context.error}
          neighborhoods={context.neighborhoods}
          events={context.events}
          culturalPlaces={context.culturalPlaces}
          onReload={() => void context.reload()}
        />
      </div>
      <div className="web-desktop-neighborhoods-only">
        <NeighborhoodsDesktopScreen
          city={context.city}
          loading={context.loading}
          error={context.error}
          neighborhoods={context.neighborhoods}
          events={context.events}
          culturalPlaces={context.culturalPlaces}
          onReload={() => void context.reload()}
        />
      </div>
    </NeighborhoodsAppShell>
  );
}
