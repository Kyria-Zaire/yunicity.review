import {
  LEGAL_BACK_LABEL,
  LEGAL_SETTINGS_CTA,
} from "@/lib/legal/legal-document-content";
import Link from "next/link";

type LegalDocumentScreenProps = {
  title: string;
  intro: string;
  body: string;
  settingsHref?: string;
};

export function LegalDocumentScreen({
  title,
  intro,
  body,
  settingsHref,
}: LegalDocumentScreenProps) {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8 sm:px-6">
      <Link
        href="/feed"
        className="text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover hover:underline"
      >
        ← {LEGAL_BACK_LABEL}
      </Link>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">{intro}</p>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{body}</p>

      {settingsHref ? (
        <Link
          href={settingsHref}
          className="mt-6 inline-flex rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          {LEGAL_SETTINGS_CTA}
        </Link>
      ) : null}
    </main>
  );
}
