# PRD-XXX — NOM DE LA FEATURE

> Copier : `docs/prd/PRD-XXX-nom-feature.md` — workflow : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — gates BUILD : §13 + `docs/bmad/BMAD.md`.

## 0. Métadonnées

| Champ | Valeur |
|---|---|
| ID | PRD-XXX |
| Nom | Nom de la feature |
| Statut | DISCOVER / DESIGN / BUILD / VERIFY / RELEASE |
| Phase BMAD | — / BUILD / (VERIFY) / MEASURE / ANALYZE / DECIDE |
| Priorité | P0 / P1 / P2 |
| Auteur | |
| Owner technique | |
| Date création | YYYY-MM-DD |
| Dernière mise à jour | YYYY-MM-DD |
| Sprint cible | |
| Environnement cible | dev / recette / preprod / prod |

### Workflow officiel (résumé)

```
Idea → PRD → Architecture → BUILD → Tests → Security Review
  → MEASURE → ANALYZE → DECIDE → Merge → dev → recette → preprod → prod
```

Voir `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`.

### Phases PRD

| Statut | Phase | Outputs clés |
|--------|-------|--------------|
| DISCOVER | Comprendre | PRD, scope, stories, risques |
| DESIGN | Concevoir | Archi §6, UX §5, sécurité §7 |
| BUILD | Implémenter | Code, tests, migrations |
| VERIFY | Vérifier | QA, tests, review sécu, review CTO |
| RELEASE | Déployer | Monitoring, rollback, DECIDE §13 |

---

# 1. Résumé Produit

## Objectif

Décrire clairement le problème résolu.

## Pourquoi cette feature existe

- Problème utilisateur :
- Problème business :
- Impact attendu (métrique ou comportement) :

## Résultat attendu

Décrire l’état final observable.

Exemples :

- Un utilisateur peut rejoindre une tribu locale.
- Un partenaire peut publier une offre.
- Un admin peut modérer un contenu.

---

# 2. Contexte

## Contexte business

<!-- Qui est concerné ? Quel parcours existant ? -->

## Contexte technique

<!-- État actuel du code, contraintes stack Yunicity (FastAPI, PostGIS, Next, Expo) -->

## Dépendances

| Domaine | Dépend de | Bloquant ? | Notes |
|---------|-----------|------------|-------|
| auth | | oui / non | |
| users | | | |
| notifications | | | |
| paiements | | | |
| géolocalisation / PostGIS | | | |
| médias / upload | | | |
| autres | | | |

## Risques connus

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Sécurité (IDOR, authZ) | | | |
| Performance (N+1, carto) | | | |
| Dette technique | | | |
| UX / accessibilité | | | |
| Dépendances externes | | | |

---

# 3. User Stories

## Story 1

En tant que **[type utilisateur]**  
Je veux **[action]**  
Afin de **[objectif]**

### Critères d’acceptation

- [ ] …
- [ ] …
- [ ] …

---

## Story 2

En tant que **[type utilisateur]**  
Je veux **[action]**  
Afin de **[objectif]**

### Critères d’acceptation

- [ ] …
- [ ] …

---

# 4. Scope

## Inclus MVP

- Fonctionnalité 1
- Fonctionnalité 2
- Fonctionnalité 3

## Hors scope

- Fonctionnalité future 1
- Fonctionnalité future 2

## Critères de fin (Definition of Done)

- [ ] Critères d’acceptation validés
- [ ] Tests backend + frontend passent en CI
- [ ] Checklist `docs/ai/security-checklist.md` parcourue si surface sensible
- [ ] `.env.example` à jour
- [ ] Migrations Alembic appliquées en recette
- [ ] Copy UI en français

---

# 5. UX / UI

## Flux utilisateur

1. …
2. …
3. …

## Maquettes / wireframes

<!-- Liens Figma, captures, ou « à produire en DESIGN » -->

## États UI obligatoires

| État | Comportement attendu |
|------|----------------------|
| loading | Skeleton / spinner + texte accessible |
| empty | Message + CTA si pertinent |
| error | Message français + action retry |
| success | Confirmation + navigation ou refresh |
| offline | (mobile) Message + file d’attente si critique |

## Accessibilité

- [ ] Labels sur tous les champs
- [ ] Contraste WCAG AA
- [ ] Focus clavier (web)
- [ ] Touch targets ≥ 44px (mobile)
- [ ] Pas d’info par la couleur seule

## Responsive

| Plateforme | Priorité | Notes |
|------------|----------|-------|
| Mobile (Expo) | P0 / P1 | |
| Web (Next.js) | | |
| Admin | | |

---

# 6. Architecture Technique

## Vue d’ensemble

```
[Client mobile/web] → API /api/v1/... → [Service] → [DB / Redis / externe]
```

## Frontend

### Écrans impactés

| Plateforme | Route / écran | Nouveau / modifié |
|------------|---------------|-------------------|
| Mobile | | |
| Web | | |
| Admin | | |

### Composants impactés

- `ComponentA` — …
- `ComponentB` — …

### Hooks / state

| Besoin | Choix | Justification |
|--------|-------|---------------|
| Données serveur | React Query / RSC | |
| État local UI | useState / Zustand | |
| Auth session | contexte existant | |

### Client API

- Nouveaux appels : `GET/POST …`
- Types alignés sur schemas Pydantic backend

---

## Backend

### Modules impactés

| Module | Changement |
|--------|------------|
| `app/api/v1/...` | |
| `app/services/...` | |
| `app/models/...` | |
| `app/schemas/...` | |

### Modèle de données

#### Entité : `NomEntite`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK | |
| `created_at` | timestamptz | NOT NULL | |
| … | | | |

**Indexes :**

- `idx_...` sur `(colonne)` — raison :

**Relations :**

- `NomEntite` → `User` (FK, on delete …)

### Endpoints

#### `POST /api/v1/ressources`

**Auth :** utilisateur connecté / rôle `partner` / admin  
**AuthZ :** …

**Request**

```json
{
  "field": "value"
}
```

**Response `201`**

```json
{
  "id": "uuid",
  "field": "value",
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Erreurs**

| Code | `code` métier | Cas |
|------|---------------|-----|
| 400 | `VALIDATION_ERROR` | Payload invalide |
| 401 | — | Non authentifié |
| 403 | `FORBIDDEN` | Pas les droits |
| 404 | `NOT_FOUND` | Ressource absente |
| 409 | `CONFLICT` | Doublon / état invalide |

---

#### `GET /api/v1/ressources`

**Query :** `limit`, `cursor`, `filter=…`  
**Pagination :** plafond serveur (ex. 100)

**Response `200`**

```json
{
  "items": [],
  "next_cursor": null
}
```

---

#### `GET /api/v1/ressources/{id}`

**AuthZ :** vérifier propriétaire / membership — pas d’IDOR

---

#### `PATCH /api/v1/ressources/{id}`

**Champs modifiables :** liste explicite (pas de mass assignment)

---

#### `DELETE /api/v1/ressources/{id}`

**Soft delete ?** oui / non — règle RGPD / rétention :

---

### Migrations

- [ ] Migration Alembic : `revision_xxx_description`
- [ ] Réversible : oui / non
- [ ] Données de seed recette : …

### Jobs / async (si applicable)

- File : …
- Idempotence : …

---

# 7. Sécurité & conformité

## Surface sensible

- [ ] Données personnelles
- [ ] Paiement
- [ ] Upload fichier
- [ ] Webhook entrant
- [ ] Admin / modération

## Contrôles requis

| Contrôle | Implémentation |
|----------|----------------|
| AuthN | JWT / session — … |
| AuthZ | RBAC / ownership — … |
| Validation | Pydantic Create/Update — … |
| Rate limiting | endpoints : … |
| Logs | sans PII |

Référence : `docs/ai/security-checklist.md`, `.cursor/rules/04-reviewer-securite-code.mdc`

---

# 8. Performance & observabilité

## Objectifs

| Métrique | Cible |
|----------|-------|
| p95 API `GET …` | < … ms |
| Taille payload max | … |
| Requêtes carto (PostGIS) | index spatial requis |

## Monitoring

- Logs : `request_id`, codes erreur
- Alertes : 5xx sur …

---

# 9. Tests

## Backend

| Type | Cas |
|------|-----|
| Unit | service : happy path, erreurs métier |
| Intégration | `POST …` 201, 403 IDOR, 404 |
| Webhook | idempotence, signature (si applicable) |

## Frontend

| Type | Cas |
|------|-----|
| Composant | états loading / empty / error |
| Intégration | flux principal mock API |

## Recette manuelle

- [ ] Parcours Story 1 complet
- [ ] Parcours Story 2 complet
- [ ] Régression : …

---

# 10. Rollout & métriques

## Déploiement

| Étape | Environnement | Action |
|-------|---------------|--------|
| 1 | dev | … |
| 2 | recette | QA + migrations |
| 3 | preprod | smoke |
| 4 | prod | feature flag ? … |

## Feature flag

- Nom : `feature_xxx_enabled`
- Défaut : `false` en prod

## Métriques produit

| Événement | Outil | Objectif |
|-----------|-------|----------|
| `tribe_joined` | … | … |

## Rollback

- Désactiver flag / revert migration : …

---

# 11. Open questions

| # | Question | Décision | Date |
|---|----------|----------|------|
| 1 | … | en attente | |
| 2 | … | | |

---

# 12. Historique

| Date | Auteur | Changement |
|------|--------|------------|
| YYYY-MM-DD | | Création du PRD |

---

# 13. BMAD (Build → Measure → Analyze → Decide)

> Méthode complète : `docs/bmad/BMAD.md`

## BUILD — gates (cocher avant premier commit code)

- [ ] PRD validé (sections 1–6 complètes)
- [ ] Architecture identifiée (§6)
- [ ] Risques identifiés (§2, §7)
- [ ] Permissions / authZ définies (§6 endpoints)
- [ ] Endpoints + contrats définis (§6)
- [ ] Modèle DB + migration planifiés (§6)

## MEASURE — métriques cibles

| Domaine | Métrique | Cible | Mesuré le |
|---------|----------|-------|-----------|
| Produit | adoption / conversion / engagement | | |
| Technique | p95 API, taux 5xx | | |
| Sécurité | abus, rate limits | | |
| UX | abandon flow | | |

## ANALYZE — synthèse (post-mesure)

- Scope PRD correct ? oui / non — …
- Valeur réelle ? …
- Dette / perf / sécurité découverte : …

## DECIDE — décision

- [ ] Scaler / Refactor / Optimiser / Supprimer / Repousser / Sécuriser / Monitorer
- **Règle CTO** : ne pas scaler si architecture ou sécurité non saines.
- Prochaine action : …

---

## Annexes

### Liens

- Issue / ticket :
- Design :
- PR(s) :

### Prompts agents (optionnel)

- Implémentation : `docs/ai/prompts.md` → **Senior Implementation Prompt**
- API : **API Architect Prompt**
- UI : **UI Builder Prompt**
- Revue : **Security Review Prompt** + `05-code-review`
- BMAD : **BUILD / MEASURE / ANALYZE / DECIDE** dans `docs/ai/prompts.md`
