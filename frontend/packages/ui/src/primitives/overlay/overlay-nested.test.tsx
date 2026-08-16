import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "./drawer";
import { OVERLAY_ROOT_ATTRIBUTE, overlayStackSize } from "./overlay-stack";
import { Sheet } from "./sheet";

/**
 * Pile réelle : le Drawer B est déclaré DANS le contenu du Sheet A (cas d'usage courant :
 * « depuis ce panneau, ouvrir un second panneau »). Chacun porte son propre portail.
 */
function NestedApp({ onAChange, onBChange }: { onAChange?: (open: boolean) => void; onBChange?: (open: boolean) => void }) {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpenA(true);
        }}
      >
        Ouvrir A
      </button>

      <Sheet
        open={openA}
        onOpenChange={(next) => {
          setOpenA(next);
          onAChange?.(next);
        }}
        title="Panneau A"
      >
        <button
          type="button"
          onClick={() => {
            setOpenB(true);
          }}
        >
          Ouvrir B
        </button>
        <Drawer
          open={openB}
          onOpenChange={(next) => {
            setOpenB(next);
            onBChange?.(next);
          }}
          title="Panneau B"
        >
          <button type="button">Action B</button>
        </Drawer>
      </Sheet>
    </div>
  );
}

function overlayRoots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[${OVERLAY_ROOT_ATTRIBUTE}]`));
}

function appContainer(): HTMLElement {
  const element = Array.from(document.body.children).find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && !child.hasAttribute(OVERLAY_ROOT_ATTRIBUTE),
  );
  if (!element) throw new Error("Conteneur applicatif introuvable");
  return element;
}

function isNeutralized(element: HTMLElement): boolean {
  return element.getAttribute("aria-hidden") === "true" && element.getAttribute("inert") === "";
}

describe("Overlays imbriqués — scénario normal", () => {
  it("déroule ouverture A → ouverture B → fermeture B → fermeture A", async () => {
    const user = userEvent.setup();
    const onAChange = vi.fn();
    const onBChange = vi.fn();
    render(<NestedApp onAChange={onAChange} onBChange={onBChange} />);

    const app = appContainer();
    expect(isNeutralized(app)).toBe(false);

    // 1-2. Ouverture de A : l'application devient inerte.
    await user.click(screen.getByRole("button", { name: "Ouvrir A" }));
    expect(screen.getByRole("dialog", { name: "Panneau A" })).not.toBeNull();
    expect(isNeutralized(app)).toBe(true);
    expect(overlayStackSize()).toBe(1);

    // 3-5. Depuis A, ouverture de B : A devient inerte, B est le seul dialogue accessible.
    await user.click(screen.getByRole("button", { name: "Ouvrir B" }));
    const [rootA, rootB] = overlayRoots();
    expect(isNeutralized(rootA as HTMLElement)).toBe(true);
    expect(isNeutralized(rootB as HTMLElement)).toBe(false);
    expect(screen.getAllByRole("dialog").length).toBe(1);
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Action B" })).not.toBeNull();
    expect(overlayStackSize()).toBe(2);

    // 6. Le piège de focus reste dans B.
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));
    for (let index = 0; index < 5; index += 1) {
      await user.tab();
      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    }
    await user.tab({ shift: true });
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);

    // 7-10. Escape ne ferme QUE B ; le focus revient au déclencheur situé dans A ; A redevient
    // accessible ; l'application reste inerte.
    await user.keyboard("{Escape}");
    expect(onBChange).toHaveBeenCalledTimes(1);
    expect(onBChange).toHaveBeenCalledWith(false);
    expect(onAChange).not.toHaveBeenCalled();

    expect(screen.getAllByRole("dialog").length).toBe(1);
    expect(screen.getByRole("dialog", { name: "Panneau A" })).not.toBeNull();
    expect(isNeutralized(overlayRoots()[0] as HTMLElement)).toBe(false);
    expect(isNeutralized(app)).toBe(true);
    expect(overlayStackSize()).toBe(1);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ouvrir B" }));
    });

    // 11-13. Escape ferme A ; le focus revient au déclencheur applicatif ; tout est restauré.
    await user.keyboard("{Escape}");
    expect(onAChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isNeutralized(app)).toBe(false);
    expect(app.getAttribute("aria-hidden")).toBeNull();
    expect(app.getAttribute("inert")).toBeNull();
    expect(overlayStackSize()).toBe(0);
    expect(document.body.style.overflow).toBe("");
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ouvrir A" }));
    });
  });
});

describe("Overlays imbriqués — fermeture dans le désordre", () => {
  function OutOfOrder({ openA, openB }: { openA: boolean; openB: boolean }) {
    return (
      <div>
        <button type="button">Déclencheur applicatif</button>
        <Sheet open={openA} title="Panneau A">
          <button type="button">Action A</button>
        </Sheet>
        <Drawer open={openB} title="Panneau B">
          <button type="button">Action B</button>
        </Drawer>
      </div>
    );
  }

  it("garde B actif quand A se ferme en dessous, sans lui voler le focus", async () => {
    const { rerender } = render(<OutOfOrder openA={false} openB={false} />);
    const app = appContainer();

    // Focus applicatif RÉEL avant l'ouverture : sans lui, `previouslyFocused` vaudrait `body`,
    // que jsdom refuse de focaliser — le test passerait alors même sans la garde topmost.
    const appTrigger = screen.getByRole("button", { name: "Déclencheur applicatif" });
    appTrigger.focus();
    expect(document.activeElement).toBe(appTrigger);

    rerender(<OutOfOrder openA openB={false} />);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Panneau A" }).contains(document.activeElement)).toBe(true),
    );

    rerender(<OutOfOrder openA openB />);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Panneau B" }).contains(document.activeElement)).toBe(true),
    );

    const focusedInB = document.activeElement;
    expect(overlayStackSize()).toBe(2);

    // A se ferme programmatiquement alors que B reste ouvert.
    rerender(<OutOfOrder openA={false} openB />);

    expect(overlayStackSize()).toBe(1);
    expect(screen.getAllByRole("dialog").length).toBe(1);
    expect(screen.getByRole("dialog", { name: "Panneau B" })).not.toBeNull();
    // Aucun focus n'a été envoyé vers A : le focus est resté exactement où il était dans B.
    expect(document.activeElement).toBe(focusedInB);
    expect(isNeutralized(app)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // Fermeture de B : application et focus entièrement restaurés.
    rerender(<OutOfOrder openA={false} openB={false} />);

    expect(overlayStackSize()).toBe(0);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isNeutralized(app)).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Overlays imbriqués — topmost seul actif", () => {
  it("seul le sommet réagit à Escape", async () => {
    const user = userEvent.setup();
    const onA = vi.fn();
    const onB = vi.fn();

    function TwoOverlays() {
      const [openA, setOpenA] = useState(true);
      const [openB, setOpenB] = useState(true);
      return (
        <div>
          <Sheet
            open={openA}
            onOpenChange={(next) => {
              setOpenA(next);
              onA(next);
            }}
            title="Panneau A"
          >
            <button type="button">Action A</button>
          </Sheet>
          <Drawer
            open={openB}
            onOpenChange={(next) => {
              setOpenB(next);
              onB(next);
            }}
            title="Panneau B"
          >
            <button type="button">Action B</button>
          </Drawer>
        </div>
      );
    }

    render(<TwoOverlays />);
    await waitFor(() => expect(overlayStackSize()).toBe(2));

    await user.keyboard("{Escape}");

    // Une seule fermeture, celle du sommet — et une seule émission.
    expect(onB).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledWith(false);
    expect(onA).not.toHaveBeenCalled();
    expect(overlayStackSize()).toBe(1);

    await user.keyboard("{Escape}");
    expect(onA).toHaveBeenCalledTimes(1);
    expect(overlayStackSize()).toBe(0);
  });

  it("le verrou de scroll tient jusqu'à la fermeture du dernier overlay", () => {
    function TwoOverlays({ openB }: { openB: boolean }) {
      return (
        <div>
          <Sheet open title="Panneau A">
            <button type="button">Action A</button>
          </Sheet>
          <Drawer open={openB} title="Panneau B">
            <button type="button">Action B</button>
          </Drawer>
        </div>
      );
    }

    const { rerender, unmount } = render(<TwoOverlays openB />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TwoOverlays openB={false} />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(overlayStackSize()).toBe(1);

    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(overlayStackSize()).toBe(0);
    expect(document.querySelectorAll(`[${OVERLAY_ROOT_ATTRIBUTE}]`).length).toBe(0);
  });
});
