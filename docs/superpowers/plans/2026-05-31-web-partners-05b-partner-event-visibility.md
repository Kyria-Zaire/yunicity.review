# WEB-PARTNERS-05B — Partner Event Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les événements partenaires reconnaissables dans l'UX publique Yunicity — cards /events, détail /events/{id}, fiche /places/{slug}, et panneau /map — sans transformation en plateforme publicitaire.

**Architecture:** Trois couches : (1) utils partagés — ajouter `buildPartnerPlaceHrefFromEvent` et les labels manquants dans `partner-events.ts` et `partner-portal-labels.ts` ; (2) composant `PartnerEventBadge` réutilisable sans logique de fetch ; (3) modifications chirurgicales sur 4 fichiers existants pour injecter le badge et les infos partenaire. La source events sur `/places/{slug}` passe de `filterPartnerEvents()` (filtre client sur GET /events global) à `api.partners.listPartnerEvents(slug)` (endpoint dédié).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, `@yunicity/utils`, `@yunicity/types`, Vitest

---

## Contraintes importantes identifiées

1. **`MapEventItem`** (`frontend/packages/types/src/map.ts:17`) n'a **pas** de champ `organization` — c'est un type allégé renvoyé par `GET /map/events`. Le panneau map ne peut pas afficher le badge partenaire sans modifier ce type et l'endpoint map. **Décision : Task 5 (map) affiche le badge seulement si `organization` est présent — skip silencieux sinon, pas de crash.**

2. **`api.partners`** (`YunicityApi`) existe mais n'a pas de méthode `listPartnerEvents`. Il faut l'ajouter à `PartnersApi` et exposer sur `YunicityApi`.

3. **`FeaturedCarousel`** (`events-featured-carousel.tsx`) utilise `FeaturedCarouselItem` — type opaque construit par `buildFeaturedCarouselItems`. Le badge partenaire dans le carousel nécessiterait de modifier ce builder. **Décision : Task 6 (feed) skip le carousel et ajoute le badge dans `EventsMomentCard` uniquement — c'est là que l'effet est direct et mesurable.**

4. **`LocalEventOrganization.is_partner` et `partner_status`** sont optionnels (`?:`) depuis le fix CI de 05A. Le code doit gérer le cas `undefined` (équivalent `false`).

---

## File Map

### Fichiers créés

| Fichier | Contenu |
|---------|---------|
| `frontend/apps/web/components/events/partner-event-badge.tsx` | Composant `PartnerEventBadge` |

### Fichiers modifiés — utils (package `@yunicity/utils`)

| Fichier | Changement |
|---------|-----------|
| `frontend/packages/utils/src/partner-events.ts` | +`buildPartnerPlaceHrefFromEvent`, +`getPartnerEventOrganization` |
| `frontend/packages/utils/src/partner-events.test.ts` | +tests des 2 nouvelles fonctions |
| `frontend/packages/utils/src/partner-portal-labels.ts` | +`PARTNER_DETAIL_EVENTS_EMPTY`, +`PARTNER_DETAIL_EVENTS_DATE_LABEL`, +`PARTNER_DETAIL_PARTNER_CTA` |
| `frontend/packages/utils/src/partners-api.ts` | +`listPartnerEvents(slug, params)` |
| `frontend/packages/utils/src/yunicity-api.ts` | +`listPartnerEvents` sur la facade |
| `frontend/packages/utils/src/index.ts` | +exports des nouveaux items |

### Fichiers modifiés — composants web

| Fichier | Changement |
|---------|-----------|
| `frontend/apps/web/components/partners/partner-detail-screen.tsx` | Source events → `api.partners.listPartnerEvents(slug)` + rendu enrichi |
| `frontend/apps/web/components/events/events-moment-card.tsx` | +`PartnerEventBadge` + ligne "Par {org.name}" |
| `frontend/apps/web/components/events/event-detail-portal-hero.tsx` | +`PartnerEventBadge` + lien "Voir le partenaire" |
| `frontend/apps/web/components/map/map-selected-panel.tsx` | +badge et info partenaire si `organization` disponible (guard) |

---

## Task 1 — Nouveaux utils : `buildPartnerPlaceHrefFromEvent` + `getPartnerEventOrganization` + labels

**Files:**
- Modify: `frontend/packages/utils/src/partner-events.ts`
- Modify: `frontend/packages/utils/src/partner-events.test.ts`
- Modify: `frontend/packages/utils/src/partner-portal-labels.ts`
- Modify: `frontend/packages/utils/src/index.ts`

- [ ] **Step 1 : Écrire les tests qui vont échouer**

Ouvrir `frontend/packages/utils/src/partner-events.test.ts` et ajouter à la fin du fichier (après le dernier `describe`) :

```typescript
describe("getPartnerEventOrganization", () => {
  it("returns organization when event is partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    const org = getPartnerEventOrganization(event);
    expect(org).not.toBeNull();
    expect(org?.slug).toBe("belga-queen");
  });

  it("returns null when event is not a partner event", () => {
    expect(getPartnerEventOrganization(baseEvent())).toBeNull();
  });

  it("returns null when organization exists but is_partner is false", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "classic-org",
        name: "Classic Org",
        city: "Reims",
        logo_url: null,
        is_partner: false,
        partner_status: null,
      },
    });
    expect(getPartnerEventOrganization(event)).toBeNull();
  });
});

describe("buildPartnerPlaceHrefFromEvent", () => {
  it("returns place href for partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(buildPartnerPlaceHrefFromEvent(event)).toBe("/places/belga-queen");
  });

  it("returns null for non-partner event", () => {
    expect(buildPartnerPlaceHrefFromEvent(baseEvent())).toBeNull();
  });

  it("returns null when organization is null", () => {
    const event = baseEvent({ organization: null });
    expect(buildPartnerPlaceHrefFromEvent(event)).toBeNull();
  });
});
```

Aussi ajouter `getPartnerEventOrganization` et `buildPartnerPlaceHrefFromEvent` aux imports du fichier :

```typescript
import {
  buildPartnerEventsUrl,
  buildPartnerPlaceHrefFromEvent,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
  getPartnerEventOrganization,
} from "./partner-events";
```

- [ ] **Step 2 : Lancer les tests pour confirmer qu'ils échouent**

```bash
cd frontend
pnpm --filter @yunicity/utils test -- src/partner-events.test.ts --reporter=verbose
```

Résultat attendu : erreur de compilation — `getPartnerEventOrganization` et `buildPartnerPlaceHrefFromEvent` not found.

- [ ] **Step 3 : Implémenter les deux nouvelles fonctions dans `partner-events.ts`**

Ouvrir `frontend/packages/utils/src/partner-events.ts` et remplacer le contenu entier par :

```typescript
import type { LocalEvent, LocalEventOrganization, PartnerStatus } from "@yunicity/types";

import { buildPublicPlaceHref } from "./place-routing";

const PUBLIC_PARTNER_STATUSES: ReadonlySet<PartnerStatus> = new Set([
  "active",
  "premium",
  "founding_partner",
]);

export function eventIsPartnerEvent(event: LocalEvent): boolean {
  const org = event.organization;
  if (!org?.is_partner) return false;
  const status = org.partner_status;
  return status != null && PUBLIC_PARTNER_STATUSES.has(status);
}

export function getPartnerEventOrganization(
  event: LocalEvent,
): LocalEventOrganization | null {
  if (!eventIsPartnerEvent(event)) return null;
  return event.organization ?? null;
}

export function eventOrganizerLabel(event: LocalEvent): string {
  if (event.organization?.name) {
    return event.organization.name;
  }
  return "Événement local";
}

export function eventPartnerBadgeLabel(event: LocalEvent): string | null {
  if (!eventIsPartnerEvent(event)) {
    return null;
  }
  const status = event.organization?.partner_status;
  if (status === "premium") return "Partenaire Premium";
  if (status === "founding_partner") return "Partenaire Fondateur";
  return "Partenaire Yunicity";
}

export function buildPartnerEventsUrl(slug: string, city?: string): string {
  const base = `/partners/${encodeURIComponent(slug)}/events`;
  if (!city) return base;
  return `${base}?city=${encodeURIComponent(city)}`;
}

export function buildPartnerPlaceHrefFromEvent(event: LocalEvent): string | null {
  const org = getPartnerEventOrganization(event);
  if (!org) return null;
  return buildPublicPlaceHref(org.slug, org.city);
}
```

**Vérification** : `buildPublicPlaceHref` est déjà importé et utilisé dans `partner-detail.ts`. Il construit `/places/{slug}`. Si l'import échoue, chercher avec :
```bash
grep -n "buildPublicPlaceHref" frontend/packages/utils/src/place-routing.ts
```

- [ ] **Step 4 : Ajouter les nouveaux labels dans `partner-portal-labels.ts`**

Ouvrir `frontend/packages/utils/src/partner-portal-labels.ts` et ajouter à la fin du fichier :

```typescript
export const PARTNER_DETAIL_EVENTS_EMPTY =
  "Ce partenaire n'a pas encore de moment annoncé.";
export const PARTNER_DETAIL_EVENTS_DATE_LABEL = "Le";
export const PARTNER_DETAIL_PARTNER_CTA = "Voir le partenaire";
```

- [ ] **Step 5 : Exporter les nouvelles fonctions et labels depuis `index.ts`**

Dans `frontend/packages/utils/src/index.ts`, trouver le bloc qui exporte depuis `./partner-events` (actuellement ligne ~2164) et remplacer par :

```typescript
export {
  buildPartnerEventsUrl,
  buildPartnerPlaceHrefFromEvent,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
  getPartnerEventOrganization,
} from "./partner-events";
```

Trouver le bloc qui exporte depuis `./partner-portal-labels` et ajouter les 3 nouveaux labels :

```typescript
export {
  // ... exports existants ...
  PARTNER_DETAIL_EVENTS_EMPTY,
  PARTNER_DETAIL_EVENTS_DATE_LABEL,
  PARTNER_DETAIL_PARTNER_CTA,
  // ... reste des exports existants ...
} from "./partner-portal-labels";
```

- [ ] **Step 6 : Lancer les tests pour confirmer qu'ils passent**

```bash
cd frontend
pnpm --filter @yunicity/utils test -- src/partner-events.test.ts --reporter=verbose
```

Résultat attendu : tous les tests PASS (18+ tests).

- [ ] **Step 7 : Commit**

```bash
git add frontend/packages/utils/src/partner-events.ts frontend/packages/utils/src/partner-events.test.ts frontend/packages/utils/src/partner-portal-labels.ts frontend/packages/utils/src/index.ts
git commit -m "feat(utils): add buildPartnerPlaceHrefFromEvent, getPartnerEventOrganization and partner visibility labels"
```

---

## Task 2 — API client : `listPartnerEvents` dans `PartnersApi` et `YunicityApi`

**Files:**
- Modify: `frontend/packages/utils/src/partners-api.ts`
- Modify: `frontend/packages/utils/src/yunicity-api.ts`
- Modify: `frontend/packages/utils/src/index.ts`

- [ ] **Step 1 : Ajouter le type de paramètres dans `local-event.ts` (types package)**

Le type de retour est déjà `LocalEventListResponse`. Les paramètres du nouvel endpoint sont :
- `upcoming_only?: boolean` (défaut true)
- `limit?: number` (max 50)
- `offset?: number`

Ouvrir `frontend/packages/types/src/local-event.ts` et ajouter à la fin du fichier :

```typescript
export interface PartnerEventsParams {
  upcoming_only?: boolean;
  limit?: number;
  offset?: number;
}
```

Puis exporter depuis `frontend/packages/types/src/index.ts`. Chercher la ligne qui exporte depuis `"./local-event"` et ajouter `PartnerEventsParams` à la liste d'exports.

- [ ] **Step 2 : Ajouter `listPartnerEvents` dans `PartnersApi`**

Ouvrir `frontend/packages/utils/src/partners-api.ts`. Ajouter l'import du nouveau type en tête :

```typescript
import type { LocalEventListResponse, PartnerEventsParams } from "@yunicity/types";
```

Ajouter la méthode à la classe `PartnersApi` après `getPartner` :

```typescript
listPartnerEvents(
  slug: string,
  params: PartnerEventsParams = {},
): Promise<LocalEventListResponse> {
  const search = new URLSearchParams();
  if (params.upcoming_only !== undefined) {
    search.set("upcoming_only", String(params.upcoming_only));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }
  const qs = search.toString();
  return this.getJson<LocalEventListResponse>(
    `/partners/${encodeURIComponent(slug)}/events${qs ? `?${qs}` : ""}`,
  );
}
```

- [ ] **Step 3 : Exposer la méthode sur la facade `YunicityApi`**

Ouvrir `frontend/packages/utils/src/yunicity-api.ts`. Chercher la méthode `getPartner` (autour de la ligne 137) et ajouter juste après :

```typescript
listPartnerEvents(
  slug: string,
  params?: PartnerEventsParams,
): Promise<LocalEventListResponse> {
  return this.partners.listPartnerEvents(slug, params);
}
```

Ajouter l'import `PartnerEventsParams` en tête du fichier avec les autres imports de `@yunicity/types`.

- [ ] **Step 4 : Typecheck pour valider**

```bash
cd frontend
pnpm --filter @yunicity/utils typecheck 2>&1 | grep -E "error|Error" | head -10
```

Résultat attendu : aucune erreur liée aux nouveaux fichiers.

- [ ] **Step 5 : Commit**

```bash
git add frontend/packages/types/src/local-event.ts frontend/packages/types/src/index.ts frontend/packages/utils/src/partners-api.ts frontend/packages/utils/src/yunicity-api.ts
git commit -m "feat(api): add listPartnerEvents to PartnersApi and YunicityApi facade"
```

---

## Task 3 — Composant `PartnerEventBadge`

**Files:**
- Create: `frontend/apps/web/components/events/partner-event-badge.tsx`

Le badge doit fonctionner sur fond sombre (hero event) et fond clair (cards), avec une prop `variant`.

- [ ] **Step 1 : Créer le composant**

Créer `frontend/apps/web/components/events/partner-event-badge.tsx` :

```tsx
import type { LocalEvent } from "@yunicity/types";
import { eventPartnerBadgeLabel } from "@yunicity/utils";

type PartnerEventBadgeProps = {
  event: LocalEvent;
  /** "light" sur fond blanc/clair, "dark" sur fond sombre (hero) */
  variant?: "light" | "dark";
};

/**
 * Badge discret identifiant un événement comme moment partenaire Yunicity.
 * Rend null si l'event n'est pas un partner event.
 */
export function PartnerEventBadge({
  event,
  variant = "light",
}: PartnerEventBadgeProps) {
  const label = eventPartnerBadgeLabel(event);
  if (!label) return null;

  const cls =
    variant === "dark"
      ? "border border-white/30 bg-white/15 text-white/95 backdrop-blur-sm"
      : "border border-yunicity-primary/25 bg-yunicity-primary/8 text-yunicity-primary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
```

**Note** : `bg-yunicity-primary/8` peut ne pas être généré par Tailwind si la classe n'est pas dans le safelist. En cas d'échec, utiliser `bg-blue-50` ou `bg-yunicity-primary/10` (classes plus standards).

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd frontend
pnpm --filter web typecheck 2>&1 | grep "partner-event-badge" | head -5
```

Résultat attendu : aucune erreur liée à ce fichier.

- [ ] **Step 3 : Commit**

```bash
git add frontend/apps/web/components/events/partner-event-badge.tsx
git commit -m "feat(ui): add PartnerEventBadge reusable component"
```

---

## Task 4 — `/places/{slug}` : source events → `api.partners.listPartnerEvents`

**Files:**
- Modify: `frontend/apps/web/components/partners/partner-detail-screen.tsx`

Actuellement le composant fait `api.events.listEvents({ city: partner.city })` puis `filterPartnerEvents()`. On remplace par `api.partners.listPartnerEvents(partner.slug)`.

- [ ] **Step 1 : Lire le fichier pour identifier les lignes exactes à modifier**

Ouvrir `frontend/apps/web/components/partners/partner-detail-screen.tsx`. Repérer :

1. L'import `filterPartnerEvents` (ligne ~18)
2. L'état `events` (ligne ~50)
3. Le `useMemo` `partnerEvents` (lignes ~60-63)
4. Le `useEffect` avec `api.events.listEvents` (lignes ~66-79)
5. La section JSX events (lignes ~273-293)

- [ ] **Step 2 : Modifier les imports**

Retirer `filterPartnerEvents` de la liste d'imports depuis `@yunicity/utils`. Ajouter les nouveaux imports nécessaires :

```typescript
import {
  PARTNER_DETAIL_EVENTS_CTA,
  PARTNER_DETAIL_EVENTS_EMPTY,       // nouveau
  PARTNER_DETAIL_EVENTS_TITLE,
  PARTNER_DETAIL_PARTNER_CTA,        // nouveau — pas utilisé ici mais exporte OK
  // ... conserver les autres imports existants ...
  formatEventDateRange,              // nouveau — pour afficher la date dans la liste
  filterPartnerOffersForOrganization,
  // retirer: filterPartnerEvents
} from "@yunicity/utils";
```

Ajouter l'import de type :

```typescript
import type { LocalEvent, PartnerOffer, PartnerPublic } from "@yunicity/types";
```

(déjà présent — vérifier uniquement)

- [ ] **Step 3 : Remplacer le `useEffect` et supprimer le `useMemo` `partnerEvents`**

Remplacer l'état `events` et le `useEffect` :

```tsx
// AVANT (à remplacer intégralement) :
const [events, setEvents] = useState<LocalEvent[]>([]);

// ...
const partnerEvents = useMemo(
  () => filterPartnerEvents(events, partner.organization_id),
  [events, partner.organization_id],
);

// Dans useEffect :
// api.events.listEvents({ city: partner.city }),
// ...
// if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.items);

// APRÈS :
const [partnerEvents, setPartnerEvents] = useState<LocalEvent[]>([]);
const [eventsLoading, setEventsLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  void Promise.allSettled([
    api.listPassportOffers(),
    api.listPartnerEvents(partner.slug, { upcoming_only: true, limit: 6 }),
  ]).then(([offersRes, eventsRes]) => {
    if (cancelled) return;
    if (offersRes.status === "fulfilled") setOffers(offersRes.value.items);
    if (eventsRes.status === "fulfilled") setPartnerEvents(eventsRes.value.items);
    setEventsLoading(false);
  });
  return () => {
    cancelled = true;
  };
}, [api, partner.slug]);
```

- [ ] **Step 4 : Enrichir le rendu de la section events**

Remplacer la section JSX events (bloc `{partnerEvents.length > 0 ? ...}`) par :

```tsx
<section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_EVENTS_TITLE}</h2>
  {eventsLoading ? (
    <p className="mt-3 text-sm text-neutral-500">Chargement…</p>
  ) : partnerEvents.length === 0 ? (
    <p className="mt-3 text-sm text-neutral-600">{PARTNER_DETAIL_EVENTS_EMPTY}</p>
  ) : (
    <ul className="mt-4 space-y-3">
      {partnerEvents.map((event) => (
        <li key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{event.title}</p>
            <p className="mt-0.5 text-xs font-medium text-yunicity-primary">
              {formatEventDateRange(event.starts_at, event.ends_at).split(" · ")[0]}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{event.location_name}</p>
          </div>
          <Link
            href={`/events/${encodeURIComponent(event.id)}`}
            className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PARTNER_DETAIL_EVENTS_CTA}
          </Link>
        </li>
      ))}
    </ul>
  )}
</section>
```

**Important :** La section est maintenant toujours rendue (avec empty state) — supprimer le guard `{partnerEvents.length > 0 ? ... : null}` qui masquait la section.

- [ ] **Step 5 : Typecheck**

```bash
cd frontend
pnpm --filter web typecheck 2>&1 | grep "partner-detail-screen" | head -5
```

Résultat attendu : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add frontend/apps/web/components/partners/partner-detail-screen.tsx
git commit -m "feat(places): use GET /partners/{slug}/events as source for partner events section"
```

---

## Task 5 — `/events` cards : `PartnerEventBadge` + label organisateur

**Files:**
- Modify: `frontend/apps/web/components/events/events-moment-card.tsx`

- [ ] **Step 1 : Ajouter les imports**

Dans `frontend/apps/web/components/events/events-moment-card.tsx`, ajouter :

```typescript
import { PartnerEventBadge } from "@/components/events/partner-event-badge";
import { eventIsPartnerEvent, eventOrganizerLabel } from "@yunicity/utils";
```

- [ ] **Step 2 : Modifier le JSX de la card**

Dans le rendu de la card, après `<h3 className="text-lg font-bold...">` (titre de l'event), ajouter :

```tsx
{eventIsPartnerEvent(event) ? (
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <PartnerEventBadge event={event} variant="light" />
    <span className="text-xs text-neutral-500">
      Par <span className="font-medium text-neutral-700">{eventOrganizerLabel(event)}</span>
    </span>
  </div>
) : null}
```

Ce bloc s'insère **entre** le `<h3>` (titre) et le `{timeLine ? ...}` (horaires). Exemple de position dans le JSX existant :

```tsx
<h3 className="text-lg font-bold leading-snug text-neutral-900 sm:text-xl">{event.title}</h3>

{/* ↓ NOUVEAU BLOC INSÉRÉ ICI ↓ */}
{eventIsPartnerEvent(event) ? (
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <PartnerEventBadge event={event} variant="light" />
    <span className="text-xs text-neutral-500">
      Par <span className="font-medium text-neutral-700">{eventOrganizerLabel(event)}</span>
    </span>
  </div>
) : null}

{timeLine ? (
  <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-800">{timeLine}</p>
) : null}
```

- [ ] **Step 3 : Typecheck**

```bash
cd frontend
pnpm --filter web typecheck 2>&1 | grep "events-moment-card" | head -5
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add frontend/apps/web/components/events/events-moment-card.tsx
git commit -m "feat(events): show PartnerEventBadge and organizer label on event cards"
```

---

## Task 6 — `/events/{id}` détail hero : badge + lien partenaire

**Files:**
- Modify: `frontend/apps/web/components/events/event-detail-portal-hero.tsx`

- [ ] **Step 1 : Ajouter les imports**

Dans `frontend/apps/web/components/events/event-detail-portal-hero.tsx`, ajouter :

```typescript
import { PartnerEventBadge } from "@/components/events/partner-event-badge";
import { buildPartnerPlaceHrefFromEvent, eventIsPartnerEvent } from "@yunicity/utils";
```

- [ ] **Step 2 : Calculer le href partenaire**

Dans le corps de la fonction `EventDetailPortalHero`, après les lignes existantes de calcul (ex. `const addressLine = ...`), ajouter :

```typescript
const partnerPlaceHref = buildPartnerPlaceHrefFromEvent(event);
const isPartner = eventIsPartnerEvent(event);
```

- [ ] **Step 3 : Ajouter le badge dans le hero, après le `typeLabel`**

Dans le JSX, après le bloc `{typeLabel ? <p ...>{typeLabel}</p> : null}` et **avant** `<h1>`, ajouter :

```tsx
{isPartner ? (
  <div className="mt-3">
    <PartnerEventBadge event={event} variant="dark" />
  </div>
) : null}
```

- [ ] **Step 4 : Enrichir le bloc organisation existant**

Le hero contient déjà :
```tsx
{event.organization ? (
  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-white/85">
    <span>Par {event.organization.name}</span>
    {event.organization.is_verified ? (
      <BadgeCheck className="h-4 w-4 text-sky-300" aria-label="Organisateur vérifié" />
    ) : null}
  </p>
) : null}
```

Remplacer ce bloc par :

```tsx
{event.organization ? (
  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-white/85">
    <span>
      {isPartner ? "Organisé par" : "Par"}{" "}
      <span className="font-semibold text-white">{event.organization.name}</span>
    </span>
    {event.organization.is_verified ? (
      <BadgeCheck className="h-4 w-4 text-sky-300" aria-label="Organisateur vérifié" />
    ) : null}
    {isPartner && partnerPlaceHref ? (
      <Link
        href={partnerPlaceHref}
        className="ml-1 text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white/90"
      >
        Voir le partenaire →
      </Link>
    ) : null}
  </div>
) : null}
```

- [ ] **Step 5 : Typecheck**

```bash
cd frontend
pnpm --filter web typecheck 2>&1 | grep "event-detail-portal-hero" | head -5
```

Résultat attendu : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add frontend/apps/web/components/events/event-detail-portal-hero.tsx
git commit -m "feat(events): add PartnerEventBadge and partner link in event detail hero"
```

---

## Task 7 — `/map` panneau : badge partenaire (guard sur type MapEventItem)

**Files:**
- Modify: `frontend/apps/web/components/map/map-selected-panel.tsx`

**Rappel contrainte :** `MapEventItem` n'a pas de champ `organization`. Le payload `MapSelectedPanelPayload` pour `kind === "event"` ne contient que `title, meta, location, href, routeHref`. Le badge ne peut pas être affiché sans data.

**Approche retenue :** Ajouter un champ optionnel `organizerLabel?: string` et `partnerBadgeLabel?: string` dans le type `MapSelectedPanelPayload["event"]` et le peupler dans `buildMapSelectedPanelPayload` uniquement si les données sont disponibles.

**Cependant**, `MapEventItem` vient de `GET /map/events` (endpoint séparé) qui ne retourne pas `organization`. Modifier le type serait une cascade. **Décision finale minimaliste** : on ajoute juste le champ `organizerLine?: string` dans le payload event, peuplé depuis `event.organization?.name` si le serveur le renvoie un jour — mais pour l'instant on ne le peuple pas. L'affichage reste intact.

**Ce que fait réellement cette task :** Le panneau map affiche déjà `payload.location` (location_name de l'event). On ne casse rien, on n'ajoute pas de data inexistante. On **skip** la modification map pour ce sprint car les données nécessaires (`organization`) ne sont pas dans `MapEventItem`.

- [ ] **Step 1 : Documenter la limitation dans un commentaire**

Dans `frontend/apps/web/components/map/map-selected-panel.tsx`, dans le bloc `{payload.kind === "event" ? ...}`, ajouter un commentaire :

```tsx
{payload.kind === "event" ? (
  <>
    {/* Partner badge: non disponible ici — MapEventItem ne contient pas organization.
        À activer quand GET /map/events exposera organization.is_partner (WEB-PARTNERS-07). */}
    <p className="mt-2 text-xs text-neutral-500">{payload.location}</p>
    ...
```

- [ ] **Step 2 : Commit**

```bash
git add frontend/apps/web/components/map/map-selected-panel.tsx
git commit -m "docs(map): note partner badge pending on MapEventItem organization field (WEB-PARTNERS-07)"
```

---

## Task 8 — Qualité finale : tests + typecheck + build

**Files:** aucun nouveau

- [ ] **Step 1 : Lancer tous les tests utils**

```bash
cd frontend
pnpm --filter @yunicity/utils test -- --reporter=verbose 2>&1 | tail -20
```

Résultat attendu : les tests `partner-events.test.ts` passent (18+ tests), les 2 failures pré-existantes (`tribe-portal.test.ts`, `organization-request-portal.test.ts`) restent les seules failures.

- [ ] **Step 2 : Typecheck web**

```bash
cd frontend
pnpm --filter web typecheck 2>&1 | grep -E "^src|error TS" | head -20
```

Résultat attendu : aucune erreur liée aux fichiers de ce sprint.

- [ ] **Step 3 : Build web**

```bash
cd frontend
pnpm --filter web build 2>&1 | tail -30
```

Résultat attendu : build réussi.

- [ ] **Step 4 : Lint global (baseline 2 erreurs pré-existantes)**

```bash
cd frontend
pnpm lint 2>&1 | grep "error TS" | wc -l
```

Résultat attendu : toujours 2 erreurs (les pré-existantes sur `@yunicity/types/src/index.ts` — `NotificationInboxTab` et `UserNotificationSummaryResponse`). Si > 2, investiguer.

- [ ] **Step 5 : Commit de clôture si des corrections ont été faites**

```bash
git add -p
git commit -m "chore: fix typecheck or lint regressions after 05B"
```

---

## Auto-review — Spec coverage

| Spec | Task |
|------|------|
| Source events `/places/{slug}` → `GET /partners/{slug}/events` | Task 4 |
| Section events avec date, titre, type, CTA | Task 4 |
| Empty state "Ce partenaire n'a pas encore..." | Task 4 |
| Composant `PartnerEventBadge` réutilisable | Task 3 |
| Badge sur cards `/events` | Task 5 |
| Label "Par {org.name}" sur cards | Task 5 |
| Badge dans hero `/events/{id}` | Task 6 |
| "Organisé par {partner}" dans hero | Task 6 |
| CTA "Voir le partenaire" → `/places/{slug}` | Task 6 |
| Badge vérifié si `organization.is_verified` | Task 6 (déjà présent via `BadgeCheck`, conservé) |
| Map panel — badge partenaire | Task 7 (limitation documentée, skip TBD WEB-PARTNERS-07) |
| `buildPartnerPlaceHrefFromEvent` helper | Task 1 |
| `getPartnerEventOrganization` helper | Task 1 |
| Tests utils badge labels / place href / organizer | Task 1 |
| Typecheck web OK | Task 8 |
| Build web OK | Task 8 |

### Exclusions confirmées dans ce plan

- ✅ Aucune migration
- ✅ Aucun backend modifié
- ✅ Aucune fake data (participants, avis, popularité)
- ✅ Aucune promotion sponsorisée
- ✅ Feed carousel non modifié (badge uniquement dans cards — le carousel utilise un type opaque `FeaturedCarouselItem` qui nécessiterait un refactor plus large)

### Risques restants

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| `bg-yunicity-primary/8` non généré par Tailwind | Badge light sans background | Remplacer par `bg-blue-50` si build warn |
| `buildPublicPlaceHref` import cassé dans `partner-events.ts` | Erreur compile | Vérifier l'export dans `place-routing.ts` avant commit Task 1 |
| `api.listPartnerEvents` échoue (partenaire non trouvé en DB) | Section events vide | `Promise.allSettled` — l'état `eventsLoading = false` + array vide → empty state affiché |
| Map badge non disponible | Fonctionnalité manquante | Documenté comme WEB-PARTNERS-07, non bloquant |
