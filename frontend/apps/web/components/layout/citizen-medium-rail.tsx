"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

import { YunicityLogo } from "@/components/brand";
import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { ExplorerTriggerButton } from "@/components/explorer";
import { NotificationBellIcon } from "@/components/layout/notification-bell-icon";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import { useScrollEdges } from "@/hooks/use-scroll-edges";
import type { ScrollEdges } from "@/lib/layout/rail-scroll-edges";
import {
  CITIZEN_MEDIUM_RAIL_DESTINATIONS,
  CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL,
  isCitizenMediumRailDestinationActive,
  type CitizenMediumRailDestination,
} from "@/lib/layout/citizen-medium-rail-contract";
import { WEB_CITIZEN_NOTIFICATIONS_NAV } from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";

/**
 * Rail vertical citoyen — bande medium 640 → 1279,98 px (C3-FEED-M2.4).
 *
 * ── Pourquoi ce composant existe ─────────────────────────────────────────────
 * `web-sidebar.tsx` est partagé par toutes les familles de pages. Sous `xl` il
 * répartit sa navigation en `min-h-full flex-1 justify-evenly`, masque les
 * libellés et masque son pied notifications/profil. Mesuré en C3-FEED-M1 :
 * navigation étalée sur 804 px à 640, 928 à 768, 1016 à 834 — d'où les
 * « énormes espaces » et la navigation éclatée. Corriger ce comportement DANS le
 * composant partagé aurait changé toutes les routes.
 *
 * ── Pourquoi ici et pas dans `packages/ui` ───────────────────────────────────
 * Ce rail dépend des routes Yunicity, des providers Explorer et Create Hub, du
 * Menu Yunicity, des notifications et du profil citoyen : ce n'est pas une
 * primitive sans domaine, c'est un composant applicatif.
 *
 * ── Portée ───────────────────────────────────────────────────────────────────
 * Validé visuellement par le CTO en C3-FEED-M2.3B, puis extrait tel quel : le
 * rendu est identique, seule son identité devient citoyenne plutôt que Feed. Il
 * n'est monté par aucune page automatiquement — chaque shell consommateur le
 * monte explicitement et déclare sa destination active.
 */

// Le contrat de navigation vit dans `lib/layout` : source unique, testable sans DOM.

/**
 * Disposition VERTICALE : icône centrée, libellé court dessous. Une disposition
 * icône + texte sur une seule ligne imposerait un rail large (208 px mesurés en
 * M2, soit 16 % du viewport à 1279). `min-h-14` garantit la cible de 44 px.
 */
const NAV_ITEM_BASE =
  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium leading-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/50";
const NAV_ITEM_IDLE = "text-neutral-700 hover:bg-neutral-100";
const NAV_ITEM_ACTIVE = "bg-yunicity-primary-soft text-yunicity-primary";

/** Libellé visuel compact sous un déclencheur qui porte déjà son nom accessible. */
const ACTION_LABEL = "text-[11px] font-medium leading-tight text-neutral-700";

/**
 * RAIL-SHORT-VIEWPORT-01 — repère « du contenu reste caché de ce côté ».
 *
 * Bande pleine (pas de dégradé : doctrine de marque) posée sur le bord du
 * conteneur défilant. Purement visuelle : `aria-hidden`, aucun focus, et
 * `pointer-events-none` pour que le clic atteigne le contrôle situé dessous.
 * Elle ne masque jamais un contrôle focalisé : le conteneur porte un
 * `scroll-padding` supérieur à sa hauteur (globals.css).
 */
function RailScrollCues({ edges }: { edges: ScrollEdges }) {
  return (
    <>
      {edges.above ? (
        <div
          aria-hidden="true"
          data-citizen-medium-rail-scroll-cue="top"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex h-4 items-center justify-center border-b border-neutral-200 bg-white text-neutral-600"
        >
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
      ) : null}
      {edges.below ? (
        <div
          aria-hidden="true"
          data-citizen-medium-rail-scroll-cue="bottom"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex h-4 items-center justify-center border-t border-neutral-200 bg-white text-neutral-600"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
      ) : null}
    </>
  );
}

export type { CitizenMediumRailDestination };

export type CitizenMediumRailProps = {
  /**
   * Destination principale mise en avant. Explicite plutôt que déduite du
   * `pathname` : une route peut appartenir à une famille sans que son préfixe le
   * dise, et le consommateur connaît son propre contexte. Omettre la prop est un
   * cas valide — aucune destination n'est alors active (Explorer, Tribus,
   * Passport…).
   */
  activeDestination?: CitizenMediumRailDestination;
  /** L'écran courant est une création (`/feed/new`) : « Créer » est actif. */
  createActive?: boolean;
};

export function CitizenMediumRail({ activeDestination, createActive = false }: CitizenMediumRailProps) {
  const unreadCount = Number(useNotificationUnread());
  // RAIL-SHORT-VIEWPORT-01 : deux conteneurs peuvent défiler, selon la hauteur
  // (globals.css). Au-dessus de 480 px : la navigation seule, le groupe du bas
  // reste fixe. Au-dessous : tout le rail. Chacun porte ses propres repères ;
  // celui qui ne défile pas n'en affiche aucun.
  const bodyScroll = useScrollEdges<HTMLDivElement>();
  const navScroll = useScrollEdges<HTMLElement>();

  return (
    <aside
      data-citizen-medium-rail=""
      className="citizen-medium-rail citizen-medium-rail-only"
      aria-label="Navigation Yunicity"
    >
      <div ref={bodyScroll.ref} data-citizen-medium-rail-body="">
        <div className="flex justify-center px-2 pt-4">
          <Link href="/feed" aria-label="Yunicity" className="inline-flex items-center">
            <YunicityLogo />
          </Link>
        </div>

        {/* Région de la navigation : porte les repères, qui restent fixes pendant
            que la navigation défile dessous. 14 px de marge + 2 px de marge
            interne = l'ancienne marge de 16 px : positions inchangées, et l'anneau
            de focus (`ring-2`) n'est plus découpé par le bord du défilement. */}
        <div data-citizen-medium-rail-nav-region="" className="mt-[14px]">
          {/* Groupe compact sous le logo — jamais réparti sur toute la hauteur. */}
          <nav
            ref={navScroll.ref}
            data-citizen-medium-rail-nav=""
            aria-label="Navigation principale"
            className="flex flex-col gap-0.5 px-1.5 py-0.5"
          >
            {CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((item) => {
              const active = isCitizenMediumRailDestinationActive(item.id, activeDestination);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-rail-label={item.label}
                  data-citizen-medium-rail-control={item.id}
                  aria-current={active ? "page" : undefined}
                  className={`w-full ${NAV_ITEM_BASE} ${active ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
                >
                  <WebNavIcon id={item.icon} className="h-5 w-5 shrink-0" />
                  <span className="w-full text-center">{item.label}</span>
                </Link>
              );
            })}

            {/*
                Accès Explorer du palier medium.

                Le MÊME déclencheur et le MÊME provider que partout ailleurs :
                `ExplorerTriggerButton` lit `useExplorerOptional`, donc le panneau
                ouvert ici est celui du reste de l'application. Aucun second panneau,
                aucune logique parallèle — la recherche du header du fil reste en
                place et ouvre la même primitive.

                RAIL-EXPLORER-LABEL-01 : variante `citizen-medium-rail`, icône +
                libellé « Explorer » visible, comme les autres contrôles. La variante
                `medium-rail` (icône seule, 52 px) reste celle de la colonne latérale
                historique — même séparation que pour le Menu (R1B).
            */}
            <div
              data-rail-label={CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL}
              data-citizen-medium-rail-control="explorer"
              className="flex flex-col items-center gap-1 rounded-xl py-1.5"
            >
              <ExplorerTriggerButton variant="citizen-medium-rail" />
            </div>

            <div
              data-rail-label="Menu"
              data-citizen-medium-rail-control="menu"
              className="flex flex-col items-center gap-1 rounded-xl py-1.5"
            >
              {/* Variante medium-rail : même grammaire que les autres items (icône +
                  libellé, sans pastille circulaire). */}
              {/* C3-CITIZEN-MEDIUM-SHELL-R1B : variante DISTINCTE de la sidebar
                  historique. Les deux instances ne se disputent plus l'hôte de la
                  surface Menu, quel que soit l'ordre du DOM. */}
              {/* Apparence CONSTANTE. Le rail n'est rendu que lorsqu'il existe :
                  il affirme donc le fait global sans le calculer. */}
              <CitizenYunicityMenu variant="medium-rail" mediumRailPresent />
            </div>
          </nav>
          <RailScrollCues edges={navScroll.edges} />
        </div>

        {/* Partie basse séparée : Créer, Notifications, Profil. Espacement régulier,
            et marge basse protégée par la safe area pour que le profil ne colle
            jamais au bord inférieur. */}
        <div
          data-citizen-medium-rail-footer=""
          className="mt-auto flex flex-col items-center gap-2 border-t border-neutral-200/80 px-1.5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {/* Cercle bleu + `+` blanc : `variant="sidebar-icon"` porte déjà ce rendu,
              son contrat d'ouverture est donc conservé tel quel. La cible passe de
              40 à 44 px (WCAG 2.5.5) sans toucher au composant partagé. */}
          <div
            data-rail-label="Créer"
            data-citizen-medium-rail-control="create"
            data-active={createActive ? "" : undefined}
            className={`flex flex-col items-center gap-1 ${
              createActive ? "w-full rounded-xl bg-yunicity-primary-soft py-2" : ""
            }`}
          >
            {/* C3-CITIZEN-MEDIUM-SHELL-R1E : le rail DECLARE sa surface. Sur
                `/videos`, elle seule expose « Créer » — mobile et desktop y
                restent geles sur leur comportement historique. */}
            <CreateHubTriggerButton
              variant="sidebar-icon"
              visibilitySurface="citizen-medium-rail"
              className="!h-11 !w-11"
            />
            <span
              aria-hidden
              className={createActive ? `${ACTION_LABEL} !font-semibold !text-yunicity-primary` : ACTION_LABEL}
            >
              Créer
            </span>
            {createActive ? <span className="sr-only">Page actuelle</span> : null}
          </div>

          <Link
            href={WEB_CITIZEN_NOTIFICATIONS_NAV.href}
            data-rail-label={WEB_CITIZEN_NOTIFICATIONS_NAV.label}
            data-citizen-medium-rail-control="notifications"
            className={`w-full ${NAV_ITEM_BASE} ${NAV_ITEM_IDLE}`}
          >
            <span className="relative inline-flex">
              <NotificationBellIcon unreadCount={unreadCount} />
            </span>
            {/* RAIL-SHORT-VIEWPORT-01 : sur un rail étroit (63 px de cible sur
                `/feed` à 640 px), « Notifications » ne tient pas sur une ligne.
                Il passe à la ligne avec une césure française (`lang="fr"`) ;
                `overflow-wrap: anywhere` garantit la coupure si le navigateur
                n'a pas de dictionnaire. Même police, même cible : la case
                grandit en hauteur seulement là où la coupure est nécessaire. */}
            <span className="w-full text-center hyphens-auto [overflow-wrap:anywhere]">
              {WEB_CITIZEN_NOTIFICATIONS_NAV.label}
            </span>
          </Link>

          <div
            data-citizen-medium-rail-account=""
            data-rail-label="Profil"
            data-citizen-medium-rail-control="profile"
          >
            <CitizenAccountMenu variant="sidebar" />
          </div>
        </div>
      </div>

      {/* Repères du rail entier : posés sur l'`aside`, qui ne défile pas. */}
      <RailScrollCues edges={bodyScroll.edges} />
    </aside>
  );
}
