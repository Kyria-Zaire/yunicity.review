// @vitest-environment jsdom

/**
 * MEDIA-01C — garde contre la perte de `this` sur fetchAuthorizedMediaBlob.
 *
 * Les mocks `vi.fn()` libres masquent le bug : une vraie méthode d'instance
 * lit `this.auth` / `this.apiBaseUrl`. Extraire la méthode sans bind casse
 * le fetch avant tout réseau (CLIENT_PRE_NETWORK_FAILURE live).
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
  __resetAuthorizedMediaSessionForTests,
} from "@yunicity/utils";

const VALID_MEDIA =
  "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";

type MediaBlob = { blob: Blob; contentType: "image/jpeg" };

/**
 * Double qui dépend réellement de `this` — miroir de YunicityApi.fetchAuthorizedMediaBlob.
 * Si la méthode est détachée, l'accès à `this.authSentinel` lève avant tout réseau.
 */
class ThisDependentMediaApi {
  readonly authSentinel = { kind: "auth-client" as const };
  readonly apiBaseUrl = "https://api-preview.yunicity.city";
  networkCalls = 0;
  private readonly impl: (url: string, signal?: AbortSignal) => Promise<MediaBlob>;

  constructor(impl: (url: string, signal?: AbortSignal) => Promise<MediaBlob>) {
    this.impl = impl;
  }

  fetchAuthorizedMediaBlob(mediaUrl: string, signal?: AbortSignal): Promise<MediaBlob> {
    // Accès direct à `this.*` — TypeError si la méthode est détachée (strict).
    const auth = this.authSentinel;
    const base = this.apiBaseUrl;
    void auth;
    void base;
    this.networkCalls += 1;
    return this.impl(mediaUrl, signal);
  }
}

function createApiWithAuthSentinel(
  impl?: (url: string, signal?: AbortSignal) => Promise<MediaBlob>,
): ThisDependentMediaApi {
  const defaultImpl = async (): Promise<MediaBlob> => ({
    blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
    contentType: "image/jpeg",
  });
  return new ThisDependentMediaApi(impl ?? defaultImpl);
}

const apiHolder: { current: ThisDependentMediaApi } = {
  current: createApiWithAuthSentinel(),
};

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => apiHolder.current,
}));

beforeEach(() => {
  apiHolder.current = createApiWithAuthSentinel();
});

afterEach(() => {
  cleanup();
  __resetAuthorizedMediaSessionForTests();
});

describe("MEDIA-01C — binding this de fetchAuthorizedMediaBlob", () => {
  it("une méthode détachée échoue avant tout réseau (preuve du bug)", async () => {
    const api = createApiWithAuthSentinel();
    const detached = api.fetchAuthorizedMediaBlob;

    // Throw synchrone (accès this.*) — pas une Promise rejetée.
    await expect(
      Promise.resolve().then(() => detached(VALID_MEDIA)),
    ).rejects.toBeInstanceOf(TypeError);
    expect(api.networkCalls).toBe(0);
  });

  it("FeedPublicationMedia appelle la méthode d'instance avec this intact", async () => {
    const api = createApiWithAuthSentinel();
    apiHolder.current = api;

    const { container } = render(
      <FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Salut Média School" />,
    );

    await waitFor(() => {
      expect(api.networkCalls).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(
        container.querySelector('[data-authorized-media-state="decoding"]'),
      ).not.toBeNull();
    });
    expect(screen.queryByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeNull();
  });

  it("Retry déclenche un second appel réseau avec this intact", async () => {
    let failOnce = true;
    const api = createApiWithAuthSentinel(async () => {
      if (failOnce) {
        failOnce = false;
        throw new Error("transient");
      }
      return {
        blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
        contentType: "image/jpeg",
      };
    });
    apiHolder.current = api;
    const user = userEvent.setup();

    const { container } = render(
      <FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Hello média school" />,
    );

    expect(await screen.findByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeTruthy();
    expect(api.networkCalls).toBe(1);

    await user.click(screen.getByRole("button", { name: AUTHORIZED_MEDIA_RETRY_LABEL }));

    await waitFor(() => {
      expect(api.networkCalls).toBe(2);
    });
    await waitFor(() => {
      expect(
        container.querySelector('[data-authorized-media-state="decoding"]'),
      ).not.toBeNull();
    });
    expect(screen.queryByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeNull();
  });
});
