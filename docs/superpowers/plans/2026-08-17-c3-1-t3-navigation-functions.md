# C3.1-T3 Navigation Functions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer Explorer Reims, Menu Yunicity et Hub Créer avec des primitives accessibles partagées, sans route inventée ni CTA mort.

**Architecture:** `Dialog` étend le socle modal C3.0 ; `Popover` fournit un panneau ancré non modal avec une politique de focus par raison de fermeture. Un coordinateur web rend Explorer, Menu et Créer mutuellement exclusifs. Les contrats purs déterminent routes, auth, rôles et breakpoints avant le rendu.

**Tech Stack:** React 18.3/19 compatible, Next.js 15, TypeScript strict, Tailwind, Vitest/jsdom, Playwright, Docker Compose QA.

**Spec:** `docs/superpowers/specs/2026-08-17-c3-1-t3-navigation-functions-design.md`

## Global Constraints

- Worktree obligatoire : `C:\Users\kyria\yunicity-wt-c3-1`.
- Branche obligatoire : `feat/c3-1-navigation-entry`.
- Base obligatoire : HEAD `6543d526e3acb4ae06e94564d4633ab8447333f5`.
- Première passe sans commit, push ni PR.
- Aucun changement backend, Map interne, dépendance ou lockfile.
- Aucun CTA mort, `soon`, route inventée ou rôle dupliqué.
- Texte utilisateur en français.
- Tests TDD : RED vérifié avant chaque implémentation.
- Aucun retry, sleep arbitraire ou token fabriqué.
- QA exclusivement `yunicity_qa`.
- Le verdict final dépend des preuves ; il n’est pas prédéterminé.

---

## File Map

### Primitives UI

- Create `frontend/packages/ui/src/primitives/overlay/dialog.tsx` — façade centrée.
- Modify `frontend/packages/ui/src/primitives/overlay/overlay-behavior.ts` — géométrie `center`.
- Modify `frontend/packages/ui/src/primitives/overlay/overlay-panel.tsx` — focus initial explicite.
- Create `frontend/packages/ui/src/primitives/popover/popover-behavior.ts` — position et décisions de focus pures.
- Create `frontend/packages/ui/src/primitives/popover/popover.tsx` — adaptateur DOM non modal.
- Modify `frontend/packages/ui/src/primitives/index.ts` — exports publics.
- Modify `frontend/packages/ui/README.md` — contrats Dialog/Popover.
- Test `overlay-behavior.test.ts`, `overlay.test.tsx`, `overlay-nested.test.tsx`.
- Test `popover-behavior.test.ts`, `popover.test.tsx`.

### Orchestration web

- Create `frontend/apps/web/components/navigation/navigation-overlay-coordinator.tsx`.
- Create `frontend/apps/web/components/navigation/navigation-overlay-coordinator.test.tsx`.
- Create `frontend/apps/web/lib/layout/navigation-surfaces.ts`.
- Create `frontend/apps/web/lib/layout/navigation-surfaces.test.ts`.
- Create `frontend/apps/web/hooks/use-navigation-surfaces.ts`.
- Modify `frontend/apps/web/app/layout.tsx`.

### Explorer

- Create `frontend/apps/web/lib/explorer/explorer-contract.ts`.
- Create `frontend/apps/web/lib/explorer/explorer-contract.test.ts`.
- Create `frontend/apps/web/components/explorer/explorer-provider.tsx`.
- Create `frontend/apps/web/components/explorer/explorer-trigger-button.tsx`.
- Create `frontend/apps/web/components/explorer/explorer-panel.tsx`.
- Create `frontend/apps/web/components/search/search-city-required.tsx`.
- Create `frontend/apps/web/components/search/search-city-error.tsx`.
- Modify `search-screen.tsx`, `web-sidebar.tsx`, `citizen-top-nav.tsx`,
  `citizen-mobile-header-actions.tsx`, `web-mobile-chrome.tsx`.

### Menu

- Create `frontend/apps/web/lib/layout/yunicity-menu-contract.ts`.
- Create `frontend/apps/web/lib/layout/yunicity-menu-contract.test.ts`.
- Create `frontend/apps/web/components/layout/citizen-yunicity-menu-content.tsx`.
- Rewrite `frontend/apps/web/components/layout/citizen-yunicity-menu.tsx`.
- Modify `frontend/apps/web/lib/layout/web-layout-config.ts` and its test.
- Keep `citizen-flyout-position.ts` because `citizen-account-menu.tsx` still consumes it.

### Créer

- Create `frontend/apps/web/components/create-hub/create-hub-dialog.tsx`.
- Modify `create-hub-provider.tsx`, `create-hub-trigger-button.tsx`,
  `create-hub-action-row.tsx`, `use-create-hub-partner-access.ts`,
  `create-hub-actions.ts` and the Create Hub README.
- Remove the old Create Hub sheet/portal/FAB files after all imports are replaced.

### E2E

- Create `frontend/apps/web/e2e/functional/10-navigation-functions.spec.ts`.
- Modify Navbar/landmark specs only for shared assertions required by T3.

---

### Task 1: Add the centered `Dialog` primitive

**Files:**
- Modify: `frontend/packages/ui/src/primitives/overlay/overlay-behavior.ts`
- Modify: `frontend/packages/ui/src/primitives/overlay/overlay-panel.tsx`
- Create: `frontend/packages/ui/src/primitives/overlay/dialog.tsx`
- Modify: `frontend/packages/ui/src/primitives/index.ts`
- Test: `frontend/packages/ui/src/primitives/overlay/overlay-behavior.test.ts`
- Test: `frontend/packages/ui/src/primitives/overlay/overlay.test.tsx`
- Test: `frontend/packages/ui/src/primitives/overlay/overlay-nested.test.tsx`

**Interfaces:**
- Produces public `Dialog`, `DialogProps` **without** referencing `OverlayPanelProps` in the public declaration.
- Extends internal `OverlaySide` with `"center"`.
- Extends internal `OverlayPanelProps` with `initialFocusRef` and `restoreFocus`.
- Keeps `OverlayPanel`, stack helpers and behavior helpers private.
- Adds an exports-surface test that fails if internal symbols leak.

- [ ] **Step 1: Write failing pure geometry tests**

Add assertions equivalent to:

```ts
expect(closedTransform("center")).toBe("translateY(0.5rem) scale(0.96)");
expect(panelPositionClass("center")).toContain("relative");
expect(enteredTransform("center")).toBe("translateY(0) scale(1)");
```

- [ ] **Step 2: Run the RED test**

Run from `frontend`:

```powershell
pnpm --filter @yunicity/ui test -- overlay-behavior.test.ts
```

Expected: FAIL because `"center"` and `enteredTransform` do not exist.

- [ ] **Step 3: Extend the pure behavior**

Implement:

```ts
export type OverlaySide = "left" | "right" | "bottom" | "center";

export function enteredTransform(side: OverlaySide): string {
  return side === "center" ? "translateY(0) scale(1)" : "translate(0, 0)";
}
```

Add centered container/panel classes without using `translate(-50%, -50%)`.

- [ ] **Step 4: Write failing DOM and public-API tests**

Cover:

- `Dialog` export and centered marker;
- public `DialogProps` usable without importing `OverlayPanelProps`;
- exports test: `OverlayPanel`, `registerOverlay`, `acquireScrollLock`, `resolveTabTrap` are absent from `@yunicity/ui/primitives`;
- `role="dialog"` and `aria-modal="true"`;
- title/description links;
- explicit input via `initialFocusRef`;
- fallback first focusable;
- Escape with default restore;
- `restoreFocus={false}` leaves focus off the trigger;
- backdrop click;
- Tab and Shift+Tab loop;
- scroll lock and `inert`;
- reduced motion;
- Dialog opened over Sheet;
- removal of Sheet below Dialog without focus theft.

- [ ] **Step 5: Run the DOM tests RED**

```powershell
pnpm --filter @yunicity/ui test -- overlay.test.tsx overlay-nested.test.tsx
```

Expected: FAIL because `Dialog` / public contract / `restoreFocus` are absent.

- [ ] **Step 6: Implement the minimal facade and focus priority**

Define an explicit public type (do **not** write `Omit<OverlayPanelProps, "side">` in the public export):

```tsx
export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: (props: OverlayTriggerProps) => ReactNode;
  title: string;
  description?: string;
  closeLabel?: string;
  dismissible?: boolean;
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  zIndex?: number;
  className?: string;
  children: ReactNode;
};

export function Dialog(props: DialogProps) {
  return <OverlayPanel {...props} side="center" />;
}
```

In the opening frame:

```ts
const explicitTarget = initialFocusRef?.current;
const fallbackTarget = focusables.length > 0 ? focusables[0] : panel;
const target = explicitTarget?.isConnected ? explicitTarget : fallbackTarget;
target?.focus();
```

On cleanup, restore previous focus only when `restoreFocus !== false` and the overlay was topmost.

- [ ] **Step 7: Run all UI tests GREEN**

```powershell
pnpm --filter @yunicity/ui test
```

Expected: all existing Sheet/Drawer tests plus Dialog tests pass.

---

### Task 2: Add the non-modal `Popover` primitive

**Files:**
- Create: `frontend/packages/ui/src/primitives/popover/popover-behavior.ts`
- Create: `frontend/packages/ui/src/primitives/popover/popover-behavior.test.ts`
- Create: `frontend/packages/ui/src/primitives/popover/popover.tsx`
- Create: `frontend/packages/ui/src/primitives/popover/popover.test.tsx`
- Modify: `frontend/packages/ui/src/primitives/index.ts`
- Modify: `frontend/packages/ui/vitest.setup.ts`
- Modify: `frontend/packages/ui/README.md`

**Interfaces:**

```ts
export type PopoverCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type PopoverContentControls = {
  close: (reason: PopoverCloseReason) => void;
};

export type PopoverTriggerProps = {
  ref: RefCallback<HTMLElement>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
  "aria-controls": string;
  id?: string;
};

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  placement: PopoverPlacement;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode | ((controls: PopoverContentControls) => ReactNode);
};
```

- [ ] **Step 1: Write failing pure position and focus-policy tests**

Test:

```ts
expect(shouldRestorePopoverFocus("escape", true, true)).toBe(true);
expect(shouldRestorePopoverFocus("outside-pointer", true, true)).toBe(false);
expect(shouldRestorePopoverFocus("focus-exit", true, true)).toBe(false);
expect(shouldRestorePopoverFocus("navigation", true, true)).toBe(false);
expect(shouldRestorePopoverFocus("superseded", true, true)).toBe(false);
expect(shouldRestorePopoverFocus("programmatic", true, true)).toBe(true);
expect(shouldRestorePopoverFocus("programmatic", false, true)).toBe(false);
expect(shouldRestorePopoverFocus("programmatic", true, false)).toBe(false);
```

Also test collision clamping for every `PopoverPlacement`.

- [ ] **Step 2: Run the pure RED test**

```powershell
pnpm --filter @yunicity/ui test -- popover-behavior.test.ts
```

Expected: FAIL because the behavior module is absent.

- [ ] **Step 3: Implement pure decisions**

Implement `computePopoverPosition`, `shouldRestorePopoverFocus` and the focusable-order helper without DOM side effects in the position function.

- [ ] **Step 4: Write failing DOM tests by close reason**

Separate tests must prove:

1. Escape closes and focuses trigger.
2. Pointer down on an external button closes and leaves focus on that button.
3. Tab after the last panel item closes and focuses the next document item.
4. Shift+Tab before the first panel item closes and focuses the previous document item.
5. `close("navigation")` does not focus the trigger.
6. `close("superseded")` does not focus the trigger.
7. Programmatic unmount restores only if active focus is inside and trigger is connected.
8. Programmatic unmount does not restore when focus is already outside.
9. Scroll and resize recompute placement.
10. Trigger receives `aria-haspopup="dialog"`, stable `aria-controls`, and composed `onClick`/`ref` without silent overwrite.
11. No backdrop, `aria-modal`, `inert`, `aria-hidden` or body scroll lock.
12. Portal and listeners disappear after unmount.

- [ ] **Step 5: Run the DOM RED test**

```powershell
pnpm --filter @yunicity/ui test -- popover.test.tsx
```

Expected: FAIL because `Popover` is absent.

- [ ] **Step 6: Implement the DOM adapter**

Implementation rules:

- create one marked portal root per mounted Popover;
- store `closeReasonRef` before requesting controlled closure;
- attach Escape in capture phase;
- attach outside `pointerdown` without `preventDefault`;
- expose `close("navigation")` to content render-prop;
- intercept only boundary Tab/Shift+Tab to continue relative to the trigger;
- never call `trigger.focus()` from generic cleanup;
- restore only through `shouldRestorePopoverFocus`;
- remove scroll/resize/pointer/key listeners idempotently.

- [ ] **Step 7: Strengthen leak detection**

After each UI test, assert:

```ts
expect(document.querySelectorAll("[data-yunicity-popover-root]")).toHaveLength(0);
expect(document.body.style.overflow).toBe("");
expect(document.querySelectorAll("[inert]")).toHaveLength(0);
```

- [ ] **Step 8: Run the full UI suite GREEN**

```powershell
pnpm --filter @yunicity/ui test
pnpm --filter @yunicity/ui typecheck
```

Expected: both commands pass.

---

### Task 3: Add pure navigation contracts and atomic surface coordination

**Files:**
- Create: `frontend/apps/web/lib/layout/navigation-surfaces.ts`
- Create: `frontend/apps/web/lib/layout/navigation-surfaces.test.ts`
- Create: `frontend/apps/web/hooks/use-navigation-surfaces.ts`
- Create: `frontend/apps/web/components/navigation/navigation-overlay-coordinator.tsx`
- Create: `frontend/apps/web/components/navigation/navigation-overlay-coordinator.test.tsx`
- Modify: `frontend/apps/web/app/layout.tsx`

**Interfaces:**

```ts
export const NAVIGATION_MOBILE_MAX_QUERY = "(max-width: 639.98px)";
export const NAVIGATION_DESKTOP_MIN_QUERY = "(min-width: 1280px)";
export const NAVIGATION_MOBILE_MAX_PX = 639.98;
export const NAVIGATION_DESKTOP_MIN_PX = 1280;

export type ExplorerSurface = "drawer" | "dialog";
export type YunicityMenuSurface = "drawer" | "sheet" | "popover";

export function resolveExplorerSurface(width: number): ExplorerSurface;
export function resolveYunicityMenuSurface(width: number): YunicityMenuSurface;

export type NavigationSurfaceId = "explorer" | "menu" | "create";
export type NavigationSurfaceCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type NavigationOverlayState = {
  activeSurface: NavigationSurfaceId | null;
  explorerSurface: ExplorerSurface | null;
  menuSurface: YunicityMenuSurface | null;
};

openSurface(id: NavigationSurfaceId): void;
closeSurface(id: NavigationSurfaceId, reason: NavigationSurfaceCloseReason): void;
```

- [ ] **Step 1: Write failing boundary tests against T2 chrome thresholds**

Assert:

```ts
expect(resolveExplorerSurface(639.98)).toBe("drawer");
expect(resolveExplorerSurface(640)).toBe("dialog");
expect(resolveYunicityMenuSurface(639.98)).toBe("drawer");
expect(resolveYunicityMenuSurface(640)).toBe("sheet");
expect(resolveYunicityMenuSurface(1279.98)).toBe("sheet");
expect(resolveYunicityMenuSurface(1280)).toBe("popover");
```

Also assert acceptance viewports map correctly:

```ts
expect(resolveYunicityMenuSurface(390)).toBe("drawer");
expect(resolveYunicityMenuSurface(900)).toBe("sheet");
expect(resolveYunicityMenuSurface(1366)).toBe("popover");
```

Do **not** introduce `900` or `1366` as technical thresholds.

- [ ] **Step 2: Run RED**

```powershell
pnpm --filter web test -- navigation-surfaces.test.ts
```

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement constants and resolvers**

Reuse the exact T2 media-query strings. Prefer `matchMedia` over ad-hoc `resize` width polling. Keep a pure width resolver for unit tests.

- [ ] **Step 4: Implement the atomic coordinator + single responsive authority**

One provider owns:

- `activeSurface` as the only open authority;
- one pair of `matchMedia` listeners (`NAVIGATION_MOBILE_MAX_QUERY`, `NAVIGATION_DESKTOP_MIN_QUERY`);
- derived `explorerSurface` / `menuSurface`;
- cleanup on unmount.

Rules for surfaces:

- `open = activeSurface === id` (no independent open booleans);
- `openSurface(id)` while another is active closes the previous with `superseded` in the same state transition;
- `closeSurface(id, reason)` clears only if `activeSurface === id`;
- modal consumers pass `restoreFocus={lastCloseReason !== "superseded"}`;
- Popover consumers call `close("superseded")` / receive that reason and do not restore focus;
- never commit a React tree with two strategic surface portals open.

`useNavigationSurfaces()` is a **context consumer only** — zero additional listeners.

- [ ] **Step 5: Write failing exclusivity tests**

Prove:

- Menu then Ctrl/Meta+K → only Explorer;
- Explorer then Create → only Create;
- Popover Menu replaced by Dialog Explorer;
- Drawer/Sheet Menu replaced by Dialog Explorer;
- never more than one strategic portal;
- final focus is not the superseded trigger;
- no residual body lock / `inert`.

- [ ] **Step 6: Wire providers without replacing the existing layout tree**

Preserve exact business order of existing providers. Insert only:

```tsx
<AuthProvider>
  <NavigationOverlayCoordinatorProvider>
    <ExplorerProvider>
      <CreateHubProvider>{children}</CreateHubProvider>
    </ExplorerProvider>
  </NavigationOverlayCoordinatorProvider>
</AuthProvider>
```

Do not remove, reorder or flatten any other provider already present. Wire Explorer only once it exists in Task 4; until then keep the tree buildable with coordinator wrapping `CreateHubProvider` alone.

- [ ] **Step 7: Run targeted tests GREEN**

```powershell
pnpm --filter web test -- navigation-surfaces.test.ts navigation-overlay-coordinator.test.tsx
pnpm --filter web typecheck
```

---

### Task 4: Implement Explorer Reims and city loading / missing / error states

**Files:**
- Create: `frontend/apps/web/lib/explorer/explorer-contract.ts`
- Create: `frontend/apps/web/lib/explorer/explorer-contract.test.ts`
- Create: `frontend/apps/web/components/explorer/explorer-provider.tsx`
- Create: `frontend/apps/web/components/explorer/explorer-trigger-button.tsx`
- Create: `frontend/apps/web/components/explorer/explorer-panel.tsx`
- Create: `frontend/apps/web/components/search/search-city-required.tsx`
- Create: `frontend/apps/web/components/search/search-city-error.tsx`
- Modify: `frontend/apps/web/components/search/search-screen.tsx`
- Modify: `frontend/apps/web/app/layout.tsx`
- Modify: `frontend/apps/web/components/layout/web-sidebar.tsx`
- Modify: `frontend/apps/web/components/layout/citizen-top-nav.tsx`
- Modify: `frontend/apps/web/components/layout/citizen-mobile-header-actions.tsx`
- Modify: `frontend/apps/web/components/layout/web-mobile-chrome.tsx`
- Modify: `frontend/apps/web/lib/layout/web-layout-config.ts`
- Test: `frontend/apps/web/lib/layout/web-layout-config.test.ts`

**Interfaces:**

```ts
export function buildExplorerSearchPath(input: {
  query?: string;
  city?: string | null;
}): string;

export function buildExplorerLoginHref(input: {
  query?: string;
  city?: string | null;
}): string;

export function resolveRealSearchCity(...candidates: Array<string | null | undefined>): string | null;

export function isEditableShortcutTarget(target: EventTarget | null): boolean;

export type SearchCityState =
  | { status: "loading" }
  | { status: "ready"; city: string }
  | { status: "missing" }
  | { status: "error"; retry: () => void };
```

- [ ] **Step 1: Write failing contract tests**

Cover:

```ts
expect(buildExplorerSearchPath({})).toBe("/search");
expect(buildExplorerSearchPath({ query: "  marché local  " }))
  .toBe("/search?q=march%C3%A9+local");
expect(buildExplorerSearchPath({ query: "x", city: " Reims " }))
  .toBe("/search?q=x&city=Reims");
expect(buildExplorerSearchPath({ query: "x", city: " " }))
  .toBe("/search?q=x");
expect(decodeURIComponent(new URL(buildExplorerLoginHref({}), "http://local").searchParams.get("next")!))
  .toBe("/search");
```

Also assert malicious query text remains a query value and never changes the `/search` pathname.

- [ ] **Step 2: Run RED**

```powershell
pnpm --filter web test -- explorer-contract.test.ts
```

- [ ] **Step 3: Implement contracts using existing authorities**

Requirements:

- `URLSearchParams` for query/city;
- `resolveAuthReturnPath(path, "/search")`;
- `buildLoginUrlWithNext(safePath)`;
- direct import of `isSearchQueryReady`;
- no local regex for open redirects;
- no new minimum query constant.

- [ ] **Step 4: Write failing city-state tests**

Cover loading, ready, missing, error, retry and stale/cancelled response ignored.

Rules:

- `missing` only after a successful profile/auth response confirming empty city;
- network/timeout/invalid → `error` with `retry`;
- error copy must not claim the profile is incomplete;
- no search API call in loading/missing/error.

- [ ] **Step 5: Refactor `/search` city resolution**

Replace:

```ts
urlCity.trim() || user?.city?.trim() || "Reims"
```

with the four-state machine above. Mount `GeoProvider` / search hooks only for `ready`.

- [ ] **Step 6: Implement the global Explorer provider**

Provider owns:

- derivation `open = activeSurface === "explorer"`;
- one query draft;
- one keyboard listener (`Ctrl/Meta+K`);
- current responsive surface from the coordinator context;
- close on route change and surface change;
- `restoreFocus={false}` when the close reason is `superseded`.

Render:

```tsx
surface === "drawer"
  ? <Drawer title="Explorer Reims" initialFocusRef={inputRef} restoreFocus={...}>...</Drawer>
  : <Dialog title="Explorer Reims" initialFocusRef={inputRef} restoreFocus={...}>...</Dialog>
```

- [ ] **Step 7: Implement connected and visitor panel states**

Connected:

- input and `Rechercher`;
- button disabled unless `isSearchQueryReady(query)`;
- missing city → `SearchCityRequired`;
- error city → `SearchCityError` + retry;
- submit closes with navigation and calls `router.push(path)`.

Visitor:

- same input;
- `Se connecter` uses `buildExplorerLoginHref`, including an empty or partial draft;
- `Créer un compte` uses `/register`;
- no search API call.

- [ ] **Step 8: Replace all `/search` chrome links with the shared trigger**

Do not alter the four main destinations. Preserve:

- compact mobile trigger;
- medium rail trigger;
- desktop text trigger;
- accessible name `Explorer Reims`;
- visible `<kbd>` desktop shortcut help.

- [ ] **Step 9: Run targeted tests and typecheck**

```powershell
pnpm --filter web test -- explorer-contract.test.ts web-layout-config.test.ts
pnpm --filter web typecheck
```

Expected: pass with no direct chrome `<Link href="/search">` remaining for Explorer triggers.

---

### Task 5: Rebuild Menu Yunicity on responsive primitives

**Files:**
- Create: `frontend/apps/web/lib/layout/yunicity-menu-contract.ts`
- Create: `frontend/apps/web/lib/layout/yunicity-menu-contract.test.ts`
- Create: `frontend/apps/web/components/layout/citizen-yunicity-menu-content.tsx`
- Modify: `frontend/apps/web/components/layout/citizen-yunicity-menu.tsx`
- Modify: `frontend/apps/web/lib/layout/web-layout-config.ts`
- Modify: `frontend/apps/web/lib/layout/web-layout-config.test.ts`
- Modify: `frontend/apps/web/components/layout/index.ts`

**Interfaces:**

```ts
export function buildYunicityMenuGroups(input: {
  isAuthenticated: boolean;
}): YunicityMenuGroup[];
```

- [ ] **Step 1: Write failing menu contract tests**

Authenticated labels must equal:

```ts
[
  "Quartiers", "Tribus", "Lieux",
  "Passport", "Notifications",
  "Discussions",
  "Profil", "Paramètres", "Se déconnecter",
]
```

Visitor labels must equal:

```ts
[
  "Quartiers", "Tribus", "Lieux",
  "Se connecter", "Créer un compte",
]
```

Assert no label contains:

```ts
["Offres et partenaires", "Enregistrés", "Mes publications", "Aide et support"]
```

- [ ] **Step 2: Run RED**

```powershell
pnpm --filter web test -- yunicity-menu-contract.test.ts
```

- [ ] **Step 3: Implement the single menu data source**

Each item includes stable ID, icon, kind, href, access and active matching. Public discovery routes are exactly:

```ts
"/neighborhoods"
"/tribes"
"/places"
```

- [ ] **Step 4: Implement semantic shared content**

Render:

```tsx
<nav aria-label="Menu Yunicity">
  {/* headings, links and logout button */}
</nav>
```

Do not use `role="menu"` or `role="menuitem"`. Add `aria-current="page"` through the existing active matcher.

- [ ] **Step 5: Rewrite the responsive wrapper**

Derive `open = activeSurface === "menu"`. At any render, mount at most one branch:

```tsx
if (surface === "drawer") return <Drawer restoreFocus={...} ... />;
if (surface === "sheet") return <Sheet side="right" restoreFocus={...} ... />;
return <Popover placement={placementForVariant} ... />;
```

On surface change from the coordinator:

- close old surface;
- release with superseded semantics when replaced by Explorer/Create;
- update surface from context;
- remain closed after a pure breakpoint change.

For Popover links, call:

```ts
close("navigation");
router.push(item.href);
```

For logout, close as navigation, await/use existing `logout()`, then `router.push("/login")`.

- [ ] **Step 6: Preserve labels and trigger hit areas**

- ≤1279 visible text: `Menu` (`xl:hidden` / short label);
- ≥1280 visible text: `Menu Yunicity`;
- all widths `aria-label="Menu Yunicity"`;
- minimum 44 px target;
- no duplicated hidden interactive trigger for the active variant.

- [ ] **Step 7: Run tests and typecheck**

```powershell
pnpm --filter web test -- yunicity-menu-contract.test.ts navigation-surfaces.test.ts web-layout-config.test.ts
pnpm --filter web typecheck
```

---

### Task 6: Migrate Create Hub to `Dialog`

**Files:**
- Create: `frontend/apps/web/components/create-hub/create-hub-dialog.tsx`
- Modify: `frontend/apps/web/components/create-hub/create-hub-provider.tsx`
- Modify: `frontend/apps/web/components/create-hub/create-hub-trigger-button.tsx`
- Modify: `frontend/apps/web/components/create-hub/create-hub-action-row.tsx`
- Modify: `frontend/apps/web/hooks/use-create-hub-partner-access.ts`
- Modify: `frontend/apps/web/lib/create-hub/create-hub-actions.ts`
- Create: `frontend/apps/web/lib/create-hub/create-hub-actions.test.ts`
- Modify: `frontend/apps/web/components/create-hub/README.md`
- Delete: `frontend/apps/web/components/create-hub/create-hub-sheet.tsx`
- Delete: `frontend/apps/web/components/create-hub/create-hub-overlay-portal.tsx`
- Delete: `frontend/apps/web/components/create-hub/create-hub-fab.tsx`
- Delete: `frontend/apps/web/components/create-hub/create-hub-portal.tsx`

**Interfaces:**

```ts
export type PartnerAccessStatus = "idle" | "loading" | "allowed" | "denied";

export function buildCreateHubActions(input: {
  isAuthenticated: boolean;
  partnerAccessStatus: PartnerAccessStatus;
}): CreateHubAction[];
```

- [ ] **Step 1: Write failing action-contract tests**

For authenticated + denied, assert exactly:

```ts
[
  "/feed/new",
  "/stories/new",
  "/videos/new",
  "/tribes/create",
  "/organizations/request",
]
```

For `allowed`, append `PARTNER_PORTAL_BASE`.

For `idle`, `loading`, `denied` and request error, partner action is absent.

Assert no action has `kind: "soon"` and no label contains `Souvenir`.

- [ ] **Step 2: Run RED**

```powershell
pnpm --filter web test -- create-hub-actions.test.ts
```

- [ ] **Step 3: Make partner access deterministic**

Refactor the hook to:

```ts
export function useCreateHubPartnerAccess(): {
  status: PartnerAccessStatus;
};
```

State transitions:

- unauthenticated → `idle`;
- authenticated request starts → `loading`;
- `filterPartnerPortalOrganizations(items).length > 0` → `allowed`;
- empty result or error → `denied`;
- stale/cancelled request cannot update state.

Do not import `member_role`, `member_status` or `verification_status` into Create Hub files.

- [ ] **Step 4: Implement visitor-visible trigger and Dialog**

Provider remains mounted after auth loading. Derive `open = activeSurface === "create"`. Render the trigger for both auth states.

Connected Dialog:

- real action list;
- close before navigation with reason `navigation`;
- `restoreFocus={false}` when superseded;
- partner row only on `allowed`.

Visitor Dialog:

- explanation;
- login URL from validated current internal path using existing helpers;
- `/register` secondary CTA.

- [ ] **Step 5: Remove ad hoc modal logic**

Delete local:

- portal creation;
- Escape listener;
- body overflow mutation;
- backdrop handler;
- manual initial focus.

All are inherited from `Dialog`.

- [ ] **Step 6: Remove the duplicate mobile FAB and `soon` UI**

The bottom-nav center trigger remains. Remove disabled action support from the row component and update README to the six canonical actions.

- [ ] **Step 7: Run targeted tests and typecheck**

```powershell
pnpm --filter web test -- create-hub-actions.test.ts create-hub-routes.test.ts
pnpm --filter @yunicity/utils test -- partner-portal.test.ts
pnpm --filter web typecheck
```

---

### Task 7: Add Playwright QA proof

**Files:**
- Create: `frontend/apps/web/e2e/functional/10-navigation-functions.spec.ts`
- Modify: `frontend/apps/web/e2e/functional/08-navbar-v3.spec.ts`
- Modify: `frontend/apps/web/e2e/functional/09-page-landmarks.spec.ts` only if shared readiness is reused

**Interfaces:**
- Reuse `gotoCold`, `waitForCitizenRouteReady`, `readLandmarkState`, `expectExactlyOneMain`.
- Reuse real `citizenA`, `authedPage`, cookies and QA API fixtures.
- Anonymous pages use a new browser page with no storage state.

- [ ] **Step 1: Write viewport helpers without sleeps**

Use acceptance viewports:

```ts
const ACCEPTANCE_VIEWPORTS = [
  { width: 390, height: 844, explorer: "drawer", menu: "drawer" },
  { width: 900, height: 900, explorer: "dialog", menu: "sheet" },
  { width: 1366, height: 900, explorer: "dialog", menu: "popover" },
] as const;
```

And technical transition widths:

```ts
const TECHNICAL_TRANSITIONS = [
  { from: 639, to: 640 },
  { from: 1279, to: 1280 },
  { from: 1280, to: 1279 },
] as const;
```

Wait on URL, session loader disappearance, visible chrome and authoritative content only.

- [ ] **Step 2: Add visitor discovery classification tests**

For `/neighborhoods`, `/tribes`, `/places`:

- navigate with no cookie;
- assert final URL remains the route, not `/login`;
- assert authoritative public content;
- assert no session-private controls or data;
- classify test failure as design blocker, not by weakening assertion.

- [ ] **Step 3: Add Explorer scenarios**

At all viewports:

- trigger visible;
- expected primitive marker;
- input focused;
- empty connected submit disabled;
- one-character readiness matches `isSearchQueryReady`;
- valid query navigates to `/search?q=...&city=Reims` for seeded user;
- Escape closes and restores trigger;
- no duplicate overlay.

Visitor:

- empty input login `next` decodes to `/search`;
- typed input login `next` preserves `/search?q=...`;
- next is a relative internal path;
- no request to `/api/v1/search` before auth.

Desktop:

- Ctrl+K or Meta+K opens;
- shortcut from a regular input does not open.

Missing city / network error:

- create/use a real QA actor with city cleared through the existing profile API → `missing` + `/profile/me/edit`;
- force an invalid/unreachable profile response (or abort) → `error` + Réessayer, never the incomplete-profile copy;
- restore city through the existing profile API before ending the test.

- [ ] **Step 4: Add Menu scenarios**

At 390/900/1366:

- labels exact (`Menu` vs `Menu Yunicity` via xl=1280);
- expected Drawer/Sheet/Popover only;
- connected groups and exact entries;
- every rendered link reaches its exact non-404 route;
- active link has `aria-current`.

Visitor:

- Quartiers, Tribus, Lieux direct;
- login/register entries;
- no personal groups.

Popover close reasons:

- Escape restores trigger;
- outside click leaves focus on clicked button;
- Tab and Shift+Tab exits do not restore trigger;
- route navigation does not restore old trigger;
- replacement by Explorer uses `superseded` and does not restore.

- [ ] **Step 5: Add breakpoint transition scenarios**

For each technical transition in `TECHNICAL_TRANSITIONS`, open Menu first, resize, then assert:

- zero open Menu surfaces;
- zero old portal roots;
- no body scroll lock;
- no residual `inert` or `aria-hidden`;
- reopen and assert exactly the new surface for the destination width.

Also keep acceptance proofs at 390/900/1366.

- [ ] **Step 6: Add Create scenarios**

At all viewports:

- CTA visible connected and visitor;
- one Dialog;
- connected exact five citizen actions;
- no `soon` or Souvenir;
- each action reaches exact route;
- regular citizen never sees partner action, including during load;
- visitor sees login/register;
- Escape, focus trap, scroll lock and inert.

Also prove exclusivity:

- Menu open then Ctrl/Meta+K → only Explorer portal;
- Explorer open then Create → only Create portal;
- no final focus on the superseded trigger;
- no residual lock/`inert`.

Partner positive behavior is covered by:

- `partner-portal.test.ts` for the existing business predicate;
- `create-hub-actions.test.ts` for `allowed` rendering;
- Playwright negative fail-closed proof for the real standard citizen.

Do not invent or elevate a QA partner role when no seeded partner actor exists.

- [ ] **Step 7: Add T2/C3.0 non-regression in the same final state**

Assert:

- four destinations;
- one main;
- one visible main nav;
- no double bottom nav;
- no horizontal overflow;
- video Drawer opens and closes.

- [ ] **Step 8: Run targeted Playwright**

After Task 8 QA setup:

```powershell
pnpm exec playwright test e2e/functional/10-navigation-functions.spec.ts --project=functional-mobile
pnpm exec playwright test e2e/functional/08-navbar-v3.spec.ts e2e/functional/09-page-landmarks.spec.ts --project=functional-mobile
```

Expected: all pass with retries reported as zero.

---

### Task 7b: Capture visual proof outside Git

**Files:**
- Temporary local scripts/artifacts only — **never commit**.

- [ ] **Step 1: Produce authenticated contact sheets**

Capture Explorer, Menu and Créer ouverts at 390, 900 and 1366 (nine frames), assembled as three contact sheets or one global board.

- [ ] **Step 2: Produce visitor variants**

At least Explorer, Menu and Créer as visitor.

- [ ] **Step 3: Manual visual checklist**

Verify:

- Navbar V3 fidelity;
- no clipped overlay;
- no double surface;
- no overflow;
- visible CTAs;
- readability;
- visible focus;
- backdrop only on modal surfaces;
- no backdrop on desktop Popover.

- [ ] **Step 4: Keep artifacts out of the repository**

Store under a local ignored path or outside the worktree. Confirm `git status` shows no screenshot/script artifact tracked.

---

### Task 8: Execute final gates, snapshots and cleanup

**Files:**
- No production changes.
- Evidence collected for the final report.

- [ ] **Step 1: Git and diff preflight**

From worktree root:

```powershell
git status --short --branch
git diff --check
git diff --name-only 6543d526e3acb4ae06e94564d4633ab8447333f5 -- backend
git diff --name-only 6543d526e3acb4ae06e94564d4633ab8447333f5 -- frontend/pnpm-lock.yaml
```

Expected:

- only T3 frontend/docs files;
- `diff --check` empty;
- backend output empty;
- lockfile output empty.

- [ ] **Step 2: Capture dev snapshot before**

First inspect:

```powershell
docker ps --format "{{.Names}}|{{.Image}}|{{.Ports}}"
```

If `yunicity-postgres-dev` is running:

```powershell
docker exec yunicity-postgres-dev sh -lc "pg_dump -U yunicity -d yunicity_dev --format=plain --no-owner --no-privileges | sha256sum"
```

If absent, record `DEV_DB_NOT_RUNNING` and do not start it.

- [ ] **Step 3: Create a fresh guarded QA baseline**

From worktree root:

```powershell
docker compose -p yunicity-qa -f docker-compose.qa.yml down -v
docker compose -p yunicity-qa -f docker-compose.qa.yml up -d --build
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher reset
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa alembic upgrade head
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher seed
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher verify
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher reset-rate-limits
```

Expected: guard, migration, seed, verify and rate-limit reset pass only against `yunicity_qa`.

- [ ] **Step 4: Run targeted unit tests**

From `frontend`:

```powershell
pnpm --filter @yunicity/ui test
pnpm --filter web test -- explorer-contract.test.ts navigation-surfaces.test.ts yunicity-menu-contract.test.ts create-hub-actions.test.ts web-layout-config.test.ts create-hub-routes.test.ts
pnpm --filter @yunicity/utils test -- partner-portal.test.ts auth-return-path.test.ts
```

- [ ] **Step 5: Run complete frontend gates**

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected:

- test complete green;
- typecheck 6/6;
- lint 6/6;
- build 6/6.

No `pnpm install` or OSV run is required because package manifests and lockfile remain unchanged.

- [ ] **Step 6: Run targeted and full Playwright**

From `frontend/apps/web`:

```powershell
pnpm exec playwright test e2e/functional/10-navigation-functions.spec.ts --project=functional-mobile
pnpm exec playwright test e2e/functional/08-navbar-v3.spec.ts e2e/functional/09-page-landmarks.spec.ts --project=functional-mobile
pnpm exec playwright test
```

If the configured webServer fails to spawn but a manually started `pnpm dev` succeeds, record the infrastructure workaround exactly, start one server only, rerun on the unchanged worktree state, then terminate that server.

- [ ] **Step 7: Capture dev snapshot after**

Repeat the exact command from Step 2. Expected:

- same SHA-256 if dev DB was running;
- `DEV_DB_NOT_RUNNING` both times otherwise.

- [ ] **Step 8: Tear down QA and prove cleanup**

```powershell
docker compose -p yunicity-qa -f docker-compose.qa.yml down -v
docker compose -p yunicity-qa -f docker-compose.qa.yml ps
```

Expected: no QA container or volume remains.

- [ ] **Step 9: Final Git proof**

```powershell
git diff --check
git diff --name-only 6543d526e3acb4ae06e94564d4633ab8447333f5 -- backend
git status --short --branch
```

Expected: no backend path, no generated Next file, no test artifact tracked, no commit.

- [ ] **Step 10: Produce the mandatory report**

Report:

1. Git state;
2. route classifications;
3. Dialog and Popover APIs;
4. Explorer connected/visitor/city behavior;
5. Menu groups and deferred entries;
6. Create actions and partner authority;
7. focus and breakpoint proofs;
8. results at 390/900/1366;
9. targeted and complete test counts;
10. typecheck/lint/build;
11. lockfile/OSV status;
12. dev snapshots;
13. QA cleanup;
14. modified files;
15. risks/debt;
16. evidence-based verdict `READY`, `PARTIAL` or `BLOCKED`.

---

## Self-Review

- Spec coverage: CTO documentary corrections map to Tasks 1–3 (DialogProps, Popover/`superseded`, breakpoints T2, atomic coordinator), Task 4 (city missing/error), Task 5/7 (transitions 639↔640 / 1279↔1280), Task 7b (visual proof).
- Breakpoints: technical authority is `639.98` / `1280` from T2 chrome; 390/900/1366 remain acceptance viewports only.
- Query consistency: the plan imports `isSearchQueryReady`; it does not invent a threshold.
- Auth security: all `next` URLs reuse `resolveAuthReturnPath` and `buildLoginUrlWithNext`.
- City behavior: no artificial Reims fallback; `missing` ≠ `error`.
- Partner authorization: only `filterPartnerPortalOrganizations` decides access.
- Popover focus: every close reason including `superseded` has an isolated unit/DOM/E2E proof.
- Surface exclusivity: single `activeSurface`; no independent open booleans; modal `restoreFocus={false}` on superseded.
- Responsive listeners: one coordinator-owned `matchMedia` set; consumers are context-only.
- Layout providers: existing `AuthProvider` / `CreateHubProvider` order preserved.
- Public API: `DialogProps` is explicit; export leak test required.
- Visual proof: Task 7b keeps screenshots out of Git.
- Scope: frontend/docs only; no backend, Map, dependency or lockfile.
- Git: no commit step appears because the CTO explicitly forbids commits in this pass.

---

## Execution Gate

Plan corrected. Do not execute any BUILD task until the CTO gives an explicit GO for implementation.
