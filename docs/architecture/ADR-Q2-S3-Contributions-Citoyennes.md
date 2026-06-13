# ADR-Q2-S3 — Contributions Quartiers (mémoire collective)

| Champ | Valeur |
|-------|--------|
| Statut | **APPROVED** — aligné PRD-QUARTIERS-V2-Q2-S3 |
| Date | 2026-06-13 |
| PRD | `docs/prd/PRD-QUARTIERS-V2-Q2-S3-contributions-citoyennes.md` |
| Parent | `docs/architecture/ADR-QUARTIERS-V2.md` (ADR-04 contributions — **étendu et précisé** par ce document) |
| Décision | Quota qualité, snapshot identité, refus pédagogique, section persistante, immutabilité, tri chronologique, anti-réseau social |
| Conséquence | Migration Alembic delta + évolution API POST/PATCH admin + contrats frontend DESIGN/BUILD |

---

## Contexte

Quartiers V2 a livré la **mémoire racontée par Yunicity** (Q2-S1, Q2-S2). Q2-S3 ouvre la **mémoire transmise par les habitants**.

Le risque principal n'est pas technique — c'est la **dérive sociale** :

```txt
souvenirs
↓
engagement
↓
fil chronologique
↓
Facebook local
```

Ce delta ADR verrouille les garde-fous produit et architecture **avant DESIGN et BUILD**.

### État actuel (post Q2-S2)

| Composant | État |
|-----------|------|
| Table `neighborhood_contributions` | Existe — `title`, `body`, `status`, `reviewed_*`, `rejection_reason` |
| `GET detail.contributions` | Approved only, max 3, `created_at` order |
| POST soumission | Non implémenté |
| Admin modération | Non implémenté |
| Frontend section appartenance | Lecture seule + CTA « Bientôt » |

### Ce que ce document remplace dans ADR-QUARTIERS-V2

| Référence parent | Avant (ADR-04) | Après (Q2-S3) |
|------------------|----------------|---------------|
| Rate limit | 3 / user / quartier / 24h | **1 approved / 30 jours** (voir Q2-S3-ADR-01) |
| Identité publique | Non spécifiée | **Snapshot à la soumission** (Q2-S3-ADR-02) |
| Rejet | `rejection_reason` libre | **Code + note pédagogique** (Q2-S3-ADR-03) |
| Section vide | Implicite | **Invitation persistante** (Q2-S3-ADR-04) |
| Édition | Non spécifiée | **Immutabilité post-approbation** (Q2-S3-ADR-05) |
| Tri public | `created_at` | **`approved_at DESC`** (Q2-S3-ADR-06) |

---

## Synthèse des décisions Q2-S3

| ID | Sujet | Décision |
|----|-------|----------|
| **Q2-S3-ADR-01** | Quota | 1 **approved** / user / quartier / 30 jours glissants |
| **Q2-S3-ADR-02** | Identité | Snapshot `type` + `label` + `passport_verified` à la soumission |
| **Q2-S3-ADR-03** | Refus | `rejection_reason_code` + `rejection_note` + copy profil pédagogique |
| **Q2-S3-ADR-04** | Section vide | **Toujours visible** — invitation douce + CTA actif |
| **Q2-S3-ADR-05** | Immutabilité | Pas d'édition après approbation ; retrait auteur ou demande admin |
| **Q2-S3-ADR-06** | Affichage | Éditorial → contributions → CTA ; tri `approved_at DESC` |
| **Q2-S3-ADR-07** | Anti-social | Contributions ≠ flux social — liste d'interdictions normative |

---

## Q2-S3-ADR-01 — Quota contributions (qualité > quantité)

### Décision

```txt
1 contribution APPROUVÉE
par utilisateur
par quartier
par fenêtre glissante de 30 jours
```

### Règle de consommation du quota

| Statut | Consomme le quota ? |
|--------|---------------------|
| `pending` | **Non** |
| `rejected` | **Non** |
| `approved` | **Oui** — à partir de `approved_at` |

### Calcul

```txt
Dernière contribution approved pour (author_user_id, neighborhood_id)
  → si approved_at + 30 jours > now()
  → refuser nouvelle soumission (HTTP 429)
```

### Rationale

- Une contribution **refusée** ne doit pas bloquer injustement l'auteur.
- Une contribution **pending** ne doit pas consommer le quota « mémoire publiée ».
- Seule une publication **approuvée** compte comme fragment transmis à la postérité.

### Garde-fou modération (complément)

```txt
Max 1 contribution pending
par utilisateur
par quartier
à la fois
```

Évite le spam de file admin sans pénaliser l'utilisateur sur le quota approved.

### Message API / UI

```txt
CONTRIBUTION_QUOTA_EXCEEDED
→ « Vous avez déjà partagé un souvenir publié sur ce quartier ce mois-ci. »
```

### Supersedes

Remplace `Rate limit : 3 contributions / user / quartier / 24h` dans `ADR-QUARTIERS-V2` §ADR-04.

---

## Q2-S3-ADR-02 — Snapshot identité publique

### Décision

L'identité affichée publiquement est **figée à la soumission**. Elle ne suit pas les mutations ultérieures du profil ou du Passport.

### Colonnes (migration delta)

| Colonne | Type | Notes |
|---------|------|-------|
| `display_identity_type` | `VARCHAR(16)` | `pseudo` \| `anonymous` \| `verified` |
| `display_identity_label` | `VARCHAR(120)` | Texte public résolu |
| `passport_verified_snapshot` | `BOOLEAN` | `true` si mode verified au moment T |

### Résolution à la soumission (serveur)

| `display_identity_type` | `display_identity_label` (exemples) |
|-------------------------|-------------------------------------|
| `pseudo` | Prénom ou pseudo profil — ex. `Kyria` |
| `anonymous` | `Un Rémois` ou `Une Rémoise` (choix utilisateur) |
| `verified` | `{pseudo} • Citoyen vérifié` — **uniquement** si Passport actif à T |

### Règles

```txt
✓ Le serveur calcule display_identity_label — jamais le client seul
✓ Jamais de nom complet
✓ Jamais « Utilisateur {id} »
✓ verified refusé (422) si Passport non éligible à T
```

### API publique (`NeighborhoodDetailContributionItem`)

Exposer :

```json
{
  "id": "...",
  "title": null,
  "body": "...",
  "author_label": "Kyria",
  "created_at": "...",
  "approved_at": "..."
}
```

**Ne pas exposer** : `author_user_id`, email, nom légal.

### Rationale

La mémoire collective doit rester fidèle au **moment de la transmission**, pas au profil actuel.

---

## Q2-S3-ADR-03 — Refus explicable (pédagogie)

### Décision

Chaque rejet admin porte un **code machine** et une **note optionnelle**, mappés vers une copy **pédagogique** côté profil.

### Colonnes (migration delta)

| Colonne | Type | Notes |
|---------|------|-------|
| `rejection_reason_code` | `VARCHAR(32)` | Enum stable — voir tableau |
| `rejection_note` | `VARCHAR(500)` NULL | Note interne / détail admin optionnel |
| `rejection_reason` | conservé | Déprécié → migrer vers `rejection_note` ou supprimer en BUILD |

### Codes rejet (`rejection_reason_code`)

| Code | Signification | Copy profil (FR) |
|------|---------------|------------------|
| `NOT_A_MEMORY` | Pas un souvenir personnel | Votre souvenir n'a pas été publié : ce contenu ressemblait davantage à un avis qu'à un souvenir personnel. |
| `COMMERCIAL_CONTENT` | Promo / conseil commercial | Votre souvenir n'a pas été publié : les recommandations commerciales ne font pas partie de la mémoire collective. |
| `TOO_SHORT` | Hors bornes 40–800 | Votre souvenir n'a pas été publié : le texte était trop court ou trop long. |
| `NOT_LOCAL` | Hors quartier / hors Reims | Votre souvenir n'a pas été publié : il ne semble pas lié à ce quartier. |
| `INAPPROPRIATE` | Ton, PII, contenu inadapté | Votre souvenir n'a pas été publié : le contenu ne respectait pas nos règles de mémoire collective. |
| `DUPLICATE` | Doublon / resoumission | Votre souvenir n'a pas été publié : un souvenir similaire existe déjà. |
| `OTHER` | Fallback admin | Votre souvenir n'a pas été publié. Notre équipe vous invite à en proposer un autre. |

### Flux admin PATCH

```json
{
  "status": "rejected",
  "rejection_reason_code": "NOT_A_MEMORY",
  "rejection_note": "Formulation type « meilleur café »"
}
```

### Rationale

Réduire la frustration, enseigner le format « mémoire » — pas punir silencieusement.

---

## Q2-S3-ADR-04 — Invitation douce persistante

### Décision produit (normatif)

La section **« Pourquoi les Rémois aiment {quartier} »** est **toujours rendue** sur la fiche quartier V2.

```txt
0 contribution approved
≠
section absente
```

### Comportement

| État | UI |
|------|-----|
| `contributions.length === 0` | Copy invitation + CTA « Partager un souvenir » **actif** |
| `contributions.length > 0` | Max 3 cartes approved + CTA secondaire |

### Copy verrouillée

```txt
Aucun souvenir n'a encore été partagé sur ce quartier.
Soyez la première voix à transmettre ce qui le rend unique.
```

### Rationale

Transformer le vide en **amorce de mémoire collective** — choix produit, pas détail UI optionnel.

### Impact S2-02

Remplace la règle frontend « section masquée si contributions vides » (`NeighborhoodV2BelongingSection`).

---

## Q2-S3-ADR-05 — Contributions immuables (mémoire, pas post)

### Décision

Après `status = approved` :

```txt
❌ pas d'édition libre du title/body
❌ pas de réécriture historique
```

### Options autorisées post-approbation

| Action | Acteur | MVP |
|--------|--------|-----|
| **Demande de retrait** | Auteur | Oui — flag `retraction_requested_at` ou ticket support |
| **Suppression admin** | Staff | Oui — retrait modération (audit obligatoire) |
| **Suppression self-service immédiate** | Auteur | Non — évite effacement impulsif de mémoire publiée |

### Rationale

On construit une **mémoire transmissible**, pas un post Instagram modifiable.

### Schéma optionnel (BUILD)

| Colonne | Type | Notes |
|---------|------|-------|
| `retraction_requested_at` | `TIMESTAMPTZ` NULL | Demande auteur |
| `retracted_at` | `TIMESTAMPTZ` NULL | Action staff |
| `retracted_by` | `UUID FK` NULL | Audit |

Retrait ≠ delete hard — préférer `status = retracted` ou soft-hide public.

---

## Q2-S3-ADR-06 — Ordre d'affichage

### Décision

#### Hiérarchie section (fiche quartier)

```txt
1. Contenu éditorial Yunicity (why_locals_love staff si présent — futur)
2. Contributions approuvées (max 3)
3. CTA « Partager un souvenir »
```

#### Tri contributions publiques

```txt
ORDER BY approved_at DESC
```

**Interdit :**

```txt
❌ popularité
❌ engagement
❌ likes
❌ score
❌ random
```

### Migration delta

| Colonne | Type | Notes |
|---------|------|-------|
| `approved_at` | `TIMESTAMPTZ` NULL | Set lors du PATCH approve (= `reviewed_at` si même instant) |

`created_at` reste pour audit soumission ; **`approved_at`** est la référence publique et quota.

### API detail

Mettre à jour `NeighborhoodDetailService` :

```python
.order_by(NeighborhoodContribution.approved_at.desc())
.limit(NEIGHBORHOOD_DETAIL_CONTRIBUTIONS_LIMIT)
```

### Supersedes

Remplace tri `created_at.desc()` pour l'affichage public.

---

## Q2-S3-ADR-07 — Anti-réseau social (norme produit)

### Décision

```txt
Les contributions Quartiers ne constituent pas un flux social.
```

Elles constituent des **fragments de mémoire modérés**, affichés statiquement sur une fiche territoriale.

### Interdictions explicites (MVP et évolutions sans ADR dédié)

```txt
❌ commentaires sur une contribution
❌ réponses / threads
❌ likes / réactions
❌ partage public type réseau social
❌ abonnements à un contributeur
❌ classement / leaderboard contributeurs
❌ notifications sociales (« X a réagi »)
❌ fil chronologique global de contributions
❌ votes communautaires
❌ auto-publication sans modération
❌ gamification (badges, scores, streaks)
```

### Conséquence architecture

- Pas de tables `contribution_comments`, `contribution_likes`, `contribution_shares`.
- Pas d'events analytics type « viral loop » sur contributions.
- Feature flags futurs **interdits** sans nouvel ADR + PRD.

### Doctrine

```txt
mémoire → transmission → appartenance
```

**Pas :**

```txt
mémoire → engagement → réseau social → Facebook local
```

---

## Schéma cible `neighborhood_contributions` (post delta)

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `neighborhood_id` | UUID FK | |
| `author_user_id` | UUID FK | |
| `title` | VARCHAR(200) NULL | Optionnel — non affiché si vide |
| `body` | TEXT | 40–800 car. |
| `status` | VARCHAR(16) | `pending` \| `approved` \| `rejected` \| `retracted` |
| `display_identity_type` | VARCHAR(16) | Q2-S3-ADR-02 |
| `display_identity_label` | VARCHAR(120) | Snapshot public |
| `passport_verified_snapshot` | BOOLEAN | Default false |
| `reviewed_by` | UUID NULL | |
| `reviewed_at` | TIMESTAMPTZ NULL | |
| `approved_at` | TIMESTAMPTZ NULL | Q2-S3-ADR-01 / 06 |
| `rejection_reason_code` | VARCHAR(32) NULL | Q2-S3-ADR-03 |
| `rejection_note` | VARCHAR(500) NULL | |
| `retraction_requested_at` | TIMESTAMPTZ NULL | Q2-S3-ADR-05 |
| `retracted_at` | TIMESTAMPTZ NULL | |
| `retracted_by` | UUID NULL | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Index recommandés (delta)

```txt
ix_neighborhood_contributions_author_hood_status (author_user_id, neighborhood_id, status)
ix_neighborhood_contributions_hood_approved_at (neighborhood_id, approved_at DESC) WHERE status = 'approved'
```

---

## API (contrats BUILD)

### POST `/api/v1/neighborhoods/{slug}/contributions`

| Auth | `USER` |
| Body | `title?`, `body`, `display_identity_type`, `anonymous_gender?` (`remois` \| `remoise` si anonymous) |
| Succès | `201` + `{ id, status: "pending" }` |
| Erreurs | `401`, `422`, `429` (quota approved), `409` (pending existant) |

### GET `/api/v1/me/neighborhood-contributions`

| Auth | `USER` |
| Retour | Liste propres contributions tous statuts + `rejection_reason_code` + copy profil |

### PATCH `/api/v1/admin/neighborhood-contributions/{id}`

| Auth | staff |
| Actions | `approved` (set `approved_at`) \| `rejected` (code + note) \| `retracted` |

### GET detail (inchangé route, évolution tri)

`contributions[]` : approved only, max 3, `approved_at DESC`, expose `author_label` pas `author_user_id`.

---

## Permissions (inchangé + précisions)

| Action | Rôle |
|--------|------|
| Soumettre | `USER` authentifié |
| Lire approved | Public |
| Lire propres tous statuts | Auteur |
| Modérer / retirer | `MODERATOR` \| `CITY_ADMIN` \| `SUPER_ADMIN` |

---

## Sécurité (zones rouges)

| Risque | Mitigation |
|--------|------------|
| IDOR | Author scope sur GET me ; admin only sur file |
| PII dans body | Regex + modération + code `INAPPROPRIATE` |
| XSS | Plain text ; escape affichage |
| Spam | 1 pending max + quota approved 30j |
| Dérive sociale | Q2-S3-ADR-07 normatif |

Checklist : `docs/ai/security-checklist.md` obligatoire avant merge BUILD.

---

## Conséquences

### Positives

- Vision protégée contre Facebook local
- Quota juste (rejet ne pénalise pas)
- Mémoire historiquement fidèle (snapshot + immutabilité)
- UX refus pédagogique

### Négatives / coûts

- Migration Alembic supplémentaire
- Complexité modération (codes rejet)
- Support retraits manuels MVP

### Ne fait pas (BUILD Q2-S3)

```txt
❌ Mobile Expo parité (sauf décision ultérieure)
❌ Notifications push soumission approuvée
❌ Édition post-approbation
❌ Votes / commentaires
```

---

## Prochaines étapes BMAD

```txt
DISCOVER         ✅
PRD Q2-S3        ✅ APPROUVÉE
ADR DELTA        ✅ APPROVED (ce document)
DESIGN Q2-S3     ✅ APPROVED
BUILD            🟢 AUTORISÉ (Q2-S3-01)
```

| Étape | Livrable |
|-------|----------|
| DESIGN | `docs/quartiers/DESIGN-QUARTIERS-V2-Q2-S3-contributions.md` — **EN REVIEW** Founder T1–T5 |
| BUILD Q2-S3-01 | Migration + POST API |
| BUILD Q2-S3-02 | GET me + quota service |
| BUILD Q2-S3-03 | Web modal + empty state persistant |
| BUILD Q2-S3-04 | Admin modération codes |
| BUILD Q2-S3-05 | Profil Mes souvenirs |

---

## Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | DISCOVER + PRD validés |
| 2026-06-13 | CTO | ADR delta Q2-S3 — 7 décisions verrouillées |

---

## Verdict

```txt
ADR-Q2-S3 Contributions Citoyennes : APPROVED ✅
Prochaine gate : DESIGN Q2-S3 (Founder T1–T5)
BUILD : interdit jusqu'à DESIGN validé
```
