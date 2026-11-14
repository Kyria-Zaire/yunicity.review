"use client";

import type { VideosPortalTabId } from "@yunicity/utils";
import {
  VIDEOS_MOBILE_FILTERS_OPEN,
  VIDEOS_MOBILE_SEARCH_PLACEHOLDER,
  VIDEOS_MOBILE_SOUND_OFF,
  VIDEOS_MOBILE_SOUND_ON,
  VIDEOS_MOBILE_TAB_FOR_YOU,
  VIDEOS_MOBILE_VIEW_MENU_LABEL,
  VIDEOS_TAB_NEW,
  VIDEOS_TAB_TRENDING,
  formatVideosMobileFiltersButtonLabel,
  formatVideosMobileViewButtonLabel,
} from "@yunicity/utils";
import { ArrowLeft, Check, ChevronDown, Search, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from "react";

import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

/** Vues du fil immersif mobile (D-Q1) : Abonnements n'existe pas (VIDEO-REFONTE-L1). */
export const VIDEOS_MOBILE_FEED_VIEWS: readonly { id: VideosPortalTabId; label: string }[] = [
  { id: "all", label: VIDEOS_MOBILE_TAB_FOR_YOU },
  { id: "trending", label: VIDEOS_TAB_TRENDING },
  { id: "new", label: VIDEOS_TAB_NEW },
];

export function isVideosMobileFeedView(tab: VideosPortalTabId): boolean {
  return VIDEOS_MOBILE_FEED_VIEWS.some((view) => view.id === tab);
}

const pillClass = "flex h-[34px] items-center rounded-full bg-[rgba(17,24,39,0.6)] text-white";

type ViewSelectorProps = {
  tab: VideosPortalTabId;
  onTabChange: (tab: VideosPortalTabId) => void;
};

/** Sélecteur « Pour vous ▾ » (écran J) : menu de vues, au clavier comme au toucher. */
function ViewSelector({ tab, onTabChange }: ViewSelectorProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = VIDEOS_MOBILE_FEED_VIEWS.find((view) => view.id === tab) ?? VIDEOS_MOBILE_FEED_VIEWS[0]!;

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={formatVideosMobileViewButtonLabel(current.label)}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-11 items-center ${VIDEO_IMMERSIVE_FOCUS}`}
      >
        <span className={`${pillClass} gap-1 pl-3.5 pr-2.5 text-[15px] font-bold`}>
          {current.label}
          <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={VIDEOS_MOBILE_VIEW_MENU_LABEL}
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 top-[52px] z-40 flex w-[220px] flex-col rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(17,24,39,0.18)]"
        >
          {VIDEOS_MOBILE_FEED_VIEWS.map((view) => {
            const checked = view.id === current.id;
            return (
              <button
                key={view.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                onClick={() => {
                  close(true);
                  if (!checked) onTabChange(view.id);
                }}
                className={`flex min-h-12 items-center justify-between rounded-[10px] px-3 text-left text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                  checked ? "bg-[#EEF0FF] font-bold text-yunicity-primary" : "font-semibold text-neutral-900"
                }`}
              >
                {view.label}
                {checked ? <Check className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type VideosMobileFeedTopBarProps = {
  variant: "discovery" | "detail";
  tab: VideosPortalTabId;
  onTabChange?: (tab: VideosPortalTabId) => void;
  /** Son : absent quand aucune vidéo n'est affichée (états vide et erreur). */
  sound?: { isMuted: boolean; onToggle: () => void };
  /** F1 : pastille filtres (avant son et recherche). */
  filters?: {
    activeCount: number;
    open: boolean;
    onOpen: () => void;
    buttonRef?: Ref<HTMLButtonElement>;
  };
  /** R1 : pastille recherche. */
  search?: {
    open: boolean;
    onOpen: () => void;
    buttonRef?: Ref<HTMLButtonElement>;
  };
};

/**
 * Barre haute du fil immersif mobile v2.3 (écran A + F1) : pastilles sur voile 60 %,
 * cibles de 44 px. Découverte : sélecteur de vue ; lien partagé : retour aux vidéos.
 */
export function VideosMobileFeedTopBar({
  variant,
  tab,
  onTabChange,
  sound,
  filters,
  search,
}: VideosMobileFeedTopBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between pl-3 pr-1.5 [&>*]:pointer-events-auto">
      {variant === "detail" ? (
        <Link href="/videos" aria-label="Retour aux vidéos" className={`flex h-11 w-11 items-center justify-center ${VIDEO_IMMERSIVE_FOCUS}`}>
          <span className={`${pillClass} w-[34px] justify-center`}>
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      ) : onTabChange ? (
        <ViewSelector tab={tab} onTabChange={onTabChange} />
      ) : (
        <span />
      )}
      <div className="flex items-center">
        {filters ? (
          <button
            ref={filters.buttonRef}
            type="button"
            onClick={filters.onOpen}
            aria-expanded={filters.open}
            aria-haspopup="dialog"
            aria-label={formatVideosMobileFiltersButtonLabel(filters.activeCount)}
            className={`relative flex h-11 w-11 items-center justify-center ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <span className={`${pillClass} w-[34px] justify-center`}>
              <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
            </span>
            {filters.activeCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
                {filters.activeCount}
              </span>
            ) : (
              <span className="sr-only">{VIDEOS_MOBILE_FILTERS_OPEN}</span>
            )}
          </button>
        ) : null}
        {sound ? (
          <button
            type="button"
            onClick={sound.onToggle}
            aria-label={sound.isMuted ? VIDEOS_MOBILE_SOUND_ON : VIDEOS_MOBILE_SOUND_OFF}
            className={`flex h-11 w-11 items-center justify-center ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <span className={`${pillClass} w-[34px] justify-center`}>
              {sound.isMuted ? <VolumeX className="h-[18px] w-[18px]" aria-hidden /> : <Volume2 className="h-[18px] w-[18px]" aria-hidden />}
            </span>
          </button>
        ) : null}
        {search ? (
          <button
            ref={search.buttonRef}
            type="button"
            onClick={search.onOpen}
            aria-expanded={search.open}
            aria-haspopup="dialog"
            aria-label={VIDEOS_MOBILE_SEARCH_PLACEHOLDER}
            className={`flex h-11 w-11 items-center justify-center ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <span className={`${pillClass} w-[34px] justify-center`}>
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
