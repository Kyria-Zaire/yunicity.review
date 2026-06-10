import type { StaffNextAction } from "@yunicity/utils";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

type StaffConseilProps = {
  message: string;
  action: StaffNextAction;
};

export function StaffConseil({ message, action }: StaffConseilProps) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl bg-yunicity-primary-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="staff-conseil-title"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white">
          <GraduationCap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="staff-conseil-title" className="text-sm font-bold text-stone-950">
            Conseil
          </h2>
          <p className="mt-0.5 text-sm text-stone-700">{message}</p>
        </div>
      </div>
      <Link
        href={action.href}
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-yunicity-primary/20 bg-white px-4 py-2 text-sm font-medium text-yunicity-primary shadow-sm hover:bg-white/90"
      >
        {action.ctaLabel}
      </Link>
    </section>
  );
}
