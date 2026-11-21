"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export type LocalVideoShareFeedbackState =
  | { kind: "idle" }
  | { kind: "copied" }
  | { kind: "failed"; url: string }
  | { kind: "manual"; url: string };

type LocalVideoShareFeedbackContextValue = {
  feedback: LocalVideoShareFeedbackState;
  showCopied: () => void;
  showFailed: (url: string) => void;
  showManual: (url: string) => void;
  clearFeedback: () => void;
  shareTriggerRef: RefObject<HTMLElement | null>;
  rememberShareTrigger: () => void;
};

const LocalVideoShareFeedbackContext =
  createContext<LocalVideoShareFeedbackContextValue | null>(null);

export function LocalVideoShareFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<LocalVideoShareFeedbackState>({ kind: "idle" });
  const shareTriggerRef = useRef<HTMLElement | null>(null);
  const copiedTimerRef = useRef<number>(0);

  const clearFeedback = useCallback(() => {
    window.clearTimeout(copiedTimerRef.current);
    setFeedback({ kind: "idle" });
  }, []);

  const showCopied = useCallback(() => {
    window.clearTimeout(copiedTimerRef.current);
    setFeedback({ kind: "copied" });
    copiedTimerRef.current = window.setTimeout(() => {
      setFeedback({ kind: "idle" });
    }, 2500);
  }, []);

  const showFailed = useCallback((url: string) => {
    window.clearTimeout(copiedTimerRef.current);
    setFeedback({ kind: "failed", url });
  }, []);

  const showManual = useCallback((url: string) => {
    window.clearTimeout(copiedTimerRef.current);
    setFeedback({ kind: "manual", url });
  }, []);

  const rememberShareTrigger = useCallback(() => {
    const active = document.activeElement;
    shareTriggerRef.current = active instanceof HTMLElement ? active : null;
  }, []);

  const value = useMemo(
    () => ({
      feedback,
      showCopied,
      showFailed,
      showManual,
      clearFeedback,
      shareTriggerRef,
      rememberShareTrigger,
    }),
    [feedback, showCopied, showFailed, showManual, clearFeedback, rememberShareTrigger],
  );

  return (
    <LocalVideoShareFeedbackContext.Provider value={value}>
      {children}
    </LocalVideoShareFeedbackContext.Provider>
  );
}

export function useLocalVideoShareFeedback(): LocalVideoShareFeedbackContextValue {
  const ctx = useContext(LocalVideoShareFeedbackContext);
  if (!ctx) {
    throw new Error("useLocalVideoShareFeedback requires LocalVideoShareFeedbackProvider");
  }
  return ctx;
}

/** Optional: desktop cards / hooks outside provider stay silent on feedback UI. */
export function useOptionalLocalVideoShareFeedback(): LocalVideoShareFeedbackContextValue | null {
  return useContext(LocalVideoShareFeedbackContext);
}
