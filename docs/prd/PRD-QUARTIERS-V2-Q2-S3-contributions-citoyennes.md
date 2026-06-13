# PRD-QUARTIERS-V2-Q2-S3 — Contributions Quartiers (mémoire collective)

> **Workflow** : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — gates BUILD : §13 + `docs/bmad/BMAD.md`  
> **Parent** : `docs/prd/PRD-QUARTIERS-V2-neighborhoods-living-memory.md`  
> **ADR** : `docs/architecture/ADR-QUARTIERS-V2.md` + `docs/architecture/ADR-Q2-S3-Contributions-Citoyennes.md`  
> **DISCOVER** : validé Founder + CTO 2026-06-13  
> **Statut** : **PRD VALIDÉE** — ADR delta ✅ — DESIGN ✅ — BUILD Q2-S3-01 autorisé.

---

## 0. Métadonnées

| Champ | Valeur |
|---|---|
| ID | PRD-QUARTIERS-V2-Q2-S3 |
| Nom | Contributions Quartiers — La mémoire collective des Rémois |
| Feature parente | FEATURE-QUARTIERS-V2 |
| Statut | **PRD VALIDÉE** |
| Phase officielle | PRD ✅ → ADR delta ✅ → DESIGN ✅ → BUILD |
| Phase BMAD | — (BUILD verrouillé) |
| Priorité | **P0** — différenciation stratégique post Q2-S2 |
| Auteur | Founder (Kyria) + CTO |
| Owner technique | À nommer au kickoff ADR delta |
| Date création | 2026-06-13 |
| Dernière mise à jour | 2026-06-13 |
| Sprint cible | Q2-S3-01 → Q2-S3-04 (voir §10) |
| Environnement cible | dev → recette (Reims) → preprod → prod |

### Phrase fondatrice (obligatoire)

> **Une contribution Quartiers n'est pas une opinion. C'est un fragment de mémoire qu'un habitant choisit de transmettre à ceux qui viendront après lui.**

### Intent produit

> Si Quartiers V2 raconte l'histoire des lieux, Q2-S3 permet aux habitants d'ajouter les souvenirs qui empêchent cette histoire de disparaître.

### Vision

```txt
Aujourd'hui : la ville racontée par Yunicity.
Demain    : la ville transmise par ses habitants.
```

### Parcours émotionnel cible (post Q2-S3)

```txt
Je découvre le quartier.
↓
Je comprends son histoire.
↓
Je me reconnais.
↓
Je fais partie de ce quartier.
↓
Moi aussi, j'ai une histoire à transmettre.
```

### Roadmap Q2-S3

```txt
FEATURE-QUARTIERS-V2 / Q2-S3
├─ DISCOVER     ✅
├─ PRD          🟢 EN RÉDACTION (ce document)
├─ ADR delta    ✅ (`docs/architecture/ADR-Q2-S3-Contributions-Citoyennes.md`)
├─ DESIGN       ✅ (`docs/quartiers/DESIGN-QUARTIERS-V2-Q2-S3-contributions.md`)
├─ BUILD        🟢 Q2-S3-01
└─ VERIFY       🔒
```

### Décisions Founder / CTO verrouillées (DISCOVER)

| # | Sujet | Décision |
|---|-------|----------|
| Q1 | Nature | Souvenir personnel (+ nuance « secret d'habitant » intégrée) |
| Q2 | Structure | Titre optionnel + body obligatoire (40–800 car.) |
| Q3 | Identité | Choix utilisateur : pseudo · anonyme doux · badge Passport optionnel |
| Q4 | Modération | MVP : `pending → admin → approved/rejected` |
| Q5 | Émotion | D (« je fais partie ») + C secondaire (« envie de transmettre ») |
| Q6 | Positionnement | Mémoire vivante de Reims — jamais Wikipédia / Maps / Facebook |
| A1 | Titre public | Si vide → ne rien afficher (body-first) |
| A2 | Section vide | Invitation douce + CTA actif (abandon masquage total S2-02) |
| A3 | Mes contributions | Profil `/mon-profil` → « Mes souvenirs » |
| A4 | Rareté MVP | **1 contribution approved / utilisateur / quartier / 30 jours** (pending/rejected exclus — ADR Q2-S3-ADR-01) |

### Relation au PRD parent

Ce document **affine et remplace** pour le scope contributions :

- PRD parent **Story 5–6** (§3)
- PRD parent **Q2-S4 Participation citoyenne** (§4.1) → réaligné en **Q2-S3**
- PRD parent **Q2-S3 ADN Yunicity** (moods / staff copy) → **déjà livré ou couvert** par Q2-S1/S2 ; ne pas confondre avec ce ticket.

---

# 1. Résumé Produit

## Objectif

Permettre aux Rémois authentifiés de **transmettre des souvenirs personnels** liés à un quartier, modérés par l'équipe Yunicity, affichés sur la fiche quartier V2 — sans créer un réseau social de quartier.

## Problème

Après Q2-S2, la fiche quartier est **vivante et crédible**, mais la mémoire reste **écrite par Yunicity** :

```txt
Histoire éditoriale   → staff / seed
Timeline              → staff / seed
Contributions         → lecture seule, CTA inactif
```

**Limite :** pas de transmission intergénérationnelle, pas d'appartenance active, risque de page « musée » figée.

## Pourquoi cette feature existe

- **Problème utilisateur** : un Rémois a des souvenirs de quartier qu'il n'a nulle part où les déposer dignement.
- **Problème business** : différenciation durable vs Maps (lieux), Wikipédia (faits), Facebook (bruit).
- **Impact attendu** : taux de soumission qualitative, taux d'approbation admin, retour profil « Mes souvenirs », temps passé section appartenance, sentiment d'appartenance (pilote Reims).

## Résultat attendu (MVP)

1. Un habitant connecté peut **soumettre un souvenir** depuis la fiche quartier.
2. Le souvenir passe en **`pending`** puis **`approved`** ou **`rejected`** par un admin.
3. Les souvenirs **`approved`** s'affichent dans « Pourquoi les Rémois aiment {quartier} » (max 3 sur la fiche — inchangé).
4. Si aucun souvenir : **invitation douce** + CTA actif.
5. L'auteur suit ses souvenirs dans **Profil → Mes souvenirs**.
6. **Aucun** fil, like, commentaire ou notification sociale.

---

# 2. Contexte

## Contexte business

- **Q2-S1** ✅ fondations DB (`neighborhood_contributions` existe)
- **Q2-S1-03** ✅ API detail expose `contributions[]` (approved only, max 3)
- **Q2-S2** ✅ frontend V2 + polish ; section appartenance prête mais CTA « Bientôt »
- **Pilote Reims** : volume attendu 50–100 utilisateurs → **qualité > quantité**

## Contexte technique

| Existant | État | Q2-S3 |
|----------|------|-------|
| Table `neighborhood_contributions` | ✅ `title` nullable, `body`, `status`, audit | Étendre si `display_identity` absent |
| `POST /neighborhoods/{slug}/contributions` | 🔒 non implémenté | À BUILD |
| `GET detail.contributions` | ✅ approved only | Inchangé |
| Admin modération | 🔒 partiel / à confirmer | Q2-S3-04 |
| Rate limit ADR-04 | 3 / 24h | **Remplacé par PRD : 1 / 30 jours** (ADR delta) |
| Frontend `NeighborhoodV2BelongingSection` | CTA désactivé | Remplacer par invitation + modal |

## Dépendances

| Domaine | Dépend de | Bloquant ? | Notes |
|---------|-----------|------------|-------|
| auth | Session utilisateur | **oui** | Soumission + profil |
| neighborhoods | Detail API V2 | **oui** | Affichage public |
| profile | `/mon-profil` | **oui** | Mes souvenirs |
| passport | Badge « Citoyen vérifié » | non | Option identité mode 3 |
| admin | ADMIN-V1 permissions | **oui** | Modération |
| notifications | — | non | Pas de notif sociale MVP |

## Risques connus

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Dérive « avis / conseils » | Moyenne | Élevé | Règles éditoriales §4 + modération + copy formulaire |
| PII dans body | Moyenne | Élevé | Validation regex + modération + checklist sécu |
| IDOR (voir pending d'autrui) | Faible | Critique | Tests authZ ; auteur voit les siens uniquement |
| Spam / flood | Moyenne | Moyen | Rate limit 1/30j + modération |
| Section ressemble à Facebook | Moyenne | Élevé | Pas de fil, pas d'interactions ; design carte sobre |
| Dette : ADR rate limit obsolète | Certaine | Faible | ADR delta §6 |

---

# 3. User Stories

## Story 1 — Transmettre un souvenir (citoyen)

En tant qu'**habitant**  
Je veux **transmettre un souvenir lié à mon quartier**  
Afin que **il ne disparaisse pas**

### Critères d'acceptation

- [ ] Bouton « Partager un souvenir » actif sur fiche quartier (section appartenance)
- [ ] Formulaire : quartier pré-rempli (contexte fiche), titre optionnel, body obligatoire 40–800 car.
- [ ] Copy d'aide rappelle : souvenir personnel, pas avis ni conseil commercial
- [ ] Soumission authentifiée → statut `pending`
- [ ] Toast confirmation : « Merci — votre souvenir sera relu par l'équipe avant publication. »
- [ ] Rate limit : max **1 soumission aboutie / utilisateur / quartier / 30 jours** (pending ou approved compte ; rejected peut resoumettre — voir §4.5)
- [ ] Pas de publication immédiate sans modération

---

## Story 2 — Choisir son identité (citoyen)

En tant qu'**habitant**  
Je veux **choisir comment je signe ma contribution**  
Afin de **préserver mon niveau de confidentialité**

### Critères d'acceptation

- [ ] Trois modes au moment de la soumission :
  - **Pseudo** : prénom ou pseudo Yunicity (ex. `Kyria`)
  - **Anonyme doux** : `Un Rémois` ou `Une Rémoise` (jamais « Utilisateur 38291 »)
  - **Vérifié** (si éligible Passport) : `{pseudo} • Citoyen vérifié`
- [ ] Jamais de nom complet affiché publiquement
- [ ] Choix **figé à la soumission** (snapshot sur la contribution)
- [ ] Affichage public : ligne auteur sobre sous le texte (pas avatar social)

---

## Story 3 — Suivre mes souvenirs (citoyen)

En tant qu'**habitant**  
Je veux **retrouver mes souvenirs publiés ou en attente**  
Afin de **suivre leur parcours**

### Critères d'acceptation

- [ ] Espace **Profil → Mes souvenirs** (`/mon-profil` ou sous-section dédiée)
- [ ] Liste des contributions de l'utilisateur connecté, tous quartiers
- [ ] États visibles : **En attente** · **Approuvé** · **Refusé**
- [ ] Si refusé : motif optionnel affiché si fourni par admin
- [ ] Pas de fil public, pas de mur personnel, pas d'activité sociale
- [ ] Lien vers la fiche quartier depuis chaque souvenir

---

## Story 4 — Lire la mémoire collective (visiteur)

En tant que **visiteur ou Rémois**  
Je veux **lire des souvenirs authentiques sur un quartier**  
Afin de **ressentir l'appartenance à Reims**

### Critères d'acceptation

- [ ] Section « Pourquoi les Rémois aiment {quartier} » toujours visible
- [ ] Si `contributions.length > 0` : max **3** cartes (approved, plus récentes) — body-first, titre omis si null
- [ ] Si vide : copy invitation :

  > Aucun souvenir n'a encore été partagé sur ce quartier.  
  > Soyez la première voix à transmettre ce qui le rend unique.

- [ ] CTA « Partager un souvenir » (connecté → formulaire ; non connecté → login avec retour)
- [ ] Pas de likes, commentaires, partages, classements

---

## Story 5 — Modérer (admin)

En tant qu'**administrateur**  
Je veux **approuver ou refuser les souvenirs**  
Afin de **préserver la qualité de la mémoire collective**

### Critères d'acceptation

- [ ] File admin contributions (pending first)
- [ ] Preview : quartier, auteur (interne), identité publique choisie, titre, body, date
- [ ] Actions : **Approuver** · **Refuser** (+ motif optionnel)
- [ ] Audit : `reviewed_by`, `reviewed_at`
- [ ] Après approbation : visible dans `GET detail` si dans le top 3
- [ ] Permissions : `MODERATOR`, `CITY_ADMIN`, `SUPER_ADMIN`

---

# 4. Scope

## 4.1 Règles éditoriales (produit)

Une contribution **DOIT être** :

```txt
✓ personnelle
✓ intemporelle (ou transmissible dans le temps)
✓ liée au quartier
✓ sincère
✓ transmissible (fragment de mémoire)
```

Une contribution **NE DOIT PAS être** :

```txt
❌ un avis consommateur (« le meilleur kebab », « note 3/5 »)
❌ une recommandation commerciale (« je conseille… »)
❌ une question
❌ une petite annonce
❌ un débat ou une polémique
❌ une actualité éphémère (« ce week-end seulement »)
❌ un Top 10 / ranking
```

### Exemples valides

> « Quand j'étais petit, mon grand-père m'emmenait aux Halles tous les samedis. »

> « Peu de gens savent qu'en hiver, cette petite rue derrière les Halles est la plus calme du quartier. »

### Exemples refusés (modération)

```txt
« Le meilleur café du quartier, allez-y ! »     → conseil commercial
« Qui connaît un bon garagiste ? »              → question
« Vente vélo pas cher »                         → annonce
```

## 4.2 Structure données (MVP)

| Champ | Obligatoire | Règles |
|-------|-------------|--------|
| `neighborhood_id` | oui | Déduit du slug fiche |
| `author_user_id` | oui | Session |
| `body` | oui | 40–800 car., plain text, sanitized |
| `title` | non | Max 200 car. ; **non affiché** si null/vide |
| `display_identity` | oui | Enum : `pseudo` \| `anonymous_remois` \| `anonymous_remoise` \| `verified` |
| `display_name_snapshot` | oui | Texte public résolu à la soumission |
| `status` | oui | `pending` \| `approved` \| `rejected` |

## 4.3 Identité publique (affichage)

| Mode | Rendu public |
|------|----------------|
| Pseudo | `Kyria` (prénom ou pseudo profil) |
| Anonyme doux | `Un Rémois` ou `Une Rémoise` |
| Vérifié | `Kyria • Citoyen vérifié` (si éligible) |

**Interdit :** nom complet, email, handle technique.

## 4.4 Rareté (qualité > quantité)

```txt
MVP : 1 contribution APPROUVÉE
      par utilisateur
      par quartier
      par fenêtre glissante de 30 jours
      à compter de approved_at
```

- Compte : **uniquement** `status = approved`
- `pending` : ne consomme pas le quota ; max 1 pending / user / quartier (ADR Q2-S3-ADR-01)
- `rejected` : ne consomme pas le quota — resoumission autorisée
- Message UI si quota atteint : « Vous avez déjà partagé un souvenir sur ce quartier ce mois-ci. Revenez bientôt. »

## 4.5 Inclus MVP (BUILD par tickets)

| Ticket | Scope |
|--------|-------|
| **Q2-S3-01** | API POST contribution + validation + rate limit + enum identité |
| **Q2-S3-02** | API GET mes contributions (user) |
| **Q2-S3-03** | Web : modal soumission + section invitation/affichage |
| **Q2-S3-04** | Admin : file modération approve/reject |
| **Q2-S3-05** | Web : Profil → Mes souvenirs |

## 4.6 Hors scope MVP (interdit — à lister en release notes)

```txt
❌ Likes
❌ Commentaires
❌ Réponses / threads
❌ Followers
❌ Notifications sociales (« X a commenté »)
❌ Fils chronologiques publics
❌ Classements / Top contributeurs
❌ Partages publics type réseau social
❌ Votes communautaires
❌ Auto-publication contributeurs de confiance
❌ Signalement communautaire
❌ Gamification agressive (badges, scores)
❌ Édition d'une contribution après soumission
❌ Suppression self-service après approbation
❌ Multi-ville hors Reims
```

## 4.7 Critères Founder (acceptation produit)

| ID | Test | Critère |
|----|------|---------|
| **T1** | 5 secondes | « Ce sont des souvenirs humains » — pas des avis |
| **T2** | Parcours complet | Pas d'impression Facebook / fil social |
| **T3** | Fin de lecture | Sentiment d'appartenance au quartier / à Reims |
| **T4** | Après lecture | Envie de transmettre un souvenir personnel |
| **T5** | Volume pilote | La qualité prime sur la quantité (rareté + modération visibles) |

## 4.8 Definition of Done (Q2-S3 complet)

- [ ] Stories 1–5 critères cochés
- [ ] Tests API : soumission, rate limit, IDOR, modération, affichage public
- [ ] Tests web : empty state, modal, profil, non-régression fiche V2
- [ ] Checklist sécurité : PII, XSS, authZ (`docs/ai/security-checklist.md`)
- [ ] Copy UI français — `docs/ai/frontend-design-system.md`
- [ ] ADR delta mergé
- [ ] DESIGN Q2-S3 validé Founder T1–T5
- [ ] QA recette : Boulingrin + Centre-ville avec ≥1 souvenir seed approved

---

# 5. UX / UI

## 5.1 Section fiche quartier — « Pourquoi les Rémois aiment… »

### État avec souvenirs (≤3)

```txt
Pourquoi les Rémois aiment Boulingrin

┌─────────────────────────────────────┐
│ « Les Halles le samedi matin,        │  ← body-first (pas de titre vide)
│   c'était notre rituel… »            │
│ Kyria                                │  ← identité publique
└─────────────────────────────────────┘

[ Partager un souvenir ]                ← secondaire si déjà des cartes
```

### État vide (invitation — décision définitive)

```txt
Pourquoi les Rémois aiment Boulingrin

Aucun souvenir n'a encore été partagé sur ce quartier.
Soyez la première voix à transmettre ce qui le rend unique.

[ Partager un souvenir ]                ← primaire
```

## 5.2 Modal soumission

```txt
Partager un souvenir
Quartier : Boulingrin (lecture seule)

Titre (optionnel)
[________________________________]

Votre souvenir *
[________________________________]
[________________________________]
40–800 caractères

Comment souhaitez-vous apparaître ?
○ Kyria
○ Un Rémois / Une Rémoise
○ Kyria • Citoyen vérifié   (si éligible)

Rappel : un souvenir personnel, pas un avis ni une publicité.

[ Annuler ]  [ Transmettre ]
```

## 5.3 Profil — Mes souvenirs

```txt
Mon profil
└─ Mes souvenirs

┌ En attente ─────────────────────────┐
│ Boulingrin · soumis le 12 juin       │
│ « Les Halles le samedi… »            │
└─────────────────────────────────────┘

┌ Approuvé ───────────────────────────┐
│ Centre-ville · publié le 3 juin      │
└─────────────────────────────────────┘

┌ Refusé ─────────────────────────────┐
│ Motif : contenu hors sujet quartier  │
└─────────────────────────────────────┘
```

## 5.4 Admin — File modération

Réutiliser patterns ADMIN-V1 (file, preview, actions binaires, audit).

## 5.5 Ce que l'UI ne doit pas évoquer

```txt
❌ Wikipédia (infobox, références)
❌ Google Maps (étoiles, « ouvert maintenant »)
❌ Facebook (réactions, commentaires, partages)
❌ Reddit (upvotes, threads)
❌ TripAdvisor (notes, « je recommande »)
```

---

# 6. Architecture & API (indicatif — ADR delta requis)

## 6.1 Endpoints MVP

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/v1/neighborhoods/{slug}/contributions` | user | Soumission → `pending` |
| GET | `/api/v1/me/neighborhood-contributions` | user | Liste propres contributions |
| GET | `/api/v1/neighborhoods/{slug}` | public | Inchangé — `contributions[]` approved max 3 |
| GET | `/api/v1/admin/neighborhood-contributions` | staff | File modération |
| PATCH | `/api/v1/admin/neighborhood-contributions/{id}` | staff | Approve / reject |

## 6.2 Payload POST (indicatif)

```json
{
  "title": "Les Halles le samedi",
  "body": "Quand j'étais petit, mon grand-père m'emmenait aux Halles tous les samedis.",
  "display_identity": "pseudo"
}
```

## 6.3 Migration / delta ADR attendu

| Sujet | Décision PRD | Action ADR delta |
|-------|--------------|------------------|
| Rate limit | 1 / user / quartier / 30 jours | Remplacer ADR-04 (3/24h) |
| `display_identity` + snapshot | Requis | Colonnes ou JSON metadata |
| `title` | Déjà nullable en DB | Documenter affichage body-first |
| Rejet et quota | Resoumission autorisée | Règle métier explicite |

## 6.4 Permissions

| Action | Rôle |
|--------|------|
| Soumettre | `USER` authentifié |
| Lire approved public | Anonyme |
| Lire ses propres (tous statuts) | Auteur |
| Modérer | `MODERATOR` \| `CITY_ADMIN` \| `SUPER_ADMIN` |

---

# 7. Sécurité & permissions

| Surface | Règle |
|---------|-------|
| Soumission | Auth obligatoire ; CSRF / session web |
| Rate limit | 1 / 30j / quartier / user |
| PII | Regex email/téléphone dans body ; rejet modération |
| XSS | Plain text only ; escape à l'affichage |
| IDOR | User A ne lit pas les pending de User B |
| Modération | Audit trail obligatoire |
| Zone rouge | Review sécu obligatoire avant merge BUILD |

---

# 8. Tests (VERIFY)

## Backend

- [ ] POST valide → `pending`
- [ ] POST body < 40 ou > 800 → 422
- [ ] POST sans auth → 401
- [ ] Rate limit 2e soumission < 30j → 429
- [ ] GET me : uniquement contributions auteur
- [ ] Approve → visible dans detail (si top 3)
- [ ] Reject → non visible public ; visible profil auteur

## Frontend

- [ ] Empty state invitation + CTA
- [ ] Modal validation longueur
- [ ] Non connecté → redirect login
- [ ] Profil états pending/approved/rejected
- [ ] Pas de titre affiché si null

---

# 9. Copy UI (clés proposées)

| Clé | Texte FR |
|-----|----------|
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_TITLE` | Pourquoi les Rémois aiment {name} |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_BODY` | Aucun souvenir n'a encore été partagé sur ce quartier. |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_CTA` | Soyez la première voix à transmettre ce qui le rend unique. |
| `NEIGHBORHOOD_V2_SHARE_MEMORY_CTA` | Partager un souvenir |
| `NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS` | Merci — votre souvenir sera relu par l'équipe avant publication. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_RATE_LIMIT` | Vous avez déjà partagé un souvenir sur ce quartier ce mois-ci. |
| `PROFILE_MY_MEMORIES_TITLE` | Mes souvenirs |
| `PROFILE_MEMORY_STATUS_PENDING` | En attente |
| `PROFILE_MEMORY_STATUS_APPROVED` | Approuvé |
| `PROFILE_MEMORY_STATUS_REJECTED` | Refusé |

---

# 10. Rollout & tickets BUILD

| Ticket | Livrable | Dépendance |
|--------|----------|------------|
| Q2-S3-01 | API POST + validation + rate limit | ADR delta |
| Q2-S3-02 | API GET mes contributions | Q2-S3-01 |
| Q2-S3-03 | Web section + modal | Q2-S3-01 |
| Q2-S3-04 | Admin modération | Q2-S3-01 |
| Q2-S3-05 | Profil Mes souvenirs | Q2-S3-02 |

**Feature flag proposé :** `feature_neighborhood_contributions_enabled` — `false` en prod jusqu'à VERIFY recette.

## Métriques MEASURE (post-release)

| Événement | Objectif |
|-----------|----------|
| `neighborhood_contribution_submitted` | Volume + quartier |
| `neighborhood_contribution_approved` | Taux approbation |
| `neighborhood_contribution_rejected` | Qualité modération |
| `neighborhood_contribution_cta_click` | Intention T4 |

---

# 11. Open questions

| # | Question | Décision | Date |
|---|----------|----------|------|
| 1 | Rejet consomme-t-il le quota 30j ? | **Non** — seul `approved` compte | 2026-06-13 ADR |
| 2 | Pending compte-t-il dans le quota ? | **Non** — max 1 pending / quartier | 2026-06-13 ADR |
| 3 | Mobile Expo : Q2-S3 web only ou parité ? | **Web pilot** ; mobile hors MVP Q2-S3 | 2026-06-13 ADR |
| 4 | Seed recette : combien de souvenirs approved ? | 2–3 Boulingrin, 1–2 Centre-ville | DESIGN |

---

# 12. Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | DISCOVER Q2-S3 validé |
| 2026-06-13 | CTO | PRD Q2-S3 approuvée Founder |
| 2026-06-13 | CTO | ADR delta Q2-S3 approuvé |

---

# 13. BMAD — gates BUILD

> **BUILD interdit** tant que les cases ci-dessous ne sont pas cochées + validation Founder PRD.

## BUILD — gates

- [x] PRD Q2-S3 validé (sections 1–7 complètes)
- [x] ADR delta Q2-S3 validé (rate limit, identité, quota rejet)
- [x] DESIGN Q2-S3 validé (modal, empty state, profil, admin)
- [x] Founder T1–T5 DESIGN cochés
- [ ] Architecture §6 revue CTO
- [ ] Risques §2 + sécurité §7 revus
- [ ] Permissions / authZ définies
- [ ] Endpoints + contrats figés
- [ ] Plan migration DB (si `display_identity` / snapshot)

## MEASURE — métriques cibles

| Domaine | Métrique | Cible pilote Reims |
|---------|----------|-------------------|
| Produit | Soumissions / mois | 10–30 (qualitatif) |
| Produit | Taux approbation | > 60 % |
| Produit | CTA « Partager » / vues section | > 2 % |
| Technique | p95 POST contribution | < 300 ms |
| Sécurité | Abus rate limit | 0 bypass |
| UX | T1–T5 Founder | 5/5 |

## DECIDE (post-pilote)

- Scaler vers autres villes **uniquement** si modération tenable et T1–T5 validés en conditions réelles.

---

## Annexes

### Liens

- Parent : `docs/prd/PRD-QUARTIERS-V2-neighborhoods-living-memory.md`
- ADR : `docs/architecture/ADR-QUARTIERS-V2.md`
- Design V2 base : `docs/quartiers/DESIGN-QUARTIERS-V2.md`
- Design Q2-S3 : `docs/quartiers/DESIGN-QUARTIERS-V2-Q2-S3-contributions.md` (review Founder T1–T5)

### Positionnement verrouillé (Q6)

```txt
Nord star : Mémoire vivante de Reims

Couche 1 — Yunicity raconte    (hero, timeline, histoire)
Couche 2 — Le territoire agit  (lieux, événements, carte)
Couche 3 — Les habitants       (souvenirs modérés)

Jamais : Wikipédia · Google Maps · Facebook · Reddit
```
