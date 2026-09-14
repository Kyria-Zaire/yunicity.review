// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import {
  AuthError,
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_TOO_LARGE,
  COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD,
} from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useComposerMedia } from "@/hooks/use-composer-media";

const uploadPostMedia = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function image(name: string, type = "image/jpeg", size = 3): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("useComposerMedia — MEDIA-01", () => {
  const createObjectURL = vi.fn((file: Blob) => `blob:preview-${(file as File).name ?? "x"}`);
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    uploadPostMedia.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("accepte JPEG puis passe en ready avec mediaUrl", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg", "image/jpeg"));
    });
    expect(result.current.mediaUrl).toBe("/media/a.jpg");
    expect(result.current.phase).toBe("ready");
    expect(result.current.mediaReadyForPublish).toBe(true);
  });

  it("accepte PNG et WebP", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/media/a.png" })
      .mockResolvedValueOnce({ url: "/media/a.webp" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.png", "image/png"));
    });
    expect(result.current.mediaUrl).toBe("/media/a.png");
    await act(async () => {
      await result.current.onFileChange(image("a.webp", "image/webp"));
    });
    expect(result.current.mediaUrl).toBe("/media/a.webp");
  });

  it("refuse HEIC avec message explicite", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("iphone.heic", "image/heic"));
    });
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
    expect(result.current.errorContext?.stage).toBe("validation");
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });

  it("refuse un fichier > 20 MiB", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("big.jpg", "image/jpeg", 20 * 1024 * 1024 + 1));
    });
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_TOO_LARGE);
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });

  it("mappe un refus magic/MIME backend sans fuite brute", async () => {
    uploadPostMedia.mockRejectedValue(
      new AuthError("STORY_MEDIA_INVALID_CONTENT", "raw-storage-detail", 400),
    );
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("fake.jpg"));
    });
    expect(result.current.errorContext).toEqual({
      stage: "upload",
      code: "STORY_MEDIA_INVALID_CONTENT",
      status: 400,
    });
    expect(result.current.mediaError).not.toContain("raw-storage-detail");
  });

  it("la deuxième sélection gagne même si la première répond en dernier", async () => {
    const first = deferred<{ url: string }>();
    const second = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useComposerMedia());

    await act(async () => {
      void result.current.onFileChange(image("first.jpg"));
      void result.current.onFileChange(image("second.jpg"));
    });
    await act(async () => second.resolve({ url: "/second.jpg" }));
    await act(async () => first.resolve({ url: "/first.jpg" }));

    expect(result.current.mediaUrl).toBe("/second.jpg");
    expect(result.current.phase).toBe("ready");
  });

  it("clear invalide et annule l'upload actif sans erreur visible", async () => {
    const pending = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => void result.current.onFileChange(image("photo.jpg")));

    act(() => result.current.clearMedia());
    await act(async () => pending.resolve({ url: "/late.jpg" }));

    expect(result.current.mediaUrl).toBeNull();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.phase).toBe("idle");
    expect(uploadPostMedia.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
  });

  it("invalide l'upload au démontage et ignore la réponse tardive", async () => {
    const pending = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useComposerMedia());
    await act(async () => void result.current.onFileChange(image("photo.jpg")));
    const signal = uploadPostMedia.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ url: "/ignored.jpg" }));
  });

  it("réinitialise l'input après une erreur pour autoriser le même fichier", async () => {
    uploadPostMedia.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useComposerMedia());
    const input = document.createElement("input");
    input.value = "C:\\fakepath\\photo.jpg";
    Object.defineProperty(result.current.fileInputRef, "current", {
      configurable: true,
      value: input,
    });

    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(input.value).toBe("");
  });

  it("bloque beginPublishing tant que le média n'est pas ready", async () => {
    const pending = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => void result.current.onFileChange(image("photo.jpg")));
    expect(result.current.beginPublishing()).toBe(false);
    expect(result.current.mediaReadyForPublish).toBe(false);

    await act(async () => pending.resolve({ url: "/ok.jpg" }));
    expect(result.current.mediaReadyForPublish).toBe(true);
    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
    });
    expect(result.current.phase).toBe("publishing");
    // double clic
    expect(result.current.beginPublishing()).toBe(false);
  });

  it("verrouille atomiquement un double clic sur publier", async () => {
    const { result } = renderHook(() => useComposerMedia());

    expect(result.current.beginPublishing()).toBe(true);
    expect(result.current.beginPublishing()).toBe(false);
  });

  it("après échec d'upload, un retry peut réussir", async () => {
    uploadPostMedia
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ url: "/retry.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(result.current.phase).toBe("error");
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(result.current.mediaUrl).toBe("/retry.jpg");
    expect(result.current.phase).toBe("ready");
  });

  it("conserve mediaUrl après échec de publication pour retry sans re-upload", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/keep.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
      result.current.finishPublishing(false);
    });
    expect(result.current.mediaUrl).toBe("/keep.jpg");
    expect(result.current.phase).toBe("ready");
    expect(result.current.mediaError).toBe(COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD);
    expect(result.current.errorContext?.stage).toBe("publication");
  });

  it("révoque l'object URL quand la prévisualisation n'est plus utilisée", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/final.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.displayUrl).toBe("/final.jpg");

    act(() => result.current.clearMedia());
    expect(result.current.displayUrl).toBeNull();
  });

  it("n'affiche pas d'erreur visible pour une annulation AbortError", async () => {
    uploadPostMedia.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(result.current.mediaError).toBeNull();
    expect(result.current.phase).toBe("cancelled");
  });

  it.each([
    [new TypeError("Failed to fetch"), /connexion interrompue/i],
    [new AuthError("UNAUTHORIZED", "raw", 401), /session/i],
    [new AuthError("SERVER_ERROR", "raw", 503), /indisponible/i],
    [new Error("opaque"), /échec de l’envoi/i],
  ])("mappe une erreur d'upload sans exposer son détail", async (failure, message) => {
    uploadPostMedia.mockRejectedValue(failure);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("photo.jpg"));
    });
    expect(result.current.mediaError).toMatch(message);
    expect(result.current.mediaError).not.toContain("raw");
    expect(result.current.errorContext?.stage).toBe("upload");
  });

  it("annule et identifie un délai d'upload dépassé", async () => {
    vi.useFakeTimers();
    const pending = deferred<{ url: string }>();
    uploadPostMedia.mockImplementation((_file: File, signal: AbortSignal) => {
      signal.addEventListener("abort", () => pending.reject(new DOMException("Aborted", "AbortError")));
      return pending.promise;
    });
    const { result } = renderHook(() => useComposerMedia());
    let request!: Promise<void>;
    act(() => {
      request = result.current.onFileChange(image("slow.jpg"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
      await request;
    });
    expect(result.current.mediaError).toMatch(/trop de temps/i);
    expect(result.current.errorContext).toEqual({ stage: "upload", code: "UPLOAD_TIMEOUT" });
    vi.useRealTimers();
  });
});
