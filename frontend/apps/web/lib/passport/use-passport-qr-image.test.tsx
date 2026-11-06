// @vitest-environment jsdom

/**
 * PASSPORT-QR-THIRD-PARTY-01 — états de l'image du QR générée localement :
 * génération, image prête, échec — sans repli vers un service externe.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const generer = vi.hoisted(() => vi.fn<(valeur: string) => Promise<string>>());
vi.mock("@/lib/passport/passport-qr-image", () => ({ passportQrSvgDataUrl: generer }));

import { usePassportQrImage } from "@/hooks/use-passport-qr-image";

afterEach(() => generer.mockReset());

describe("usePassportQrImage (PASSPORT-QR-THIRD-PARTY-01)", () => {
  it("sans valeur : ni image, ni génération, ni erreur", () => {
    const { result } = renderHook(() => usePassportQrImage(null));
    expect(result.current).toEqual({ src: null, generating: false, failed: false });
    expect(generer).not.toHaveBeenCalled();
  });

  it("génère l'image de la valeur exacte, en signalant la génération", async () => {
    generer.mockResolvedValue("data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E");
    const { result } = renderHook(() => usePassportQrImage("YNCP1:fictif"));
    expect(result.current.generating).toBe(true);
    await waitFor(() => expect(result.current.src).toBe("data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E"));
    expect(result.current).toMatchObject({ generating: false, failed: false });
    expect(generer).toHaveBeenCalledWith("YNCP1:fictif");
  });

  it("échec : état d'erreur, aucune image, aucun repli externe", async () => {
    generer.mockRejectedValue(new Error("échec fictif"));
    const { result } = renderHook(() => usePassportQrImage("YNCP1:fictif"));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current).toEqual({ src: null, generating: false, failed: true });
  });

  it("ne rend jamais l'image d'une valeur précédente", async () => {
    generer.mockImplementation(async (valeur) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(valeur)}`);
    const { result, rerender } = renderHook(({ v }) => usePassportQrImage(v), { initialProps: { v: "YNCP1:a" } });
    await waitFor(() => expect(result.current.src).toContain("YNCP1%3Aa"));
    rerender({ v: "YNCP1:b" });
    expect(result.current.src).toBeNull();
    expect(result.current.generating).toBe(true);
    await waitFor(() => expect(result.current.src).toContain("YNCP1%3Ab"));
  });
});
