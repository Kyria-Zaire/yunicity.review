"use client";

import type { LegalDocumentSection } from "@/lib/legal/legal-document-contract";

type LegalDocumentSectionsProps = {
  sections: readonly LegalDocumentSection[];
  sectionIdPrefix?: string;
};

export function LegalDocumentSections({
  sections,
  sectionIdPrefix = "",
}: LegalDocumentSectionsProps) {
  return (
    <article className="legal-document-prose">
      {sections.map((section, index) => {
        const anchorId = `${sectionIdPrefix}${section.id}`;
        return (
          <section
            key={section.id}
            id={anchorId}
            aria-labelledby={`${anchorId}-title`}
            className="scroll-mt-28 border-b border-neutral-100 py-8 last:border-b-0"
          >
            <h2
              id={`${anchorId}-title`}
              className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl"
            >
              <span className="mr-2 text-yunicity-primary">{index + 1}.</span>
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="text-sm leading-7 text-neutral-700 sm:text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700 sm:text-[15px]">
                {section.bullets.map((bullet) => (
                  <li key={bullet.slice(0, 48)}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </article>
  );
}
