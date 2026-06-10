"use client";

import { AdminNavLink } from "@/components/admin-nav-link";
import { YunicityLogo } from "@/components/yunicity-logo";
import { PARTNER_NAV_ITEMS, STAFF_NAV_GROUPS } from "@/lib/admin-nav-items";
import { shouldShowPartnerNavBlock } from "@/lib/admin-sidebar-nav";

interface AdminSidebarProps {
  staff: boolean;
  homeHref: string;
}

export function AdminSidebar({ staff, homeHref }: AdminSidebarProps) {
  const showPartnerNav = shouldShowPartnerNavBlock(staff);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-100 px-5 py-5">
        <YunicityLogo href={homeHref} size="md" showWordmark />
        <p className="mt-1.5 text-xs text-stone-500">
          {staff ? "Centre de pilotage territorial" : "Espace partenaire"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        {showPartnerNav ? (
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-2">
            <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Partenaire
            </p>
            <div className="space-y-0.5">
              {PARTNER_NAV_ITEMS.map((item) => (
                <AdminNavLink key={item.href} item={item} variant="sidebar" />
              ))}
            </div>
          </div>
        ) : null}

        {staff ? (
          <div className={showPartnerNav ? "mt-5 space-y-5" : "space-y-5"}>
            {STAFF_NAV_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <AdminNavLink key={item.href} item={item} variant="sidebar" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
