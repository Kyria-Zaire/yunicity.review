// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { LocalVideoMediumPortraitStage } from "@/components/videos/local-video-slide-frames";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});

describe("LocalVideoMediumPortraitStage — L5 v1.2", () => {
  it("place nav + actions dans la colonne hors vidéo (≠ R-PAN)", () => {
    const bandRef = createRef<HTMLDivElement>();
    const actionsRef = createRef<HTMLDivElement>();
    render(
      <LocalVideoMediumPortraitStage
        video={<div data-testid="video-surface" />}
        overlays={null}
        meta={<div>meta</div>}
        bar={null}
        thread={null}
        actions={<div data-testid="actions-rail">actions</div>}
        bandRef={bandRef}
        actionsRef={actionsRef}
        onChromeFocus={vi.fn()}
        onChromeBlur={vi.fn()}
        nav={{
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          canPrevious: false,
          canNext: true,
        }}
      />,
    );
    expect(document.querySelector("[data-videos-medium-portrait-stage]")).toBeTruthy();
    expect(document.querySelector("[data-videos-medium-side-column]")).toBeTruthy();
    expect(screen.getByTestId("video-surface")).toBeTruthy();
    expect(screen.getByTestId("actions-rail")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Vidéo précédente" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Vidéo suivante" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    // Colonne hors cadre : side column n'est pas dans le wrap vidéo
    const stage = document.querySelector("[data-videos-medium-portrait-stage]");
    const side = stage?.querySelector("[data-videos-medium-side-column]");
    const videoParent = screen.getByTestId("video-surface").parentElement;
    expect(side && videoParent && !videoParent.contains(side)).toBe(true);
  });
});
