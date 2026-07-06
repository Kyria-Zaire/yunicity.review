# ADMIN-05D-C3 — Revue UX publique (événements annulés)

**Phase BMAD :** MEASURE / ANALYZE (revue read-only)  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-05 Events  
**Ticket :** ADMIN-05D-C3-EVENT-CANCEL-PUBLIC-UX  
**Date :** 2026-06-04  
**Statut :** Revue terminée — **aucun commit** (discovery / recommandation)

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-05D-C1 Cancel backend | ✅ mergé (`ca76432`) |
| ADMIN-05D-C2 Cancel UI admin | ✅ mergé (`fcfb5d0`) |

**Base auditée :** `main` post-merge PR #52.

**Références :**

- `docs/product-review/ADMIN-05D-C-CANCEL-LIFECYCLE-DISCOVERY.md`
- Tests backend : `backend/tests/test_admin_local_event_cancel_api.py` (public 410, map, feed)

---

## 1. Synthèse exécutive

| Zone | Backend | Frontend web | Verdict |
|------|---------|--------------|---------|
| Listes / agenda / sortir | ✅ Filtre `!is_cancelled` | ✅ Filtres défensifs utils | **OK** |
| Carte | ✅ `list_public_in_bbox` | ✅ Filtre client map | **OK** |
| Recherche | ✅ `search_events` | ✅ Filtre explorer | **OK** |
| Feed | ✅ `Post.is_active = false` | ✅ Filtres `is_active` + `!is_cancelled` | **OK** |
| Pages partenaires publiques | ✅ `list_public_for_partner_org` | ✅ `partner-portal` / `partner-detail` | **OK** |
| Détail public `/events/[id]` | ✅ **410** `EVENT_CANCELLED` | ⚠️ UX générique | **Polish recommandé** |
| Liens partagés / deep links carte | ✅ API 410 | ⚠️ Message générique | **Polish mineur** |
| Portail partenaire org (`/organizations/me/partner/events`) | N/A (gestion org) | Affiche « · Annulé » | **OK V1** (hors scope public) |

**Recommandation CTO : option B — petit polish UX web** (1 ticket court, sans backend ni migration).

Le pipeline **masquage + feed inactif** est **déjà correct**. Le seul écart produit notable : le détail public **n’exploite pas** le 410 ni le message API « Cet événement a été annulé. »

**Clôture ADMIN-05 Events :** possible **immédiatement** si le CTO accepte le copy générique actuel ; sinon **après polish B** (~0,5–1 j).

---

## 2. Méthode

Inspection statique du code backend (`local_event_service`, repositories, `feed_event_sync`, `search_repository`) et frontend web (`use-event-detail-context`, map, search, feed, partners).

Recoupement avec tests d’intégration C1 :

- `test_public_event_detail_returns_410_when_cancelled`
- `test_cancel_deactivates_feed_post`
- `test_map_excludes_event_after_staff_cancel`
- `test_event_map.py` : `test_map_events_excludes_cancelled_and_pending`

Pas de session manuelle navigateur dans ce ticket (recommandée en recette C3-build si polish B).

---

## 3. Réponses aux questions de vérification

### 3.1 Détail public — `GET /api/v1/events/{id}`

**Backend** (`LocalEventService._require_public_event`) :

- `moderation_status != approved` → **404** `EVENT_NOT_FOUND`
- `is_cancelled == true` → **410** `EVENT_CANCELLED`, detail : *« Cet événement a été annulé. »*

**Frontend** (`use-event-detail-context.ts`) :

- `api.events.getEvent` en échec → `catch` générique → `error = true`, `event = null`
- **Aucune branche** sur `status === 410` ni `code === EVENT_CANCELLED`
- `EventDetailScreen` affiche toujours le bloc rouge avec le libellé statique `EVENT_DETAIL_NOT_FOUND` : *« Ce moment n’est pas disponible. »* (`event-detail-labels.ts`)

**Ce que voit l’utilisateur aujourd’hui :**

- Pas de JSON brut ni page Next d’erreur technique
- Une **carte d’erreur rouge** identique à un 404 / erreur réseau
- **Pas** de mention explicite d’annulation (alors que l’API la fournit)

| Sévérité | P2 — cohérence produit / confiance |
|----------|-------------------------------------|
| Acceptable MVP ? | Oui (pas de fuite de contenu) |
| Aligné discovery 410 ? | Partiellement (statut HTTP oui, copy dédiée non) |

### 3.2 Feed

**Backend cancel (C1)** : `FeedEventSyncService.upsert_event_post` → `is_active = approved && !is_cancelled` → **false** après cancel.

**Lecture feed** : `PostRepository` filtre `Post.is_active.is_(True)` sur les requêtes feed.

**Frontend** : `feed-portal.ts`, `use-feed-portal-context` — filtres `!e.is_cancelled` sur les agrégations d’événements côté client (défense en profondeur).

**Verdict :** ✅ Pas de régression attendue ; post disparaît des lectures feed actives.

### 3.3 Carte

**Backend** : `list_public_in_bbox` exclut `is_cancelled`.

**Test** : `test_map_excludes_event_after_staff_cancel` (API cancel → marker absent du bbox).

**Frontend** : `use-map-page-context.ts` filtre `!event.is_cancelled` ; `map-live-discovery.ts` idem.

**Deep link** `?event={id}` sur carte : si événement annulé, `getEvent` échoue → notice *« Le moment demandé est indisponible actuellement. »* (générique, acceptable).

**Verdict :** ✅

### 3.4 Recherche

**Backend** : `search_repository.search_events` → `LocalEvent.is_cancelled.is_(False)`.

**Frontend** : `use-search-explorer-context.ts`, `search-explorer.ts`, `search-explorer-portal.ts` filtrent `!is_cancelled`.

**Verdict :** ✅

### 3.5 Pages partenaires (citoyen)

**API** `GET /api/v1/partners/{slug}/events` → `list_public_for_partner_org` avec `!is_cancelled`.

**UI** `partner-detail-screen.tsx` consomme cette API ; pas d’affichage d’événements annulés sur la fiche publique partenaire.

**Verdict :** ✅

### 3.6 Portail partenaire organisation (gestion)

`partner-portal-events.tsx` : liste **tous** les statuts org ; suffixe ` · Annulé` si `is_cancelled`. Filtres d’actions (soumettre, etc.) excluent déjà les annulés.

Hors périmètre « public citoyen » — comportement **cohérent V1** (le partenaire voit l’historique annulé, le citoyen non).

### 3.7 Liens partagés

- URL `/events/{uuid}` partagée avant cancel → après cancel : **410** côté API, UI **« non disponible »** (cf. §3.1)
- Pas de cache SSR du détail (page client `EventDetailScreen`)
- Intérêt / saved : `list_saved_for_user` exclut `is_cancelled` ; toggle intérêt sur event cancel → 410 (comportement sain)

| Sévérité | P3 pour liens — message pourrait être plus explicite |
|----------|------------------------------------------------------|

---

## 4. Matrice régressions

| Scénario | Attendu discovery | Observé code | Test auto |
|----------|-------------------|--------------|-----------|
| Event approved visible | Listé partout public | ✅ | Partiel (map, list) |
| Staff cancel | `is_cancelled`, audit, feed off | ✅ C1 | ✅ cancel API |
| Détail public post-cancel | 410 `EVENT_CANCELLED` | ✅ API | ✅ `test_public_event_detail_returns_410` |
| UI détail post-cancel | Message annulation clair | ⚠️ Copy générique | ❌ pas de test web |
| Feed | Post inactif / absent | ✅ | ✅ `test_cancel_deactivates_feed_post` |
| Map | Absent | ✅ | ✅ map cancel + seed cancelled |
| Search | Absent | ✅ | Filtre repo (pas de test dédié cancel) |
| Partner public | Absent | ✅ | Filtre repo |

**Aucune régression bloquante** identifiée sur masquage ou feed.

---

## 5. Problèmes trouvés

| ID | Problème | Sévérité | Correctif |
|----|----------|----------|-----------|
| C3-UX-01 | Détail web ne distingue pas 410 annulé vs 404 / erreur | **P2** | Option B |
| C3-UX-02 | Carte deep-link : message générique (même cause) | **P3** | Optionnel (même helper) |
| C3-UX-03 | Ton UI erreur rouge pour un retrait métier légitime | **P3** | État « retiré » neutre (stone/amber) vs `rose-50` |

**Non problèmes (confirmés OK) :**

- Double affichage feed (inactif + filtre lecture)
- Cancelled visible sur fiche partenaire publique
- Uncancel / partner cancel (hors scope, absent)

---

## 6. Recommandation CTO

### Option retenue : **B — Petit polish UX web**

**Justification :**

- Le **socle technique** (C1 + lectures existantes) est **complet et testé**
- L’écart est **purement présentation** sur `/events/[id]` (et optionnellement map deep-link)
- Effort faible, risque faible, pas de migration ni de changement admin/passport/offers

**Option A (aucun code)** — acceptable si :

- Le copy volontairement vague *« Ce moment n’est pas disponible »* est une décision produit (confidentialité, pas de confirmation d’annulation publique)

**Option C (correctif large)** — **non justifié** : pas de faille masquage, pas de refactor multi-surfaces requis.

---

## 7. Correctifs proposés (si GO option B)

**Périmètre minimal — ticket suggéré `ADMIN-05D-C3b` ou suite C3 BUILD :**

| Fichier | Action |
|---------|--------|
| `frontend/packages/utils/src/event-detail-labels.ts` | `EVENT_DETAIL_CANCELLED`, `EVENT_DETAIL_CANCELLED_HINT` |
| `frontend/packages/utils/src/event-detail.ts` | helper `isEventCancelledError(err)` |
| `frontend/apps/web/hooks/use-event-detail-context.ts` | États `cancelled` vs `notFound` vs `error` ; utiliser `isAuthError` + code/status |
| `frontend/apps/web/components/events/event-detail-screen.tsx` | Bloc UI dédié annulé (ton neutre, lien retour `/sortir`) |
| `frontend/apps/web/components/map/event-map-screen.tsx` | *(optionnel P3)* notice si `EVENT_CANCELLED` |

**Hors scope :**

- Backend (déjà conforme)
- Admin (C2 livré)
- Tests E2E Playwright (nice-to-have ; test unitaire helper suffit)

**Estimation :** 0,5–1 jour dev + vérif recette manuelle (cancel → lien partagé → feed/map/search).

---

## 8. Plan de tests (recette)

1. Créer / approuver un événement public Reims avec coords
2. Vérifier présence : `/sortir`, feed, carte, recherche (titre unique)
3. Admin : annuler avec motif
4. Vérifier absence listes / carte / recherche / feed
5. Ouvrir `/events/{id}` (lien partagé) → **410** + copy annulation (après B) ou copy générique (état A)
6. Partner public `/partners/{slug}` → événement absent
7. Portail org → événement visible avec « Annulé »

---

## 9. Décision clôture ADMIN-05 Events

| Choix CTO | Action |
|-----------|--------|
| **A** — copy générique suffisant | **Clôturer ADMIN-05 Events** maintenant, doc C3 = trace MEASURE |
| **B** — polish 410 web | Merger petit PR C3b puis **clôturer ADMIN-05 Events** |

**Recommandation rédaction :** **B** pour alignement avec le message admin (dialog C2 annonce explicitement le 410) et réduction du support « bug / app en panne ».

---

## 10. Suite

- **ADMIN-06 Creators** — débloqué après décision clôture Events
- Pas de **uncancel**, pas de **partner cancel** dans cette trajectoire

---

*Document généré en revue read-only — ne pas committer sans validation CTO.*
