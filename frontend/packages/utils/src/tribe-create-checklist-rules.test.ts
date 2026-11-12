/**
 * TRIBE-CREATE-CHECKLIST-ACCESS-01 — chaque coche de la checklist « Avant de publier »
 * dépend de sa règle réelle, et le comptage des erreurs bloquantes partage ces règles.
 *
 * Règle R1 (décision de Kyria, 12/11) :
 *  - « Identité complète » : nom, catégorie, description, ville valides — obligatoire ;
 *  - « Accès et adhésion » : visibilité valide (`public` ou `private_invite`) — obligatoire ;
 *  - « Une charte claire » : charte acceptée — obligatoire ;
 *  - « Avatar et bannière » : bannière renseignée — facultatif, jamais bloquant.
 *
 * Le brouillon est restauré depuis `sessionStorage` par `JSON.parse` (input non fiable) :
 * `restored()` reproduit ce chemin pour obtenir une visibilité ou une charte invalides.
 */
import { describe, expect, it } from "vitest";

import {
  TRIBE_CREATE_CHECKLIST_RULES,
  tribeCreateBlockingErrorCount,
  tribeCreateChecklistProgress,
  tribeCreateChecklistState,
  type TribeCreateChecklistKey,
} from "./tribe-create-desktop-presenter";
import { TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT } from "./tribe-create-desktop-labels";
import { createEmptyTribeCreateDraft, validateTribeCreateStep, type TribeCreateDraft } from "./tribe-create-portal";
import { TRIBE_CREATE_VALIDATION_CHARTER, TRIBE_CREATE_VALIDATION_NAME } from "./tribe-create-portal-labels";

const IDENTITY: Partial<TribeCreateDraft> = {
  name: "Photo Reims",
  category: "photography",
  description: "Balades photo dans Reims.",
};
const COVER = "https://example.com/cover.jpg";

/** Brouillon tel que relu depuis `sessionStorage` (même chemin que `readStoredDraft`). */
function restored(overrides: Record<string, unknown>): TribeCreateDraft {
  const parsed = JSON.parse(JSON.stringify(overrides)) as Partial<TribeCreateDraft>;
  return { ...createEmptyTribeCreateDraft("Reims"), ...parsed };
}

/** Ce que vérifie `submit` avant d'appeler l'API (`use-tribe-create-context`). */
function canPublish(draft: TribeCreateDraft): boolean {
  return validateTribeCreateStep("identity", draft).valid && validateTribeCreateStep("access", draft).valid;
}

const KEYS: readonly TribeCreateChecklistKey[] = ["identity", "access", "charter", "visuals"];

describe("règles de la checklist", () => {
  it("distingue obligatoires et facultatifs", () => {
    expect(KEYS.map((key) => [key, TRIBE_CREATE_CHECKLIST_RULES[key].required])).toEqual([
      ["identity", true],
      ["access", true],
      ["charter", true],
      ["visuals", false],
    ]);
  });

  it("chaque coche de l'état est exactement sa règle", () => {
    const draft = restored({ ...IDENTITY, charterAccepted: true });
    const state = tribeCreateChecklistState(draft);
    for (const key of KEYS) expect(state[key]).toBe(TRIBE_CREATE_CHECKLIST_RULES[key].isMet(draft));
  });
});

describe.each([
  {
    nom: "brouillon vide",
    draft: restored({}),
    state: { identity: false, access: true, charter: false, visuals: false },
    errors: 2,
  },
  {
    nom: "identité seule valide",
    draft: restored({ ...IDENTITY }),
    state: { identity: true, access: true, charter: false, visuals: false },
    errors: 1,
  },
  {
    nom: "charte seule acceptée",
    draft: restored({ charterAccepted: true }),
    state: { identity: false, access: true, charter: true, visuals: false },
    errors: 1,
  },
  {
    nom: "formulaire complet sans bannière",
    draft: restored({ ...IDENTITY, charterAccepted: true }),
    state: { identity: true, access: true, charter: true, visuals: false },
    errors: 0,
  },
  {
    nom: "formulaire complet avec bannière, tribu privée",
    draft: restored({ ...IDENTITY, charterAccepted: true, coverImageUrl: COVER, visibility: "private_invite" }),
    state: { identity: true, access: true, charter: true, visuals: true },
    errors: 0,
  },
  {
    nom: "formulaire complet, visibilité invalide",
    draft: restored({ ...IDENTITY, charterAccepted: true, coverImageUrl: COVER, visibility: "private" }),
    state: { identity: true, access: false, charter: true, visuals: true },
    errors: 1,
  },
  {
    nom: "brouillon vide, visibilité absente",
    draft: restored({ visibility: null }),
    state: { identity: false, access: false, charter: false, visuals: false },
    errors: 3,
  },
  {
    nom: "complet, charte « acceptée » sous forme de texte",
    draft: restored({ ...IDENTITY, charterAccepted: "true" }),
    state: { identity: true, access: true, charter: false, visuals: false },
    errors: 1,
  },
])("$nom", ({ draft, state, errors }) => {
  it("coches", () => {
    expect(tribeCreateChecklistState(draft)).toEqual(state);
  });

  it("erreurs bloquantes", () => {
    expect(tribeCreateBlockingErrorCount(draft)).toBe(errors);
  });

  it("publication possible ssi aucune erreur bloquante", () => {
    expect(canPublish(draft)).toBe(errors === 0);
  });
});

describe("invariants sur toutes les combinaisons", () => {
  const identities = [{}, IDENTITY];
  const visibilities: unknown[] = ["public", "private_invite", "private", "", null, 1];
  const charters: unknown[] = [true, false, "true", 1, null];
  const covers = ["", COVER];
  const drafts = identities.flatMap((identity) =>
    visibilities.flatMap((visibility) =>
      charters.flatMap((charterAccepted) =>
        covers.map((coverImageUrl) => restored({ ...identity, visibility, charterAccepted, coverImageUrl })),
      ),
    ),
  );

  it("couvre toutes les combinaisons", () => {
    expect(drafts).toHaveLength(2 * 6 * 5 * 2);
  });

  it.each(drafts.map((draft, index) => [index, draft] as const))("combinaison %i", (_index, draft) => {
    const state = tribeCreateChecklistState(draft);
    const errors = tribeCreateBlockingErrorCount(draft);
    const requiredUnmet = KEYS.filter((key) => TRIBE_CREATE_CHECKLIST_RULES[key].required && !state[key]);

    // Le comptage = les éléments obligatoires non cochés, ni plus ni moins.
    expect(errors).toBe(requiredUnmet.length);
    // Aucune coche n'annonce comme fait ce que la publication refuse.
    expect(canPublish(draft)).toBe(errors === 0);
    // Une charte non acceptée bloque toujours.
    if (draft.charterAccepted !== true) {
      expect(state.charter).toBe(false);
      expect(errors).toBeGreaterThan(0);
      expect(canPublish(draft)).toBe(false);
    }
    // La bannière, facultative, ne change jamais le comptage.
    expect(tribeCreateBlockingErrorCount({ ...draft, coverImageUrl: draft.coverImageUrl ? "" : COVER })).toBe(errors);
  });
});

describe("messages des étapes (libellés existants)", () => {
  it("visibilité invalide : signalée à l'étape Identité, où se trouve le choix « Communauté »", () => {
    expect(validateTribeCreateStep("identity", restored({ ...IDENTITY, visibility: "private" }))).toEqual({
      valid: false,
      message: TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT,
    });
  });

  it("champs d'identité incomplets : leur message passe avant la visibilité", () => {
    expect(validateTribeCreateStep("identity", restored({ visibility: "private" })).message).toBe(
      TRIBE_CREATE_VALIDATION_NAME,
    );
  });

  it("étape Accès : seule la charte, message inchangé", () => {
    expect(validateTribeCreateStep("access", restored({}))).toEqual({
      valid: false,
      message: TRIBE_CREATE_VALIDATION_CHARTER,
    });
    expect(validateTribeCreateStep("access", restored({ visibility: "private", charterAccepted: true })).valid).toBe(true);
  });
});

describe("progression mobile", () => {
  it("brouillon vide : seule la visibilité par défaut compte", () => {
    expect(tribeCreateChecklistProgress(restored({}))).toEqual({ completed: 1, total: 5 });
  });

  it("visibilité invalide : rien n'est acquis", () => {
    expect(tribeCreateChecklistProgress(restored({ visibility: "private" }))).toEqual({ completed: 0, total: 5 });
  });

  it("formulaire complet avec bannière : 5 sur 5", () => {
    const draft = restored({ ...IDENTITY, charterAccepted: true, coverImageUrl: COVER });
    expect(tribeCreateChecklistProgress(draft)).toEqual({ completed: 5, total: 5 });
  });
});
