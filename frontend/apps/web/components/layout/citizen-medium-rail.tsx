"use client";

import Link from "next/link";

import { YunicityLogo } from "@/components/brand";
import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { NotificationBellIcon } from "@/components/layout/notification-bell-icon";
import { ExplorerTriggerButton } from "@/components/explorer";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import {
  CITIZEN_MEDIUM_RAIL_DESTINATIONS,
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
};

export function CitizenMediumRail({ activeDestination }: CitizenMediumRailProps) {
  const unreadCount = Number(useNotificationUnread());

  return (
    <aside
      data-citizen-medium-rail=""
      className="citizen-medium-rail citizen-medium-rail-only"
      aria-label="Navigation Yunicity"
    >
      <div className="flex justify-center px-2 pt-4">
        <Link href="/feed" aria-label="Yunicity" className="inline-flex items-center">
          <YunicityLogo />
        </Link>
      </div>

      {/* Groupe compact sous le logo — jamais réparti sur toute la hauteur. */}
      <nav
        data-citizen-medium-rail-nav=""
        aria-label="Navigation principale"
        className="mt-4 flex flex-col gap-0.5 px-1.5"
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

        {/* Actions de découverte : déclencheurs existants, aucun second overlay.
            Leur nom accessible vient du composant (« Explorer Reims », « Menu
            Yunicity ») ; le libellé visuel compact est donc `aria-hidden`. */}
        <div
          data-rail-label="Rechercher"
          data-citizen-medium-rail-control="search"
          className="flex flex-col items-center gap-1 rounded-xl py-1.5"
        >
          <ExplorerTriggerButton variant="medium-rail" />
          <span aria-hidden className={ACTION_LABEL}>
            Rechercher
          </span>
        </div>

        <div
          data-rail-label="Menu"
          data-citizen-medium-rail-control="menu"
          className="flex flex-col items-center gap-1 rounded-xl py-1.5"
        >
          {/* Le variant `sidebar` rend DÉJÀ l'icône Grid3x3 et le libellé « Menu »
              dans un bouton rond de 52 px : ajouter un second libellé ici serait
              un doublon. Seule la grammaire visuelle (icône noire sur pastille
              grise) est appliquée, en CSS depuis le rail. */}
          {/* C3-CITIZEN-MEDIUM-SHELL-R1B : variante DISTINCTE de la sidebar
              historique. Les deux instances ne se disputent plus l'hôte de la
              surface Menu, quel que soit l'ordre du DOM. */}
          {/* Apparence CONSTANTE. Le rail n'est rendu que lorsqu'il existe :
              il affirme donc le fait global sans le calculer. */}
          <CitizenYunicityMenu variant="medium-rail" mediumRailPresent />
        </div>
      </nav>

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
          className="flex flex-col items-center gap-1"
        >
          {/* C3-CITIZEN-MEDIUM-SHELL-R1E : le rail DECLARE sa surface. Sur
              `/videos`, elle seule expose « Créer » — mobile et desktop y
              restent geles sur leur comportement historique. */}
          <CreateHubTriggerButton
            variant="sidebar-icon"
            visibilitySurface="citizen-medium-rail"
            className="!h-11 !w-11"
          />
          <span aria-hidden className={ACTION_LABEL}>
            Créer
          </span>
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
          <span className="w-full text-center">{WEB_CITIZEN_NOTIFICATIONS_NAV.label}</span>
        </Link>

        <div
          data-citizen-medium-rail-account=""
          data-rail-label="Profil"
          data-citizen-medium-rail-control="profile"
        >
          <CitizenAccountMenu variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}
