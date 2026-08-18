import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "./drawer";
import { OVERLAY_ROOT_ATTRIBUTE } from "./overlay-stack";
import { Sheet } from "./sheet";
import { Dialog } from "./dialog";

function backdrop(): HTMLElement {
  const element = document.querySelector<HTMLElement>("[data-yunicity-overlay-backdrop]");
  if (!element) throw new Error("Backdrop introuvable");
  return element;
}

function PanelContent() {
  return (
    <>
      <button type="button">Premier</button>
      <button type="button">Second</button>
    </>
  );
}

/** Dialog contrôlé par un parent qui APPLIQUE réellement la transition. */
function ControlledDialog({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        title="Explorer"
      >
        <PanelContent />
      </Dialog>
    </>
  );
}

/** Sheet contrôlé par un parent qui APPLIQUE réellement la transition. */
function ControlledSheet({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        title="Filtres"
      >
        <PanelContent />
      </Sheet>
    </>
  );
}

describe("Overlay — structure et sémantique", () => {
  it("rend le panneau dans un portail rattaché à document.body", async () => {
    const { container } = render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    const dialog = await screen.findByRole("dialog");
    expect(container.contains(dialog)).toBe(false);

    const root = dialog.closest(`[${OVERLAY_ROOT_ATTRIBUTE}]`);
    expect(root).not.toBeNull();
    expect(root?.parentElement).toBe(document.body);
  });

  it("expose role=dialog et aria-modal", () => {
    render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("relie correctement titre et description", () => {
    render(
      <Sheet open title="Filtres" description="Affinez les résultats de la carte.">
        <PanelContent />
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    const descriptionId = dialog.getAttribute("aria-describedby");

    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId ?? "")?.textContent).toBe("Filtres");
    expect(document.getElementById(descriptionId ?? "")?.textContent).toBe(
      "Affinez les résultats de la carte.",
    );
  });

  it("n'expose pas aria-describedby sans description", () => {
    render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    expect(screen.getByRole("dialog").getAttribute("aria-describedby")).toBeNull();
  });
});

describe("Overlay — ouverture contrôlée et non contrôlée", () => {
  it("s'ouvre depuis son déclencheur en mode non contrôlé", async () => {
    const user = userEvent.setup();
    render(
      <Sheet title="Filtres" trigger={(props) => <button {...props}>Ouvrir</button>}>
        <PanelContent />
      </Sheet>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(trigger);

    expect(screen.getByRole("dialog")).not.toBeNull();
    // `hidden: true` est nécessaire : une fois l'overlay ouvert, le déclencheur est dans
    // l'arrière-plan rendu `aria-hidden`/`inert` — il a donc quitté l'arbre d'accessibilité.
    expect(
      screen.getByRole("button", { name: "Ouvrir", hidden: true }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("suit strictement la prop open en mode contrôlé", () => {
    const { rerender } = render(
      <Sheet open={false} title="Filtres">
        <PanelContent />
      </Sheet>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );
    expect(screen.getByRole("dialog")).not.toBeNull();
  });
});

describe("Overlay — focus", () => {
  it("place le focus initial dans le panneau", async () => {
    render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("boucle du dernier au premier élément avec Tab", async () => {
    const user = userEvent.setup();
    render(
      <Sheet open title="Filtres" closeLabel="Fermer les filtres">
        <PanelContent />
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last?.focus();
    await user.tab();

    expect(document.activeElement).toBe(first);
  });

  it("boucle du premier au dernier avec Shift+Tab", async () => {
    const user = userEvent.setup();
    render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();
    await user.tab({ shift: true });

    expect(document.activeElement).toBe(last);
  });

  it("ramène le focus dans le panneau s'il tente d'en sortir", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Arrière-plan</button>
        <Sheet open title="Filtres">
          <PanelContent />
        </Sheet>
      </>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Hors arbre d'accessibilité pendant l'ouverture : on force le focus pour simuler une
    // sortie du piège (extension navigateur, focus programmatique).
    screen.getByRole("button", { name: "Arrière-plan", hidden: true }).focus();
    expect(dialog.contains(document.activeElement)).toBe(false);

    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("restitue le focus au déclencheur à la fermeture", async () => {
    const user = userEvent.setup();
    render(
      <Sheet title="Filtres" trigger={(props) => <button {...props}>Ouvrir</button>}>
        <PanelContent />
      </Sheet>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ouvrir" }));
    });
  });
});

describe("Overlay — politique de fermeture", () => {
  it("Escape ferme quand dismissible", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledSheet onOpenChange={onOpenChange} />);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape ne ferme pas quand dismissible=false", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open dismissible={false} onOpenChange={onOpenChange} title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("le clic sur l'overlay ferme quand dismissible", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledSheet onOpenChange={onOpenChange} />);

    await user.click(backdrop());

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("le clic sur l'overlay ne ferme pas quand dismissible=false", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open dismissible={false} onOpenChange={onOpenChange} title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    await user.click(backdrop());

    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("le bouton Close ferme toujours, même non dismissible", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open dismissible={false} onOpenChange={onOpenChange} title="Filtres" closeLabel="Fermer les filtres">
        <PanelContent />
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Fermer les filtres" }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("n'émet onOpenChange qu'une fois par transition", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledSheet onOpenChange={onOpenChange} />);

    // Deux Escape consécutifs : une seule transition réelle, donc une seule émission.
    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    // Réouverture par le parent (hors onOpenChange), puis nouvelle fermeture : la deuxième
    // transition émet exactement une fois de plus.
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe("Overlay — verrou de scroll et nettoyage", () => {
  it("verrouille le scroll pendant l'ouverture et le restaure à la fermeture", async () => {
    const user = userEvent.setup();
    render(<ControlledSheet />);

    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    expect(document.body.style.overflow).toBe("");
  });

  it("restaure le scroll au démontage", () => {
    const { unmount } = render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("garde le verrou tant qu'un overlay imbriqué reste ouvert", () => {
    function Nested({ secondOpen }: { secondOpen: boolean }) {
      return (
        <>
          <Sheet open title="Filtres">
            <PanelContent />
          </Sheet>
          <Drawer open={secondOpen} title="Créer">
            <PanelContent />
          </Drawer>
        </>
      );
    }

    const { rerender } = render(<Nested secondOpen />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Nested secondOpen={false} />);
    expect(document.body.style.overflow).toBe("hidden"); // le premier est encore ouvert

    rerender(
      <>
        <Drawer open={false} title="Créer">
          <PanelContent />
        </Drawer>
      </>,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("retire ses écouteurs au démontage", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Sheet open onOpenChange={onOpenChange} title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    unmount();
    await user.keyboard("{Escape}");

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelectorAll(`[${OVERLAY_ROOT_ATTRIBUTE}]`).length).toBe(0);
  });
});

describe("Overlay — arrière-plan inaccessible", () => {
  it("rend les frères du portail inert et aria-hidden pendant l'ouverture", async () => {
    const { container } = render(
      <>
        <button type="button">Arrière-plan</button>
        <Sheet open title="Filtres">
          <PanelContent />
        </Sheet>
      </>,
    );

    await screen.findByRole("dialog");

    expect(container.getAttribute("aria-hidden")).toBe("true");
    expect(container.getAttribute("inert")).toBe("");
  });

  it("ne laisse actif que le portail au sommet de la pile", async () => {
    render(
      <>
        <Sheet open title="Filtres">
          <PanelContent />
        </Sheet>
        <Drawer open title="Créer">
          <PanelContent />
        </Drawer>
      </>,
    );

    await screen.findAllByRole("dialog", { hidden: true });

    const roots = Array.from(document.querySelectorAll(`[${OVERLAY_ROOT_ATTRIBUTE}]`));
    expect(roots.length).toBe(2);

    const [underlying, topmost] = roots;
    expect(underlying?.getAttribute("inert")).toBe(""); // ouvert mais inactif
    expect(underlying?.getAttribute("aria-hidden")).toBe("true");
    expect(topmost?.getAttribute("inert")).toBeNull();
    expect(topmost?.getAttribute("aria-hidden")).toBeNull();

    // Un seul dialogue reste exposé aux technologies d'assistance.
    expect(screen.getAllByRole("dialog").length).toBe(1);
  });

  it("restaure l'arrière-plan seulement quand le dernier overlay est fermé", () => {
    function Nested({ secondOpen }: { secondOpen: boolean }) {
      return (
        <>
          <Sheet open title="Filtres">
            <PanelContent />
          </Sheet>
          <Drawer open={secondOpen} title="Créer">
            <PanelContent />
          </Drawer>
        </>
      );
    }

    const { container, rerender } = render(<Nested secondOpen />);
    expect(container.getAttribute("inert")).toBe("");

    rerender(<Nested secondOpen={false} />);
    expect(container.getAttribute("inert")).toBe(""); // le premier overlay tient encore
  });

  it("restaure l'état antérieur exact de l'arrière-plan", () => {
    const { container, unmount } = render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );
    expect(container.getAttribute("aria-hidden")).toBe("true");

    unmount();

    expect(container.getAttribute("aria-hidden")).toBeNull();
    expect(container.getAttribute("inert")).toBeNull();
  });

  it("ne laisse aucun élément d'arrière-plan atteignable au clavier", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Arrière-plan</button>
        <Sheet open title="Filtres">
          <PanelContent />
        </Sheet>
      </>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    for (let index = 0; index < 6; index += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});

describe("Sheet / Drawer — variantes", () => {
  it("Sheet s'ancre à droite par défaut", () => {
    render(
      <Sheet open title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    expect(screen.getByRole("dialog").className).toContain("right-0");
  });

  it("Sheet s'ancre à gauche sur demande", () => {
    render(
      <Sheet open side="left" title="Filtres">
        <PanelContent />
      </Sheet>,
    );

    expect(screen.getByRole("dialog").className).toContain("left-0");
  });

  it("Drawer monte du bas, gère la safe-area et le reduced-motion", () => {
    render(
      <Drawer open title="Créer">
        <PanelContent />
      </Drawer>,
    );

    const className = screen.getByRole("dialog").className;
    expect(className).toContain("bottom-0");
    expect(className).toContain("pb-[max(1rem,env(safe-area-inset-bottom))]");
    expect(className).toContain("motion-reduce:transition-none");
  });

  it("l'overlay respecte aussi prefers-reduced-motion", () => {
    render(
      <Drawer open title="Créer">
        <PanelContent />
      </Drawer>,
    );

    expect(backdrop().className).toContain("motion-reduce:transition-none");
  });
});

describe("Dialog — primitive centrée", () => {
  it("expose le marqueur data-yunicity-overlay=center", () => {
    render(
      <Dialog open title="Explorer">
        <PanelContent />
      </Dialog>,
    );

    const root = screen.getByRole("dialog").closest("[data-yunicity-overlay]");
    expect(root?.getAttribute("data-yunicity-overlay")).toBe("center");
  });

  it("positionne le panneau en relative dans un conteneur flex", () => {
    render(
      <Dialog open title="Explorer">
        <PanelContent />
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("relative");
    const root = dialog.closest("[data-yunicity-overlay]");
    expect(root?.className).toContain("flex");
    expect(root?.className).toContain("items-center");
  });

  it("expose role=dialog et aria-modal", () => {
    render(
      <Dialog open title="Explorer">
        <PanelContent />
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("relie correctement titre et description", () => {
    render(
      <Dialog open title="Explorer" description="Rechercher dans Reims.">
        <PanelContent />
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    const descriptionId = dialog.getAttribute("aria-describedby");

    expect(document.getElementById(labelId ?? "")?.textContent).toBe("Explorer");
    expect(document.getElementById(descriptionId ?? "")?.textContent).toBe("Rechercher dans Reims.");
  });

  it("focalise initialFocusRef quand connecté", async () => {
    function WithExplicitFocus() {
      const inputRef = useRef<HTMLInputElement>(null);
      return (
        <Dialog open title="Explorer" initialFocusRef={inputRef}>
          <input ref={inputRef} type="search" aria-label="Recherche" />
          <button type="button">Premier</button>
        </Dialog>
      );
    }

    render(<WithExplicitFocus />);

    const input = screen.getByRole("searchbox", { name: "Recherche" });
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it("retombe sur le premier élément focalisable sans initialFocusRef", async () => {
    render(
      <Dialog open title="Explorer" closeLabel="Fermer l'explorateur">
        <PanelContent />
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    const closeButton = screen.getByRole("button", { name: "Fermer l'explorateur" });
    await waitFor(() => {
      expect(document.activeElement).toBe(closeButton);
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("restitue le focus au déclencheur à la fermeture par défaut", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Explorer" trigger={(props) => <button {...props}>Ouvrir</button>}>
        <PanelContent />
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ouvrir" }));
    });
  });

  it("ne restitue pas le focus quand restoreFocus=false", async () => {
    const user = userEvent.setup();
    function RestorableDialog() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button">Hors dialog</button>
          <Dialog open={open} restoreFocus={false} onOpenChange={setOpen} title="Explorer">
            <PanelContent />
          </Dialog>
        </>
      );
    }

    render(<RestorableDialog />);

    const outside = screen.getByRole("button", { name: "Hors dialog", hidden: true });
    outside.focus();
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.activeElement).not.toBe(outside);
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("ferme au clic backdrop quand dismissible", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDialog onOpenChange={onOpenChange} />);

    await user.click(backdrop());

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("boucle Tab et Shift+Tab dans le Dialog", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open title="Explorer" closeLabel="Fermer l'explorateur">
        <PanelContent />
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last?.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);

    first?.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it("verrouille le scroll et neutralise l'arrière-plan", async () => {
    const { container } = render(
      <>
        <button type="button">Arrière-plan</button>
        <Dialog open title="Explorer">
          <PanelContent />
        </Dialog>
      </>,
    );

    await screen.findByRole("dialog");
    expect(document.body.style.overflow).toBe("hidden");
    expect(container.getAttribute("inert")).toBe("");
    expect(container.getAttribute("aria-hidden")).toBe("true");
  });

  it("respecte prefers-reduced-motion", () => {
    render(
      <Dialog open title="Explorer">
        <PanelContent />
      </Dialog>,
    );

    expect(screen.getByRole("dialog").className).toContain("motion-reduce:transition-none");
    expect(backdrop().className).toContain("motion-reduce:transition-none");
  });
});
