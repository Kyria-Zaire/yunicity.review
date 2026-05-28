import { TribesScreen } from "@/components/tribes/tribes-screen";
import { TRIBES_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function TribesPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{TRIBES_LOADING}</p>}>
      <TribesScreen />
    </Suspense>
  );
}
