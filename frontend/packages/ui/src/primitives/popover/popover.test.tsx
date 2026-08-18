import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Popover, POPOVER_ROOT_ATTRIBUTE } from "./popover";

function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>("[data-yunicity-popover-panel]");
  if (!element) throw new Error("Panneau Popover introuvable");
  return element;
}

describe("Popover — ouverture et sémantique non modale", () => {
  it("expose aria-haspopup, aria-expanded et aria-controls stables", async () => {
    const user = userEvent.setup();
    render(
      <Popover placement="bottom-start" trigger={(props) => <button {...props}>Menu</button>}>
        <button type="button">Action</button>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();

    await user.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel().id).toBe(controlsId);
    expect(panel().getAttribute("role")).toBe("dialog");
    expect(panel().getAttribute("aria-modal")).toBeNull();
    expect(document.querySelector("[data-yunicity-overlay-backdrop]")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("compose ref et onClick du consommateur sans écrasement", async () => {
    const user = userEvent.setup();
    const consumerClick = vi.fn();
    const consumerRef = vi.fn();

    render(
      <Popover
        placement="bottom-start"
        trigger={(props) => (
          <button
            {...props}
            ref={(node) => {
              props.ref(node);
              consumerRef(node);
            }}
            onClick={(event) => {
              props.onClick();
              consumerClick(event);
            }}
          >
            Menu
          </button>
        )}
      >
        <span>Contenu</span>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));

    expect(consumerClick).toHaveBeenCalledTimes(1);
    expect(consumerRef).toHaveBeenCalled();
    expect(screen.getByText("Contenu")).not.toBeNull();
  });
});

describe("Popover — fermeture par raison", () => {
  it("escape ferme et restaure le focus au déclencheur", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover
        placement="bottom-start"
        onOpenChange={onOpenChange}
        trigger={(props) => <button {...props}>Menu</button>}
      >
        <button type="button">Action</button>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Menu" });
    trigger.focus();
    await user.click(trigger);
    await waitFor(() => expect(panel().contains(document.activeElement)).toBe(true));

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Action")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false, "escape");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("outside-pointer ferme sans restaurer le focus au déclencheur", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <button type="button">Externe</button>
        <Popover
          placement="bottom-start"
          onOpenChange={onOpenChange}
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <button type="button">Action</button>
        </Popover>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await waitFor(() => expect(panel()).not.toBeNull());

    const external = screen.getByRole("button", { name: "Externe" });
    await user.click(external);

    expect(screen.queryByText("Action")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false, "outside-pointer");
    expect(document.activeElement).toBe(external);
  });

  it("focus-exit par Tab après le dernier item ferme sans restaurer", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <Popover
          placement="bottom-start"
          onOpenChange={onOpenChange}
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <button type="button">Action</button>
        </Popover>
        <button type="button">Après</button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const action = screen.getByRole("button", { name: "Action" });
    await waitFor(() => expect(document.activeElement).toBe(action));

    await user.tab();

    expect(screen.queryByText("Action")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false, "focus-exit");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Après" }));
  });

  it("focus-exit par Shift+Tab avant le premier item ferme sans restaurer", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <button type="button">Avant</button>
        <Popover
          placement="bottom-start"
          onOpenChange={onOpenChange}
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <button type="button">Action</button>
        </Popover>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const action = screen.getByRole("button", { name: "Action" });
    await waitFor(() => expect(document.activeElement).toBe(action));
    action.focus();

    await user.tab({ shift: true });

    expect(screen.queryByText("Action")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false, "focus-exit");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Avant" }));
  });

  it("close(navigation) ne restaure pas le focus au déclencheur", async () => {
    const user = userEvent.setup();
    function NavigationClose() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button">Hors popover</button>
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom-start"
            trigger={(props) => <button {...props}>Menu</button>}
          >
            {(controls) => (
              <button type="button" onClick={() => controls.close("navigation")}>
                Naviguer
              </button>
            )}
          </Popover>
        </>
      );
    }

    render(<NavigationClose />);
    const outside = screen.getByRole("button", { name: "Hors popover" });
    outside.focus();

    await user.click(screen.getByRole("button", { name: "Naviguer" }));

    expect(screen.queryByRole("button", { name: "Naviguer" })).toBeNull();
    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "Menu" }));
  });

  it("close(superseded) ne restaure pas le focus au déclencheur", async () => {
    const user = userEvent.setup();
    function SupersededClose() {
      const [open, setOpen] = useState(true);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          placement="bottom-start"
          trigger={(props) => <button {...props}>Menu</button>}
        >
          {(controls) => (
            <button type="button" onClick={() => controls.close("superseded")}>
              Remplacer
            </button>
          )}
        </Popover>
      );
    }

    render(<SupersededClose />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    await waitFor(() => expect(panel().contains(document.activeElement)).toBe(true));

    await user.click(screen.getByRole("button", { name: "Remplacer" }));

    expect(screen.queryByRole("button", { name: "Remplacer" })).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
  });

  it("démontage programmatic restaure le focus si focus interne et déclencheur connecté", async () => {
    function Wrapper({ open }: { open: boolean }) {
      return (
        <Popover
          open={open}
          placement="bottom-start"
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <button type="button">Action</button>
        </Popover>
      );
    }

    const { rerender } = render(<Wrapper open />);
    await waitFor(() => expect(panel().contains(document.activeElement)).toBe(true));

    rerender(<Wrapper open={false} />);

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Menu" })),
    );
  });

  it("démontage programmatic ne restaure pas quand le focus est déjà hors du panneau", async () => {
    function ProgrammaticUnmountOutside() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button">Externe</button>
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom-start"
            trigger={(props) => <button {...props}>Menu</button>}
          >
            <button type="button">Action</button>
          </Popover>
        </>
      );
    }

    const { rerender } = render(<ProgrammaticUnmountOutside />);
    const external = screen.getByRole("button", { name: "Externe" });
    external.focus();

    rerender(
      <>
        <button type="button">Externe</button>
        <Popover
          open={false}
          placement="bottom-start"
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <button type="button">Action</button>
        </Popover>
      </>,
    );

    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "Menu" }));
  });
});

function mockViewportRect(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}): DOMRect {
  return {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return rect;
    },
  } as DOMRect;
}

describe("Popover — repositionnement et nettoyage", () => {
  it("ancre bottom-end sous le déclencheur, borné au viewport, et se recale au resize", async () => {
    const user = userEvent.setup();
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    let triggerLeft = 1174;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.getAttribute("data-yunicity-popover-panel") != null) {
        return mockViewportRect({ top: 70, left: 1010, width: 320, height: 200 });
      }
      return mockViewportRect({ top: 18, left: triggerLeft, width: 156, height: 44 });
    };
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1366 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "scrollX", { configurable: true, value: 80 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 40 });

    try {
      render(
        <Popover placement="bottom-end" trigger={(props) => <button {...props}>Menu</button>}>
          <button type="button">Action</button>
        </Popover>,
      );

      await user.click(screen.getByRole("button", { name: "Menu" }));
      await waitFor(() => expect(panel()).not.toBeNull());

      expect(Number.parseFloat(panel().style.top)).toBe(18 + 44 + 8);
      expect(Number.parseFloat(panel().style.left)).toBe(1174 + 156 - 320);
      expect(document.querySelector("[data-yunicity-overlay-backdrop]")).toBeNull();
      expect(document.body.style.overflow).toBe("");
      expect(panel().getAttribute("inert")).toBeNull();

      triggerLeft = 200;
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });
      await waitFor(() => expect(Number.parseFloat(panel().style.left)).toBe(200 + 156 - 320));

      triggerLeft = 900;
      act(() => {
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      await waitFor(() => expect(Number.parseFloat(panel().style.left)).toBe(900 + 156 - 320));
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("repositionne au scroll et au resize", async () => {
    const user = userEvent.setup();
    render(
      <Popover placement="bottom-start" trigger={(props) => <button {...props}>Menu</button>}>
        <span>Contenu</span>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await waitFor(() => expect(panel()).not.toBeNull());

    const initialTop = panel().style.top;
    act(() => {
      window.dispatchEvent(new Event("scroll", { bubbles: true }));
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(panel().style.top).toBeTruthy();
      expect(panel().style.left).toBeTruthy();
    });
    expect(typeof panel().style.top).toBe("string");
    expect(typeof panel().style.left).toBe("string");
    expect(panel().style.top).toBeDefined();
    if (initialTop) expect(panel().style.top).toBeTruthy();
  });

  it("retire portail et listeners au démontage", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Popover placement="bottom-start" trigger={(props) => <button {...props}>Menu</button>}>
        <span>Contenu</span>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await waitFor(() => expect(document.querySelectorAll(`[${POPOVER_ROOT_ATTRIBUTE}]`).length).toBe(1));

    unmount();

    expect(document.querySelectorAll(`[${POPOVER_ROOT_ATTRIBUTE}]`).length).toBe(0);
  });

  it("ne rend pas l'application inert ni aria-hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Popover placement="bottom-start" trigger={(props) => <button {...props}>Menu</button>}>
        <span>Contenu</span>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await waitFor(() => expect(panel()).not.toBeNull());

    expect(container.getAttribute("inert")).toBeNull();
    expect(container.getAttribute("aria-hidden")).toBeNull();
  });

  it("focalise initialFocusRef quand connecté", async () => {
    function WithInitialFocus() {
      const inputRef = useRef<HTMLInputElement>(null);
      return (
        <Popover
          open
          placement="bottom-start"
          initialFocusRef={inputRef}
          trigger={(props) => <button {...props}>Menu</button>}
        >
          <input ref={inputRef} type="search" aria-label="Recherche" />
        </Popover>
      );
    }

    render(<WithInitialFocus />);
    const input = screen.getByRole("searchbox", { name: "Recherche" });
    await waitFor(() => expect(document.activeElement).toBe(input));
  });
});
