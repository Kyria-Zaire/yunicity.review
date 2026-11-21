// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES } from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TurnstileWidget } from "@/components/register/turnstile-widget";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Callbacks = {
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
};

let captured: Callbacks = {};
let renderCount = 0;
let removeCount = 0;

/**
 * Simule l'API du script officiel. Aucun appel réseau : les clés de test
 * Cloudflare suffisent à éprouver notre câblage, qui est ce qui nous appartient.
 */
function installTurnstileStub(): void {
  window.turnstile = {
    render: (_el: HTMLElement, options: Record<string, unknown>) => {
      renderCount += 1;
      captured = options as Callbacks;
      return `widget-${renderCount}`;
    },
    remove: () => {
      removeCount += 1;
    },
    reset: () => undefined,
  };
}

beforeEach(() => {
  captured = {};
  renderCount = 0;
  removeCount = 0;
  document.head.querySelectorAll("script").forEach((s) => s.remove());
  delete window.turnstile;
});

afterEach(cleanup);

describe("TurnstileWidget — montage", () => {
  it("monte le widget avec la site key fournie et l'action register", async () => {
    installTurnstileStub();
    const onToken = vi.fn();

    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={onToken}
        onUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(renderCount).toBe(1));
    expect((captured as unknown as Record<string, unknown>).sitekey).toBe(
      TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES,
    );
    expect((captured as unknown as Record<string, unknown>).action).toBe("register");
  });

  it("annonce la vérification aux lecteurs d'écran", async () => {
    installTurnstileStub();
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    );

    // Le conteneur porte un libellé accessible, même si le widget lui-même est
    // rendu par un tiers.
    await waitFor(() => {
      expect(screen.getByText(/Vérification de sécurité anti-robot/i)).toBeTruthy();
    });
  });

  it("retire le widget au démontage, pour qu'un remontage n'en empile pas deux", async () => {
    installTurnstileStub();
    const { unmount } = render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(renderCount).toBe(1));
    unmount();
    expect(removeCount).toBe(1);
  });
});

describe("TurnstileWidget — cycle de vie du jeton", () => {
  it("remonte le jeton obtenu", async () => {
    installTurnstileStub();
    const onToken = vi.fn();
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={onToken}
        onUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(captured.callback).toBeTypeOf("function"));
    captured.callback?.("jeton-de-test");
    expect(onToken).toHaveBeenCalledWith("jeton-de-test");
  });

  it("signale l'expiration par un jeton nul", async () => {
    installTurnstileStub();
    const onToken = vi.fn();
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={onToken}
        onUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(captured["expired-callback"]).toBeTypeOf("function"));
    captured["expired-callback"]?.();
    // Le formulaire doit savoir qu'il faut redemander un jeton, plutôt que de
    // découvrir le refus à la soumission.
    expect(onToken).toHaveBeenCalledWith(null);
  });

  it("signale aussi le délai dépassé", async () => {
    installTurnstileStub();
    const onToken = vi.fn();
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={onToken}
        onUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(captured["timeout-callback"]).toBeTypeOf("function"));
    captured["timeout-callback"]?.();
    expect(onToken).toHaveBeenCalledWith(null);
  });

  it("annonce l'indisponibilité en cas d'erreur du widget", async () => {
    installTurnstileStub();
    const onUnavailable = vi.fn();
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={vi.fn()}
        onUnavailable={onUnavailable}
      />,
    );

    await waitFor(() => expect(captured["error-callback"]).toBeTypeOf("function"));
    captured["error-callback"]?.();

    expect(onUnavailable).toHaveBeenCalled();
    await waitFor(() => {
      const alerte = screen.getByRole("alert");
      expect(alerte.textContent).toMatch(/vos informations sont conservées/i);
    });
  });
});

describe("TurnstileWidget — chargement du script", () => {
  it("n'insère qu'une seule balise même pour deux widgets", async () => {
    // Le script est global à la page : deux montages ne doivent pas le charger
    // deux fois, sinon Cloudflare réinitialise l'état du premier.
    render(
      <>
        <TurnstileWidget
          siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
          onToken={vi.fn()}
          onUnavailable={vi.fn()}
        />
        <TurnstileWidget
          siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
          onToken={vi.fn()}
          onUnavailable={vi.fn()}
        />
      </>,
    );

    await waitFor(() => {
      const balises = document.head.querySelectorAll(
        `script[src^="${TURNSTILE_SCRIPT_URL}"]`,
      );
      expect(balises.length).toBe(1);
      // Et depuis le seul hôte officiel.
      expect(balises[0]?.getAttribute("src")?.startsWith("https://challenges.cloudflare.com/")).toBe(
        true,
      );
    });
  });

  it("ne laisse aucun secret transiter par le DOM", async () => {
    const { container } = render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    );

    // La site key est publique par conception ; le secret ne doit jamais quitter
    // le backend, et rien qui y ressemble ne doit apparaitre cote client.
    await waitFor(() => {
      const dom = document.head.innerHTML + container.innerHTML;
      expect(dom).not.toMatch(/secret/i);
      // Une cle secrete Turnstile fait 35 caracteres et commence par 0x/1x/2x
      // suivis de 32 caracteres : sa forme ne doit apparaitre nulle part.
      expect(dom).not.toMatch(/[0-2]x[A-Za-z0-9]{32}/);
    });
  });

  it("affiche l'état de chargement tant que le script n'a pas répondu", () => {
    render(
      <TurnstileWidget
        siteKey={TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES}
        onToken={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    );

    const statut = screen.getByRole("status");
    expect(statut.textContent).toMatch(/Vérification de sécurité en cours/i);
  });
});
