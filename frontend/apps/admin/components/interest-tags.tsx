import type { PartnerLead } from "@yunicity/types";

const INTEREST_FIELDS: {
  key: keyof Pick<
    PartnerLead,
    | "interested_passport"
    | "interested_events"
    | "interested_creator_program"
    | "interested_offers"
    | "interested_business_passport"
  >;
  label: string;
}[] = [
  { key: "interested_passport", label: "Passport" },
  { key: "interested_events", label: "Événements" },
  { key: "interested_creator_program", label: "Créateurs" },
  { key: "interested_offers", label: "Offres" },
  { key: "interested_business_passport", label: "Business Passport" },
];

export function InterestTags({ lead }: { lead: PartnerLead }) {
  const active = INTEREST_FIELDS.filter((field) => lead[field.key]);

  if (active.length === 0) {
    return <span className="text-xs text-muted-foreground">Aucun intérêt signalé</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((field) => (
        <span
          key={field.key}
          className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
        >
          {field.label}
        </span>
      ))}
    </div>
  );
}
