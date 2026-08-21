import { render, waitFor } from "@testing-library/react";
import { useRef, useState, type RefObject } from "react";
import { describe, expect, it } from "vitest";

import { Dialog } from "./dialog";

/**
 * Contrat de `returnFocusRef` (C3-FEED-M2.3A, verrouillé ici en M2.3B).
 *
 * Le défaut d'origine n'était visible que sur WebKit : Safari ne donne pas le
 * focus à un `<button>` au clic, donc `document.activeElement` valait `body` à
 * l'ouverture et la surface « rendait » le focus à `body` — jamais au
 * déclencheur. Faire dépendre ce contrat d'une matrice navigateur le rendrait
 * fragile et lent à vérifier : ces tests reproduisent la condition
 * `document.activeElement === document.body` **directement**, sans navigateur,
 * pour que la garantie soit indépendante du moteur.
 */

/** Surface contrôlée qui applique réellement le démontage à la fermeture. */
function ReturnFocusHarness({
  useExplicitTarget,
  detachTargetBeforeClose = false,
}: {
  useExplicitTarget: boolean;
  detachTargetBeforeClose?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [targetMounted, setTargetMounted] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {targetMounted ? (
        <button type="button" ref={triggerRef} data-testid="trigger">
          Déclencheur
        </button>
      ) : null}
      <button type="button" data-testid="ailleurs">
        Ailleurs
      </button>
      <button
        type="button"
        data-testid="fermer-externe"
        onClick={() => {
          if (detachTargetBeforeClose) setTargetMounted(false);
          setOpen(false);
        }}
      >
        Fermer
      </button>
      {open ? (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Surface"
          returnFocusRef={
            useExplicitTarget ? (triggerRef as RefObject<HTMLElement | null>) : undefined
          }
        >
          <button type="button">Contenu</button>
        </Dialog>
      ) : null}
    </>
  );
}

/** Simule fidèlement l'ouverture WebKit : plus rien n'est focalisé. */
function blurEverything(): void {
  (document.activeElement as HTMLElement | null)?.blur();
  expect(document.activeElement).toBe(document.body);
}

describe("OverlayPanel — returnFocusRef", () => {
  it("rend le focus à la cible explicite même si rien n'était focalisé à l'ouverture", async () => {
    const view = render(<ReturnFocusHarness useExplicitTarget />);
    blurEverything();

    view.getByTestId("fermer-externe").click();

    await waitFor(() => {
      expect(document.activeElement).toBe(view.getByTestId("trigger"));
    });
  });

  it("sans la prop, conserve le comportement historique et ne vole pas le focus", async () => {
    const view = render(<ReturnFocusHarness useExplicitTarget={false} />);
    blurEverything();

    view.getByTestId("fermer-externe").click();

    // Comportement d'origine : la surface ne connaît aucune cible explicite et
    // l'élément mémorisé est `body` — le focus ne saute donc sur personne.
    await waitFor(() => {
      expect(document.activeElement).not.toBe(view.getByTestId("trigger"));
    });
    expect(document.activeElement).toBe(document.body);
  });

  it("retombe sans erreur quand la cible a été démontée avant la fermeture", async () => {
    const view = render(<ReturnFocusHarness useExplicitTarget detachTargetBeforeClose />);
    blurEverything();

    expect(() => view.getByTestId("fermer-externe").click()).not.toThrow();

    await waitFor(() => {
      expect(view.queryByTestId("trigger")).toBeNull();
    });
    // Aucune cible connectée : pas de restitution, et surtout aucun crash.
    expect(document.activeElement).toBe(document.body);
  });

  it("ignore une ref jamais renseignée sans casser la fermeture", async () => {
    function NullTargetHarness() {
      const [open, setOpen] = useState(true);
      const never = useRef<HTMLElement | null>(null);
      return (
        <>
          <button type="button" data-testid="fermer-externe" onClick={() => setOpen(false)}>
            Fermer
          </button>
          {open ? (
            <Dialog open={open} onOpenChange={setOpen} title="Surface" returnFocusRef={never}>
              <button type="button">Contenu</button>
            </Dialog>
          ) : null}
        </>
      );
    }

    const view = render(<NullTargetHarness />);
    blurEverything();

    expect(() => view.getByTestId("fermer-externe").click()).not.toThrow();
    await waitFor(() => {
      expect(document.querySelector("[data-yunicity-overlay]")).toBeNull();
    });
  });

  it("ne rend le focus qu'à la fermeture, jamais tant que la surface est ouverte", async () => {
    const view = render(<ReturnFocusHarness useExplicitTarget />);

    // Tant que la surface vit, le focus reste piégé à l'intérieur : la cible de
    // retour ne doit pas se l'approprier prématurément.
    await waitFor(() => {
      const panel = document.querySelector("[data-yunicity-overlay]");
      expect(panel?.contains(document.activeElement)).toBe(true);
    });
    expect(document.activeElement).not.toBe(view.getByTestId("trigger"));
  });

  it("une surface non supérieure ne restitue pas le focus au démontage d'une surface au-dessus", async () => {
    function NestedHarness() {
      const [outerOpen, setOuterOpen] = useState(true);
      const [innerOpen, setInnerOpen] = useState(true);
      const outerTargetRef = useRef<HTMLButtonElement>(null);

      return (
        <>
          <button type="button" ref={outerTargetRef} data-testid="cible-externe">
            Cible externe
          </button>
          <button type="button" data-testid="fermer-interne" onClick={() => setInnerOpen(false)}>
            Fermer interne
          </button>
          {outerOpen ? (
            <Dialog
              open={outerOpen}
              onOpenChange={setOuterOpen}
              title="Surface externe"
              returnFocusRef={outerTargetRef as RefObject<HTMLElement | null>}
            >
              <button type="button">Contenu externe</button>
            </Dialog>
          ) : null}
          {innerOpen ? (
            <Dialog open={innerOpen} onOpenChange={setInnerOpen} title="Surface interne">
              <button type="button">Contenu interne</button>
            </Dialog>
          ) : null}
        </>
      );
    }

    const view = render(<NestedHarness />);
    blurEverything();

    view.getByTestId("fermer-interne").click();

    // La surface externe reste ouverte : sa cible de retour ne doit pas prendre
    // le focus parce qu'une autre surface s'est fermée au-dessus d'elle.
    await waitFor(() => {
      expect(document.querySelectorAll("[data-yunicity-overlay]").length).toBe(1);
    });
    expect(document.activeElement).not.toBe(view.getByTestId("cible-externe"));
  });
});
