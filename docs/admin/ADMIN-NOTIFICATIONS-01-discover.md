# ADMIN-NOTIFICATIONS-01 — DISCOVER
## Centre Notifications / Activité admin

| Champ | Valeur |
|-------|--------|
| **Phase** | DISCOVER |
| **Feature** | FEATURE-ADMIN-V2 |
| **Ticket** | ADMIN-NOTIFICATIONS-01 |
| **Prérequis** | ADMIN-SETTINGS-01B livré sur `main` (`c35c25e`) |
| **Date** | 2026-06-10 |
| **Statut** | Prêt review CTO — **aucun code, aucun commit** |

---

## 1. Résumé exécutif

Yunicity **ne dispose pas** aujourd’hui d’un centre Notifications / Activité staff. Les signaux opérationnels existent mais sont **fragmentés** :

- **7 tables `*_admin_actions`** append-only (audit par entité, timelines sur fiches détail)
- **Compteurs d’attention** cockpit/analytics (files pending, calculés à la volée)
- **Health/readiness** infra (`GET /ready`, snapshot settings)
- **Inbox citoyenne** (`user_notifications` + push Expo) — **hors scope staff**

Le cockpit affiche déjà un placeholder « Journal territorial bientôt disponible » (`cockpit-recent-activity.tsx`). Les settings listent `admin_notification_alerts` et `admin_email_digest` en **coming soon**.

**Recommandation CTO :** livrer en V1 un **centre unifié read-only** en deux panneaux conceptuels sur une route `/activity` :

| Panneau | Nature V1 | Source |
|---------|-----------|--------|
| **Alertes** | Files à traiter + santé dégradée | Agrégats cockpit + readiness (calculé) |
| **Activité** | Journal staff cross-domaine | UNION lecture seule sur `*_admin_actions` (+ entrées reports récents) |

**Pas de** websocket, polling agressif, push/email staff, table `admin_notifications`, ni marquage « lu » en V1.

| Bucket | Part estimée V1 |
|--------|-----------------|
| Alertes exploitables immédiatement (données existantes) | ~70 % |
| Activité staff (audit tables existantes) | ~80 % des domaines modération |
| Entrants temps réel (nouveau report → alerte) | Nécessite backend dédié ou requête live |
| Push / email / SLA / assignation | 0 % — hors V1 |

Le centre doit **orienter l’action** (CTA vers module filtré ou fiche détail), **documenter ce qui s’est passé**, et **ne jamais simuler** des événements fictifs — même doctrine que cockpit/analytics/settings.

---

## 2. Sources détectées

### 2.1 Tables d’audit staff persistées (`*_admin_actions`)

Pattern commun : `id`, `actor_user_id`, `action`, transitions `previous_*` / `new_*`, `reason`, `metadata` (JSONB), `created_at`. **Append-only. Aucune TTL documentée.**

| Table | Modèle | Actions | API GET timeline | UI admin timeline |
|-------|--------|---------|------------------|-------------------|
| `passport_admin_actions` | `models/passport_admin_action.py` | `suspend`, `reactivate` | `GET /admin/passports/{id}/actions` | `passport-detail-audit-section.tsx` |
| `partner_admin_actions` | `models/partner_admin_action.py` | `create_profile`, `activate`, `pause`, `upgrade_premium`, `update_settings` | **Absent** | **Absent** |
| `offer_admin_actions` | `models/offer_admin_action.py` | `approve`, `reject`, `archive` | `GET /admin/partner-offers/{id}/actions` | `offer-detail-audit-section.tsx` |
| `event_admin_actions` | `models/event_admin_action.py` | `approve`, `reject`, `cancel` | `GET /admin/local-events/{id}/actions` | `event-detail-audit-section.tsx` |
| `creator_content_admin_actions` | `models/creator_content_admin_action.py` | `approve`, `reject`, `archive` | `GET /admin/partner-creator-content/{id}/actions` | `creator-content-detail-audit-section.tsx` |
| `report_admin_actions` | `models/report_admin_action.py` | `dismiss`, `resolve`, `resolve_hide_post` | `GET /admin/reports/{id}/actions` | **Absent** (API OK) |
| `staff_admin_actions` | `models/staff_admin_action.py` | `assign_role`, `revoke_role`, `suspend`, `reactivate` | `GET /admin/staff/{user_id}/actions` | `staff-detail-audit-section.tsx` |

Constantes : `backend/app/core/{passport,partner,offer,event,creator_content,report,staff}_admin_constants.py`

**Rétention implicite :** CASCADE sur entité parente supprime l’audit ; `actor_user_id` SET NULL si user supprimé. PII possible dans `reason` (documenté ADMIN-08A).

### 2.2 Autres historiques persistés (non unifiés)

| Source | Modèle | Contenu | API admin | UI admin |
|--------|--------|---------|-----------|----------|
| `organization_verifications` | `models/organization.py` | Transitions vérification org | Review via `POST /organizations/{id}/review` | Onglet vérification — **pas de timeline** |
| `reports` | `models/report.py` | Signalements citoyens (`pending` → résolu) | `GET /admin/reports` | Workspace modération |
| `partner_leads` | `models/partner_lead.py` | Champs temporels CRM | `GET /partner-leads` | Timeline **synthétique client** (`partner-lead-360.ts`) |
| `tribe_moderation_logs` | `models/tribe.py` | Modération tribu | **Aucune** | **Aucune** |
| `passport_offer_redemptions.metadata.audit` | JSON embarqué | Scan succès/échec | Redemptions par offre/passport | Ops passport — pas feed staff |

### 2.3 Signaux calculés (non persistés comme événements)

| Source | Endpoint / composant | Signaux |
|--------|---------------------|---------|
| Cockpit attention | `GET /admin/cockpit/summary` → `AdminCockpitAttentionMetrics` | `offers_pending`, `creator_contents_pending`, `events_pending`, `reports_pending`, `partner_leads_open`, `organizations_pending_review` |
| Analytics attention | `GET /admin/analytics/summary` → `AdminAnalyticsAttention` | Pending modération + `pending_partner_verifications`, `open_leads` — **sans** `reports_pending` |
| Yunicity Signal | `admin-cockpit.ts` | Seuil intervention : `COCKPIT_SIGNAL_INTERVENTION_THRESHOLD = 6` |
| Passport Ops signal | `passport-ops-command.ts` | UX `empty` / `active` / `attention` (suspensions) |
| Passport agrégats | cockpit + analytics repos | Tampons, redemptions, activations période |
| Readiness infra | `GET /ready`, snapshot settings | DB + Redis → `ready` / `degraded` |
| Module activity (analytics) | `analytics-module-activity.tsx` | KPIs par module — **pas un journal** |

### 2.4 Infrastructure notifications (citoyen — référence pattern)

| Couche | Fichiers | État |
|--------|----------|------|
| In-app inbox | `user_notification.py`, `social_notification_service.py` | Opérationnel citoyen |
| Push Expo | `expo_push.py`, `notification_triggers.py` | Opérationnel citoyen |
| Email | — | **Absent** (`email_system_available: false`) |
| Admin alerts | `admin_platform_config` coming soon | **Absent** |

**Aucun trigger** staff documenté sur nouveau report ou contenu pending (confirmé ADMIN-07A).

### 2.5 UI admin existante (surfaces liées)

| Surface | Route | Rôle pour Notifications/Activité |
|---------|-------|----------------------------------|
| Cockpit attention | `/` | `cockpit-attention-panel.tsx` — liens files filtrées |
| Cockpit recent activity | `/` | **Placeholder** — raccourcis vers modules |
| Analytics operational health | `/analytics` | Donut files pending |
| Timelines par entité | `*/[id]` | Pattern mature 5/7 domaines |
| Settings | `/settings` | Readiness + coming soon alerts |

### 2.6 Documentation discovery connexe

| Doc | Apport |
|-----|--------|
| `docs/product-review/ADMIN-07A-MODERATION-DISCOVERY.md` | Pas de file centrale ; pas de notif staff |
| `docs/product-review/ADMIN-07D-RESOLVE-DISMISS-AUDIT-DISCOVERY.md` | Pattern audit reports |
| `docs/product-review/ADMIN-08A-STAFF-DISCOVERY.md` | Staff audit P1, risques PII |
| `docs/admin/ADMIN-SETTINGS-01-discover.md` | Audit tables = futur lien Activity ; alerts coming soon |

---

## 3. Taxonomie des notifications

Classification demandée : **Information** · **Alerte** · **Système**.

Légende priorités : **P0** critique · **P1** action requise · **P2** suivi · **P3** contexte.

### 3.1 Modération citoyenne

| Événement | Classe | Priorité | Acteur concerné | Conservation | CTA V1 |
|-----------|--------|----------|-----------------|--------------|--------|
| Nouveau signalement (`reports.status=pending`) | **Alerte** | P1 | Modérateur (`moderation.manage`) | Durée vie entité report | `/moderation?status=pending` ou `/moderation/{id}` |
| Signalement dismiss | **Information** | P3 | Modérateur | `report_admin_actions` + report | `/moderation/{id}` |
| Signalement resolve (+ hide post) | **Information** | P2 | Modérateur | idem | `/moderation/{id}` |

### 3.2 Modération contenus (offres, événements, créateurs)

| Événement | Classe | Priorité | Acteur | Conservation | CTA V1 |
|-----------|--------|----------|--------|--------------|--------|
| Offre / event / contenu → `pending_review` | **Alerte** | P1 | Modérateur | État entité | Module filtré (`?status=pending_review`) |
| Approve / reject / archive (audit) | **Information** | P2 | Modérateur | `*_admin_actions` | Fiche détail + section audit |
| Event cancel staff | **Information** | P2 | Modérateur | `event_admin_actions` | `/events/{id}` |

### 3.3 Partenaires & CRM

| Événement | Classe | Priorité | Acteur | Conservation | CTA V1 |
|-----------|--------|----------|--------|--------------|--------|
| Organisation en attente vérification | **Alerte** | P1 | Modérateur / city admin | `organizations.verification_status` | `/partners` (filtre pending) |
| Transition vérification org (historique) | **Information** | P2 | Staff review | `organization_verifications` | `/partners/organizations/{id}` |
| Action partenaire (activate, pause, premium…) | **Information** | P2 | Staff terrain | `partner_admin_actions` | `/partners/organizations/{id}` |
| Lead `new` / pipeline ouvert | **Alerte** | P2 | Staff terrain | `partner_leads` | `/partner-leads?status=new` |
| Lead contact / conversion / archivage | **Information** | P3 | Staff terrain | Champs temporels lead | `/partner-leads/{id}` |

### 3.4 Passport Ops

| Événement | Classe | Priorité | Acteur | Conservation | CTA V1 |
|-----------|--------|----------|--------|--------------|--------|
| Passeport suspendu / réactivé (audit) | **Information** | P2 | Modérateur | `passport_admin_actions` | `/passport-ops/{id}` |
| Activation citoyen | **Information** | P3 | — (signal ops) | `passports.activated_at` | `/passport-ops` |
| Tampon QR / partenaire | **Information** | P3 | — | `passport_stamps` | `/passport-ops/{id}` |
| Redemption offre | **Information** | P3 | — | `passport_offer_redemptions` | Ops offre/passport |
| Montée de niveau passport | **Information** | P3 | Citoyen (notifié) | `passport_tier_events` | Hors centre V1 |

### 3.5 Staff & gouvernance

| Événement | Classe | Priorité | Acteur | Conservation | CTA V1 |
|-----------|--------|----------|--------|--------------|--------|
| Attribution / retrait rôle | **Information** | P1 | `system.admin` | `staff_admin_actions` | `/staff/{id}` |
| Suspension / réactivation compte staff | **Alerte** | P0 | `system.admin` | `staff_admin_actions` | `/staff/{id}` |

### 3.6 Tribus (hors périmètre admin V1)

| Événement | Classe | Priorité | Acteur | Conservation | CTA |
|-----------|--------|----------|--------|--------------|-----|
| exclude_member, remove_post, archive_tribe… | **Information** | P2 | Modérateur tribu | `tribe_moderation_logs` | **Non exposé admin** |

### 3.7 Système & attention agrégée

| Événement | Classe | Priorité | Acteur | Conservation | CTA V1 |
|-----------|--------|----------|--------|--------------|--------|
| Readiness dégradé (DB/Redis error) | **Système** | P0 | `system.admin` | Éphémère (check live) | `/settings` section Système |
| Total attention ≥ 6 (Yunicity Signal intervention) | **Système** | P1 | Modérateur | Éphémère | Cockpit + liens files |
| File pending > seuil module (`MODERATION_ATTENTION_THRESHOLD=5`) | **Alerte** | P1 | Modérateur | Éphémère | Module concerné |
| Analytics période — pics tampons/redemptions | **Information** | P3 | — | Éphémère | `/analytics` |

---

## 4. Timeline V1 recommandée

Proposition d’**ordre d’affichage** du journal Activité (plus récent en haut), **sans inventer d’événements** :

```
[now] ─────────────────────────────────────────────────────────────► [past]

┌─ ALERTES ACTIVES (panneau fixe, non chronologique) ─────────────────┐
│  • Signalements pending (N)                                         │
│  • Offres / Events / Contenus pending_review                        │
│  • Organisations à vérifier                                         │
│  • Leads ouverts                                                    │
│  • [Si degraded] Santé infra                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─ ACTIVITÉ STAFF (feed paginé, UNION *_admin_actions) ───────────────┐
│  Il y a 2 min  · Modération · resolve report #abc        → /moderation/abc
│  Il y a 15 min · Offre · approve « -20% café »         → /passport-offers/xyz
│  Il y a 1 h    · Staff · assign_role SUPER_ADMIN       → /staff/user-id
│  Il y a 3 h    · Partenaire · activate « Boulangerie » → /partners/org-id
│  …                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Granularité V1 :** regrouper par **action staff explicite** (ligne audit), pas par micro-événement citoyen (tampon unitaire).

**Entrants « nouveau pending » :** en V1, représentés comme **alertes** (compteur + lien), pas comme ligne d’activité distincte — sauf **nouveau report** si requête `reports ORDER BY created_at` incluse dans le feed (recommandé).

---

## 5. Alertes V1 recommandées

Alertes = **état à traiter maintenant**, dérivées de données existantes.

| ID | Alerte | Source | Seuil UX | Badge | CTA |
|----|--------|--------|----------|-------|-----|
| A1 | Signalements en attente | `cockpit.attention.reports_pending` | > 0 → visible | Alerte | `/moderation?status=pending` |
| A2 | Offres en revue | `offers_pending` | > 0 | Alerte | `/passport-offers?status=pending_review` |
| A3 | Événements en revue | `events_pending` | > 0 | Alerte | `/events?status=pending_review` |
| A4 | Contenus créateurs en revue | `creator_contents_pending` | > 0 | Alerte | `/creator-content?status=pending_review` |
| A5 | Organisations à vérifier | `organizations_pending_review` | > 0 | Alerte | `/partners` (filtre verification) |
| A6 | Leads ouverts | `partner_leads_open` | > 0 | Alerte | `/partner-leads` |
| A7 | Intervention territoriale | `cockpitAttentionTotal ≥ 6` | ≥ 6 | Système | Cockpit + détail files |
| A8 | Infra dégradée | `platform-config.system.readiness.status=degraded` | DB ou Redis error | Système | `/settings` |
| A9 | Passeports suspendus récents | Liste passport ops (filtre) | > 0 en attention | Alerte | `/passport-ops` |

**Exclues alertes V1 :** SLA dépassé, assignation modérateur, récidive, volume tampons anormal (analytics only).

---

## 6. Événements système V1

| ID | Événement | Détection V1 | Affichage | Persistence future |
|----|-----------|--------------|-----------|-------------------|
| S1 | Readiness `degraded` | Snapshot settings ou `/ready` au chargement page | Bandeau Système | Optionnel : log `system_health_events` V2 |
| S2 | Yunicity Signal `intervention` | Calcul frontend depuis cockpit summary | Bandeau + lien cockpit | Non |
| S3 | Environnement non-prod | `platform-config.system.environment` | Badge discret Information | Non |
| S4 | Stripe non configuré | `business.stripe_configured=false` | Information settings-linked | Non |
| S5 | Email admin indisponible | `notifications.email_system_available=false` | Information | Non |

**Pas de** logs applicatifs structurés (`stamp_qr_claim`, `scan_redeem_success`) dans le centre V1 — volume trop élevé, PII (`client_ip` dans metadata redemption).

---

## 7. Permissions

### 7.1 Lecture centre Notifications / Activité

| Permission | Rôle typique | Accès |
|------------|--------------|-------|
| `moderation.manage` | MODERATOR | Alertes modération + activité modération/staff limitée |
| `system.admin` | SUPER_ADMIN | Tout + événements staff RBAC + santé système |

**Recommandation :** même garde que cockpit/analytics/settings — `require_any_permission("moderation.manage", "system.admin")`.

### 7.2 Filtrage par sensibilité

| Donnée | MODERATOR | SUPER_ADMIN |
|--------|-----------|-------------|
| Audit modération (reports, offers, events, creators) | ✅ | ✅ |
| Audit passport suspend | ✅ | ✅ |
| Audit staff (roles, suspend) | ❌ ou masqué | ✅ |
| Readiness / environnement | ✅ lecture | ✅ |
| PII dans `reason` audit | Afficher avec prudence — pas de export V1 | idem |

**Pas de permission `notifications.read`** en V1 — éviter prolifération RBAC avant maturité produit.

### 7.3 Actions (CTA)

Les CTA **naviguent** vers modules existants ; le centre V1 **ne déclenche aucune mutation**.

---

## 8. Architecture recommandée

### 8.1 Principes

1. **Read-only V1** — informer et orienter, pas notifier en push.
2. **Deux sources distinctes** — Alertes (état) vs Activité (historique append-only).
3. **Pas de websocket / polling** en V1 — chargement à l’ouverture de page + bouton « Actualiser » manuel (pattern analytics/settings).
4. **Pas de table `admin_notifications`** en V1 — éviter double écriture et sync.
5. **Réutiliser** patterns analytics : hook, loading/error/empty, cartes `#E7EAF3`.

### 8.2 Option A — V1 minimal (frontend-only, déconseillée)

Remplacer le placeholder cockpit par liens statiques enrichis. **Rejetée** : ne satisfait pas « centre » unifié ni journal cross-domaine.

### 8.2 Option B — V1 recommandée (backend feed read-only)

```
┌─────────────────────────────────────────────────────────────┐
│  GET /api/v1/admin/activity/summary   (alertes + counts)    │
│    ← réutilise logique cockpit.attention + readiness       │
├─────────────────────────────────────────────────────────────┤
│  GET /api/v1/admin/activity/feed?page&limit&domain?        │
│    ← UNION ALL normalisé sur *_admin_actions + reports      │
│      (vue SQL ou requêtes service + merge sort)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  /activity — ActivityPage                                   │
│    ├─ ActivityAlertsPanel (A1–A9)                           │
│    ├─ ActivityFeedList (paginé)                             │
│    └─ ActivityReadonlyFooter                                │
└─────────────────────────────────────────────────────────────┘
```

**Schéma item feed normalisé (proposition) :**

```typescript
{
  id: string;              // "{domain}:{uuid}"
  domain: "report" | "offer" | "event" | "creator" | "passport" | "partner" | "staff";
  event_type: "admin_action" | "report_created";
  action: string;
  actor_user_id: string | null;
  actor_display: string | null;  // email tronqué — pas de PII extra
  entity_id: string;
  entity_label: string | null;   // titre offre, org name — best effort
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  cta_href: string;
}
```

### 8.3 Option C — V2 (backend dédié)

Table append-only `admin_activity_events` alimentée dans les services à l’écriture (outbox pattern) :

- Élimine UNION coûteux
- Permet « marquer lu », assignation, digest email
- Prérequis : idempotence, rétention, migration

**Décision :** Option B pour 01B ; Option C si volume ou latence UNION > 200 ms p95 en recette.

### 8.4 Navigation

| Emplacement | Label | Groupe |
|-------------|-------|--------|
| `/activity` | Activité | **Pilotage** (après Analytics) |

Remplacer le placeholder `CockpitRecentActivity` par lien « Voir tout l’activité → `/activity` ».

---

## 9. Périmètre V1

### Inclus

- [ ] Route admin `/activity` (ou `/notifications` alias redirect — **préférer `/activity`** pour coller placeholder cockpit)
- [ ] Panneau **Alertes** (6 files cockpit + readiness + signal intervention)
- [ ] Feed **Activité staff** paginé (UNION 6–7 tables audit + créations reports récentes)
- [ ] Badges Information / Alerte / Système
- [ ] CTA vers fiches/modules existants
- [ ] États loading / error / empty (« Aucune activité staff récente »)
- [ ] Actualisation manuelle (pas polling)
- [ ] Garde RBAC staff
- [ ] Tests backend feed + anti-PII/secrets
- [ ] Typecheck + build admin

### Livrable immédiat vs backend dédié

| Capacité | Immédiat (Option B) | Backend dédié (V2) |
|----------|---------------------|-------------------|
| Alertes files pending | ✅ Réutilise cockpit repo | Cache optionnel |
| Journal audit cross-domaine | ✅ UNION lecture | Table outbox |
| Partner audit timeline | ✅ Inclure dans UNION | idem |
| Report created as feed item | ✅ Query reports | Event insert |
| Marquer alerte lue | ❌ | ✅ |
| Push / email staff | ❌ | ✅ |
| WebSocket temps réel | ❌ | Optionnel V3 |
| Tribe moderation | ❌ | ✅ si scope admin tribu |

---

## 10. Hors périmètre V1

| Exclusion | Raison |
|-----------|--------|
| WebSocket / SSE | Ticket DISCOVER ; complexité infra |
| Polling automatique | Charge + bruit UX |
| Push Expo staff | Pas de modèle device staff |
| Email / digest (`admin_email_digest`) | Pas de service email |
| Table `admin_notifications` + PATCH read | Double source vérité |
| Marquer lu / archiver / snooze | Nécessite persistence dédiée |
| Assignation modérateur, SLA, escalade | ADMIN-07A V2 |
| Notifications citoyen dans admin | Confusion produit |
| Tampons/redemptions unitaires dans feed | Volume + bruit |
| Logs structurés app (`stamp_qr_claim`) | PII + non métier staff |
| Tribe moderation logs | Pas d’API admin tribu |
| Export CSV audit | PII + ticket séparé |
| IA résumé activité | Hors pilote Reims |

---

## 11. Risques

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Exposition PII dans feed (`reason`, email actor) | **Élevée** | Tronquer reason ; masquer emails ; tests anti-fuite |
| UNION SQL lent sur gros volumes | Moyenne | Index `created_at` ; limit 50 ; pagination ; matérialized view V2 |
| Doublon alertes cockpit vs activity | Faible | Une source backend `activity/summary` partagée |
| Confusion Notifications citoyen vs admin | Moyenne | Label « Activité staff » ; route `/activity` |
| Feed incomplet (partner audit sans API aujourd’hui) | Moyenne | UNION inclut `partner_admin_actions` côté service |
| Fausse impression temps réel | Moyenne | Copy « Dernière actualisation » + pas de polling |
| Audit CASCADE = trou historique | Faible | Documenter ; event sourcing V2 si besoin compliance |
| Moderator voit actions staff sensibles | **Élevée** | Filtrer domaine `staff` si rôle ≠ SUPER_ADMIN |

---

## 12. BUILD recommandé

### Décision CTO proposée

**GO conditionnel** — centre Activité V1 read-only, Option B.

### Découpage tickets

| Ticket | Objectif | Backend | Frontend |
|--------|----------|---------|----------|
| **ADMIN-NOTIFICATIONS-01B** | Feed activité + summary alertes | `GET /admin/activity/summary`, `GET /admin/activity/feed` | Page `/activity`, alertes + feed |
| **ADMIN-NOTIFICATIONS-01C** | Fermeture UX cockpit | — | Remplacer placeholder `CockpitRecentActivity` ; nav Pilotage |
| **ADMIN-NOTIFICATIONS-02** (V2) | Outbox + lu/non-lu + digest | Table `admin_activity_events` | Cloche header, préférences |

### ADMIN-NOTIFICATIONS-01B — détail BUILD

| Étape | Livrable |
|-------|----------|
| 1 | Schemas `AdminActivitySummary`, `AdminActivityFeedItem`, params pagination/filtre `domain` |
| 2 | `AdminActivityRepository` — UNION normalisé + query reports récents `pending`/`created` |
| 3 | `AdminActivityService` — enrichissement labels entité (best effort, N+1 évité batch) |
| 4 | Routes + guard RBAC + filtre staff domain |
| 5 | Types TS + API util + hook `useAdminActivity` |
| 6 | Composants : `activity-page`, `activity-alerts-panel`, `activity-feed-list`, states |
| 7 | Nav `/activity` + titre shell |
| 8 | Tests : 401/403/200, structure feed, pas de secrets, staff items masqués moderator |
| 9 | Security review checklist |

### Critères d’acceptation 01B

- [ ] `GET /admin/activity/summary` — alertes alignées cockpit
- [ ] `GET /admin/activity/feed` — pagination, tri `created_at DESC`
- [ ] Domains : report, offer, event, creator, passport, partner, staff (staff filtré RBAC)
- [ ] Page `/activity` — alertes + feed + footer read-only
- [ ] Aucun websocket/polling/marquer lu
- [ ] CTA fonctionnels vers routes admin existantes
- [ ] `pytest` + typecheck + build admin OK

### Ordre d’exécution

```
01 DISCOVER (ce doc) → 01B Backend feed → 01B Frontend page → 01C Cockpit link → VERIFY CTO
```

### Anti-patterns à refuser

- Feed mocké ou items fictifs « pour remplir »
- Polling 30s silencieux
- Cloche avec badge hardcodé
- Dupliquer cockpit counts dans composants sans API summary
- Exposer `metadata` audit complet sans whitelist

---

## Annexe — Mapping route CTA

| Domain | CTA pattern |
|--------|-------------|
| report | `/moderation/{id}` |
| offer | `/passport-offers/{id}` |
| event | `/events/{id}` |
| creator | `/creator-content/{id}` |
| passport | `/passport-ops/{id}` |
| partner | `/partners/organizations/{organization_id}` |
| staff | `/staff/{user_id}` |

---

**ADMIN-NOTIFICATIONS-01 DISCOVER terminé — prêt review CTO**
