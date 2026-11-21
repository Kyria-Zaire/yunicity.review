// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoShareFeedback } from "@/components/videos/local-video-share-feedback";
import {
  LocalVideoShareFeedbackProvider,
  useLocalVideoShareFeedback,
} from "@/lib/videos/local-video-share-feedback-context";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@yunicity/ui/primitives", () => ({
  Drawer: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function ProbeControls({
  onCopyFromFailed,
}: {
  onCopyFromFailed: () => void;
}) {
  const { showCopied, showFailed, showManual, clearFeedback, rememberShareTrigger } =
    useLocalVideoShareFeedback();
  return (
    <div>
      <button type="button" onClick={() => showCopied()}>
        show-h1
      </button>
      <button
        type="button"
        onClick={() => {
          rememberShareTrigger();
          showFailed("https://yunicity.fr/videos?video=v1");
        }}
      >
        show-h2
      </button>
      <button
        type="button"
        onClick={() => {
          rememberShareTrigger();
          showManual("https://yunicity.fr/videos?video=v1");
        }}
      >
        show-h3
      </button>
      <button type="button" onClick={() => clearFeedback()}>
        clear
      </button>
      <LocalVideoShareFeedback onCopyFromFailed={onCopyFromFailed} />
    </div>
  );
}

function renderFeedback(onCopyFromFailed = vi.fn()) {
  return render(
    <LocalVideoShareFeedbackProvider>
      <ProbeControls onCopyFromFailed={onCopyFromFailed} />
    </LocalVideoShareFeedbackProvider>,
  );
}

describe("VIDEO-REFONTE-L2-PARTAGE-01 — LocalVideoShareFeedback", () => {
  it("affiche H1 Lien copié en role=status puis le retire après 2,5 s", () => {
    vi.useFakeTimers();
    renderFeedback();
    act(() => {
      screen.getByRole("button", { name: "show-h1" }).click();
    });
    const status = screen.getByRole("status");
    expect(status.getAttribute("data-videos-share-h1")).not.toBeNull();
    expect(status.textContent).toContain("Lien copié");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("affiche H2 et appelle la copie à la demande", () => {
    const onCopy = vi.fn();
    renderFeedback(onCopy);
    act(() => {
      screen.getByRole("button", { name: "show-h2" }).click();
    });
    expect(screen.getByRole("alert").getAttribute("data-videos-share-h2")).not.toBeNull();
    expect(screen.getByText("Le partage n'a pas abouti.")).toBeTruthy();
    act(() => {
      screen.getByRole("button", { name: "Copier le lien" }).click();
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("affiche H3 avec texte v2.3 exact et URL complète sélectionnée", () => {
    renderFeedback();
    act(() => {
      screen.getByRole("button", { name: "show-h3" }).click();
    });
    const dialog = screen.getByRole("dialog", { name: "Lien de la vidéo" });
    expect(dialog.querySelector("[data-videos-share-h3]")).toBeTruthy();
    const field = screen.getByLabelText("Lien de la vidéo, sélectionné") as HTMLTextAreaElement;
    expect(field.value).toBe("https://yunicity.fr/videos?video=v1");
    expect(field.readOnly).toBe(true);
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(field.value.length);
    expect(
      screen.getByText(
        "Le partage n'est pas disponible sur cet appareil. Le lien complet est sélectionné : copiez-le avec le menu du téléphone.",
      ),
    ).toBeTruthy();
  });

  it("H2 Fermer restaure le focus sur le déclencheur mémorisé", () => {
    vi.useFakeTimers();
    renderFeedback();
    const trigger = screen.getByRole("button", { name: "show-h2" });
    act(() => {
      trigger.focus();
      trigger.click();
    });
    expect(screen.getByRole("alert")).toBeTruthy();
    act(() => {
      screen.getByRole("button", { name: "Fermer" }).click();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

