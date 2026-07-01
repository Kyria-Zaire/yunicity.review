import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readLocalVideoPendingRecords,
  registerLocalVideoPending,
  removeLocalVideoPending,
} from "./local-video-pending-storage";

function createSessionStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("local-video-pending-storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createSessionStorageMock() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers and removes pending video ids", () => {
    registerLocalVideoPending({
      videoId: "abc",
      title: "Mon moment",
      registeredAt: new Date().toISOString(),
    });
    expect(readLocalVideoPendingRecords()).toHaveLength(1);
    removeLocalVideoPending("abc");
    expect(readLocalVideoPendingRecords()).toHaveLength(0);
  });
});
