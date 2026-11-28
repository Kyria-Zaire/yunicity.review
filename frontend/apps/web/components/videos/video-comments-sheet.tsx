"use client";

import type { LocalVideoComment, LocalVideoFeedItem } from "@yunicity/types";
import { Drawer } from "@yunicity/ui/primitives";
import {
  LOCAL_VIDEO_COMMENT_LOAD_ERROR,
  LOCAL_VIDEO_COMMENT_PLACEHOLDER,
  LOCAL_VIDEO_COMMENT_SEND_ERROR,
  LOCAL_VIDEO_COMMENT_SUBMIT_LABEL,
  LOCAL_VIDEO_COMMENTS_EMPTY,
} from "@yunicity/utils";
import { Loader2, Send, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type VideoCommentsSheetProps = {
  open: boolean;
  video: LocalVideoFeedItem | null;
  onClose: () => void;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
  /** Cible explicite de retour du focus à la fermeture (sinon mémorise le déclencheur à l'ouverture). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * `sheet` (défaut) : tiroir bas Lot 4.
   * `panel` : contenu seul pour panneau latéral desktop C2 (Lot 8) — sans Drawer.
   */
  presentation?: "sheet" | "panel";
};

function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Horodatage relatif court pour panneau C2 (maquette « · 1 h »). */
function formatCommentRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const deltaSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (deltaSec < 60) return "à l'instant";
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  return formatCommentTime(iso);
}

function commentInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? "";
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

/** Remet le panneau commentaires dans son contrat CSS (plus de styles clavier). */
function clearCommentsPanelViewportStyles(panel: HTMLElement) {
  panel.style.bottom = "";
  panel.style.maxHeight = "";
  panel.style.top = "";
  panel.style.left = "";
  panel.style.right = "";
  panel.style.width = "";
}

/**
 * Ancre le tiroir bas au visualViewport quand le clavier réduit la zone visible
 * (Safari iPhone : sinon fermeture hors cadre et « Publier » coincé sous le clavier).
 *
 * Ne combat PAS un zoom manuel (`scale > 1`) : on restaure alors les styles pour
 * éviter un décalage horizontal persistant après fermeture du clavier.
 * Le zoom auto Safari est prévenu en amont (textarea ≥ 16 px), jamais en
 * verrouillant l'échelle du viewport meta.
 */
function useCommentsKeyboardViewport(active: boolean) {
  const panelRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      const panel = panelRef.current;
      if (panel) clearCommentsPanelViewportStyles(panel);
      panelRef.current = null;
      return;
    }

    const findPanel = (): HTMLElement | null => {
      const dialogs = document.querySelectorAll<HTMLElement>('[data-yunicity-overlay="bottom"] [role="dialog"]');
      return dialogs[dialogs.length - 1] ?? null;
    };

    const sync = () => {
      const panel = findPanel();
      if (!panel) return;
      panelRef.current = panel;
      const vv = window.visualViewport;
      if (!vv) {
        clearCommentsPanelViewportStyles(panel);
        panel.style.maxHeight = "90dvh";
        return;
      }
      // Zoom manuel / résidu Safari : ne pas forcer left/width (cause du décalage).
      if (vv.scale > 1.01) {
        clearCommentsPanelViewportStyles(panel);
        return;
      }
      const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      panel.style.bottom = `${keyboardInset}px`;
      panel.style.maxHeight = `${Math.round(vv.height * 0.92)}px`;
      panel.style.top = "auto";
      panel.style.left = "0";
      panel.style.right = "0";
      panel.style.width = "100%";
    };

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      const panel = panelRef.current;
      if (panel) clearCommentsPanelViewportStyles(panel);
      panelRef.current = null;
    };
  }, [active]);
}

export function VideoCommentsSheet({
  open,
  video,
  onClose,
  onCommentCountDelta,
  returnFocusRef: returnFocusRefProp,
  presentation = "sheet",
}: VideoCommentsSheetProps) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [keyboardExpanded, setKeyboardExpanded] = useState(false);
  const [comments, setComments] = useState<LocalVideoComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const capturedTriggerRef = useRef<HTMLElement | null>(null);
  const sheetBodyRef = useRef<HTMLDivElement>(null);
  const blurCloseTimerRef = useRef<number | null>(null);

  useCommentsKeyboardViewport(presentation === "sheet" && open && keyboardExpanded);

  useLayoutEffect(() => {
    if (open) {
      capturedTriggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  const returnFocusRef = returnFocusRefProp ?? capturedTriggerRef;

  const loadComments = useCallback(async () => {
    if (!video) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listLocalVideoComments(video.id, { limit: 50 });
      setComments(Array.isArray(response?.items) ? response.items : []);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_LOAD_ERROR);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [api, video]);

  useEffect(() => {
    if (!open || !video) {
      setDraft("");
      setComments((current) => (current.length === 0 ? current : []));
      setError(null);
      return;
    }
    void loadComments();
  }, [loadComments, open, video]);

  useEffect(() => {
    if (!open) {
      setKeyboardExpanded((expanded) => (expanded ? false : expanded));
    }
  }, [open]);

  useEffect(
    () => () => {
      if (blurCloseTimerRef.current != null) window.clearTimeout(blurCloseTimerRef.current);
    },
    [],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!video) return;
    const body = draft.trim();
    if (!body || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.createLocalVideoComment(video.id, { body });
      setComments((prev) => [...prev, created]);
      setDraft("");
      onCommentCountDelta?.(video.id, 1);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_SEND_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(comment: LocalVideoComment) {
    if (!video || comment.author_user_id !== user?.id) return;
    try {
      await api.deleteLocalVideoComment(comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      onCommentCountDelta?.(video.id, -1);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_SEND_ERROR);
    }
  }

  const handleComposerFocus = () => {
    if (blurCloseTimerRef.current != null) {
      window.clearTimeout(blurCloseTimerRef.current);
      blurCloseTimerRef.current = null;
    }
    setKeyboardExpanded(true);
  };

  const handleComposerBlur = (event: FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && sheetBodyRef.current?.contains(next)) return;
    // Laisse le clic sur « Fermer » / « Publier » se résoudre avant de replier le tiroir.
    blurCloseTimerRef.current = window.setTimeout(() => {
      blurCloseTimerRef.current = null;
      setKeyboardExpanded(false);
    }, 120);
  };

  const body = !video ? null : (
    <div
      ref={sheetBodyRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden"
      data-videos-comments-keyboard={keyboardExpanded ? "expanded" : "collapsed"}
      data-videos-comments-presentation={presentation}
    >
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400 motion-reduce:animate-none" aria-hidden />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-neutral-600">{LOCAL_VIDEO_COMMENTS_EMPTY}</p>
        </div>
      ) : (
        <ul
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${
            presentation === "panel" ? "gap-0 px-5 py-1" : "gap-3 pb-3"
          }`}
        >
          {comments.map((comment) => {
            const isMine = comment.author_user_id === user?.id;
            return (
              <li
                key={comment.id}
                className={
                  presentation === "panel"
                    ? "flex gap-3 border-b border-transparent py-3"
                    : "rounded-2xl bg-neutral-50 px-3 py-2"
                }
              >
                {presentation === "panel" ? (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-[12px] font-bold text-[#2A2FFF]"
                    aria-hidden
                  >
                    {commentInitials(comment.author_display_name)}
                  </span>
                ) : null}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div className={`min-w-0 ${presentation === "panel" ? "flex flex-col gap-0.5" : ""}`}>
                    <p
                      className={
                        presentation === "panel"
                          ? "text-[13px] font-bold text-neutral-900"
                          : "text-sm font-semibold text-neutral-900"
                      }
                    >
                      {comment.author_display_name}
                      {presentation === "panel" ? (
                        <span className="font-normal text-[#6B7280]">
                          {" "}
                          · {formatCommentRelativeTime(comment.created_at)}
                        </span>
                      ) : null}
                    </p>
                    {presentation === "sheet" ? (
                      <p className="text-xs text-neutral-500">{formatCommentTime(comment.created_at)}</p>
                    ) : null}
                    <p
                      className={
                        presentation === "panel"
                          ? "text-[14px] leading-5 text-neutral-900"
                          : "mt-1 text-sm text-neutral-800"
                      }
                    >
                      {comment.body}
                    </p>
                  </div>
                  {isMine ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(comment)}
                      className={`${VIDEO_TOUCH_TARGET} rounded-full text-neutral-500 hover:bg-neutral-100 ${VIDEO_CANVAS_FOCUS}`}
                      aria-label="Supprimer mon commentaire"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="px-4 pb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className={`min-w-0 shrink-0 border-t border-neutral-200 ${
          presentation === "panel" ? "px-3 pb-3 pl-5 pt-2.5" : "pt-3"
        }`}
      >
        <div className="flex min-w-0 max-w-full items-center gap-2">
          {presentation === "panel" ? (
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
              maxLength={500}
              onFocus={handleComposerFocus}
              onBlur={handleComposerBlur}
              className="h-11 min-w-0 flex-1 rounded-full border border-neutral-200 bg-[#F7F8FA] px-3.5 text-[15px] text-neutral-900"
              aria-label="Écrire un commentaire"
            />
          ) : (
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
              maxLength={500}
              onFocus={handleComposerFocus}
              onBlur={handleComposerBlur}
              /* text-base (16 px) : seuil Safari iOS — text-sm (14 px) déclenche le zoom auto. */
              className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-neutral-800"
              aria-label="Écrire un commentaire"
            />
          )}
          <button
            type="submit"
            disabled={!draft.trim() || isSubmitting}
            aria-label={LOCAL_VIDEO_COMMENT_SUBMIT_LABEL}
            className={
              presentation === "panel"
                ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 disabled:opacity-60 enabled:bg-yunicity-primary enabled:text-white"
                : "inline-flex min-h-11 max-w-[40%] shrink-0 items-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white disabled:opacity-40"
            }
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : presentation === "panel" ? (
              <Send className="h-4 w-4" aria-hidden />
            ) : (
              LOCAL_VIDEO_COMMENT_SUBMIT_LABEL
            )}
          </button>
        </div>
      </form>
    </div>
  );

  if (presentation === "panel") {
    if (!open || !video) return null;
    return body;
  }

  // Sans vidéo : Drawer FERMÉ plutôt que rien. Même type, même position que le Drawer
  // ouvert ci-dessous : React garde l'instance, et la transition fermé → ouvert donne le
  // focus au dialogue (VIDEO-REFONTE-L3L4, écran F). Monter un Drawer déjà ouvert ne le fait pas.
  if (!video) {
    return (
      <Drawer open={false} onOpenChange={() => {}} title="Commentaires" zIndex={Z_INDEX.VIDEO_COMMENTS}>
        {null}
      </Drawer>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Commentaires"
      zIndex={Z_INDEX.VIDEO_COMMENTS}
      returnFocusRef={returnFocusRef}
      className={`rounded-t-3xl bg-white ${keyboardExpanded ? "max-h-[90dvh]" : "max-h-[60dvh]"}`}
    >
      {body}
    </Drawer>
  );
}
