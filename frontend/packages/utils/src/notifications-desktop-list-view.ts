import type { UserNotificationItem } from "@yunicity/types";

import {
  groupNotificationDesktopRows,
  hasNotificationDesktopEarlierItems,
  type NotificationsDesktopGroupedSection,
  type NotificationsDesktopRow,
} from "./notifications-desktop-presenter";

export type NotificationsDesktopListView =
  | { kind: "empty" }
  | {
      kind: "list";
      sections: NotificationsDesktopGroupedSection[];
      /** Le bouton « Afficher les notifications précédentes » est offert. */
      canLoadEarlier: boolean;
    };

/**
 * Ce que la liste de notifications affiche, aux trois paliers web (NOTIF-DESKTOP-EARLIER-01).
 *
 * Les notifications « Plus tôt » (7 jours et au-delà, ou date illisible) restent repliées
 * derrière un bouton tant qu'une section récente existe. Quand les filtres retiennent des
 * notifications mais qu'AUCUNE n'est récente, elles sont dépliées d'office : sinon la vue
 * rendait un faux état vide, sans le bouton, alors que le compteur annonçait des non-lues.
 *
 * `rows` et `items` sont la liste DÉJÀ filtrée (onglet, type) : l'état vide n'est rendu que
 * quand il n'y a réellement rien à montrer — boîte vide ou filtre sans résultat.
 */
export function resolveNotificationDesktopListView(
  rows: NotificationsDesktopRow[],
  items: UserNotificationItem[],
  options: { showEarlier: boolean },
): NotificationsDesktopListView {
  if (rows.length === 0) return { kind: "empty" };

  const sections = groupNotificationDesktopRows(rows, items, { includeEarlier: options.showEarlier });
  if (sections.length > 0) {
    return {
      kind: "list",
      sections,
      canLoadEarlier: !options.showEarlier && hasNotificationDesktopEarlierItems(items),
    };
  }

  return {
    kind: "list",
    sections: groupNotificationDesktopRows(rows, items, { includeEarlier: true }),
    canLoadEarlier: false,
  };
}
