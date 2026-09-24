// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ registrationStatus: vi.fn() }));

vi.mock("@yunicity/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@yunicity/utils")>();
  return {
    ...actual,
    createAuthClient: () => ({ registrationStatus: mocks.registrationStatus }),
    getWebApiBaseUrl: () => "https://api.test",
  };
});

import {
  REGISTRATION_STATUS_TIMEOUT_MS,
  useRegistrationStatus,
  withTimeout,
} from "@/hooks/use-registration-status";

const PILOT = {
  open: true,
  mode: "pilot",
  temporarily_unavailable: false,
  turnstile_required: false,
  turnstile_site_key: null,
  closes_at: null,
};

describe("useRegistrationStatus — source backend autoritaire", () => {
  beforeEach(() => mocks.registrationStatus.mockReset());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("ne publie aucun statut ouvert pendant le chargement", async () => {
    let resolveRequest!: (value: typeof PILOT) => void;
    mocks.registrationStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = renderHook(() => useRegistrationStatus());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBeNull();
    expect(result.current.isUnavailable).toBe(false);
    await act(async () => resolveRequest(PILOT));
  });

  it("accepte seulement une réponse backend complète et valide", async () => {
    mocks.registrationStatus.mockResolvedValue(PILOT);
    const { result } = renderHook(() => useRegistrationStatus());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual(PILOT);
    expect(result.current.isUnavailable).toBe(false);
  });

  it.each(["réseau", "404", "5xx"])("capture une erreur %s", async () => {
    await expect(
      withTimeout(() => Promise.reject(new Error("request failed")), 100),
    ).rejects.toThrow("request failed");
  });

  it("reste indisponible sur JSON partiel ou invalide", async () => {
    mocks.registrationStatus.mockResolvedValue({ open: true });
    const { result } = renderHook(() => useRegistrationStatus());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBeNull();
    expect(result.current.isUnavailable).toBe(true);
  });

  it("expire une requête silencieuse", async () => {
    vi.useFakeTimers();
    const attente = withTimeout(
      () => new Promise(() => undefined),
      REGISTRATION_STATUS_TIMEOUT_MS,
    );
    const assertion = expect(attente).rejects.toThrow("registration-status-timeout");
    await vi.advanceTimersByTimeAsync(REGISTRATION_STATUS_TIMEOUT_MS + 1);
    await assertion;
  });

  it("une erreur réseau ferme le hook et retry déclenche exactement une nouvelle requête", async () => {
    mocks.registrationStatus
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(PILOT);
    const { result } = renderHook(() => useRegistrationStatus());
    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toEqual(PILOT));
    expect(mocks.registrationStatus).toHaveBeenCalledTimes(2);
  });
});
