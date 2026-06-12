"use client";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { buildLoginUrlWithNext } from "@yunicity/utils";
import { useRouter } from "next/navigation";

interface SessionExpiredPanelProps {
  title?: string;
  message: string;
  returnPath: string;
}

export function SessionExpiredPanel({
  title = "Session expirée",
  message,
  returnPath,
}: SessionExpiredPanelProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-amber-200/90 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
      <button
        type="button"
        onClick={() => router.replace(buildLoginUrlWithNext(returnPath))}
        className={`mt-6 ${yunicityBtnPrimary}`}
      >
        Se reconnecter
      </button>
    </div>
  );
}
