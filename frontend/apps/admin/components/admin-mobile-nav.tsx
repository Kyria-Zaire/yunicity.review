"use client";

import { AdminMobileDrawer } from "@/components/admin-mobile-drawer";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminMobileNavProps {
  staff: boolean;
  homeHref: string;
  userEmail: string | null;
  onLogout: () => void;
}

export function AdminMobileNav({
  staff,
  homeHref,
  userEmail,
  onLogout,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="admin-mobile-drawer"
        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden />
        Menu
      </button>

      <AdminMobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        staff={staff}
        homeHref={homeHref}
        userEmail={userEmail}
        onLogout={onLogout}
      />
    </>
  );
}
