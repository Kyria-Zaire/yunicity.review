# ADMIN-03B — Discovery Passport Ops Actions (staff)

**Phase BMAD :** DISCOVER (pré-BUILD)  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-03 Passport Ops  
**Ticket :** ADMIN-03B-DISCOVERY  
**Date :** 2026-06-03  
**Statut :** Spec produit + technique — **aucun code** dans ce ticket

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-03A Read API | ✅ PR #35 (`a82495d`) |
| ADMIN-03A-DISCOVERY-TECH | ✅ |
| ADMIN-02D3A Partner actions + audit | ✅ (référence pattern) |

**Décisions CTO verrouillées (héritées) :**

| Sujet | Décision |
|--------|----------|
| Statuts staff V1 | `active` \| `suspend` / `reactivate` uniquement |
| `revoked` | **Hors V1** — pas d’endpoint staff |
| Audit | Table `passport_admin_actions` (03B) |
| `reason` | Obligatoire (min 3 caractères, aligné partner) |
| Annulation redemption | **Hors V1** (option 03B.1 si besoin terrain urgent) |
| Tier change staff | **Hors V1** |
| Frontend actions | **ADMIN-03C** (après 03B) |

---

## 1. Synthèse exécutive

**Problème :** l’équipe peut **lire** les passports (03A) mais ne peut pas encore **suspendre** un citoyen abusif ni **réactiver** après enquête — flux pilote Reims : signalement → investigation → coupure temporaire → réactivation.

**Recommandation :** **Option B — PATCH statut unique + audit dédié** (miroir léger de `partner_admin_actions`), dans le même router `admin_passports.py`.

| Option | Verdict |
|--------|---------|
| A — PATCH seul sans audit | ❌ Zone rouge PII / abus — refusé |
| **B — PATCH + `passport_admin_actions`** | **Choix V1** |
| C — POST `/suspend` + `/reactivate` séparés | Valide mais plus verbeux ; PATCH suffit si payload strict |

---

## 2. État du code (audit post-03A)

### 2.1 Modèle `passports`

| Champ | Rôle actions |
|--------|----------------|
| `status` | `active` \| `suspended` \| `revoked` (DB) |
| `suspended_at` | À renseigner au suspend, **NULL** au reactivate |
| `user_id` | Citoyen concerné — FK audit |
| `qr_token` | Scan terrain refuse si non `active` (`get_active_by_qr_token`) |

**Contrainte :** `uq_passports_one_active_per_user` (partiel `status = 'active'`) — une seule ligne `active` / user. Suspendre = passer la ligne en `suspended` (pas créer une 2ᵉ ligne).

### 2.2 Effets produit d’une suspension

| Surface | Comportement attendu |
|---------|---------------------|
| `POST /scan/resolve`, `/redeem` | ❌ `PASSPORT_NOT_ACTIVE` ou équivalent (déjà filtre `active`) |
| `GET /passport/me` | ❌ pas de passport actif → erreur existante |
| `POST /passport/activate` | Comportement service actuel à **vérifier en BUILD** (réactivation staff vs auto-activate) |
| Admin 03A list/detail | ✅ statut `suspended` exposé staff |

### 2.3 Pattern audit existant — `partner_admin_actions`

Référence : `PartnerAdminAction`, `AdminPartnerRepository.record_admin_action`, migration `20260603_0029`.

**Réutiliser la philosophie :** append-only, `actor_user_id`, `reason`, `previous_status` / `new_status`, `metadata` JSONB optionnel.

**Ne pas réutiliser la table** — domaine citoyen ≠ organisation partenaire.

### 2.4 API admin passport actuelle (03A)

| Méthode | Route | Mutations |
|---------|-------|-----------|
| GET | `/admin/passports` | — |
| GET | `/admin/passports/{id}` | — |
| GET | `…/stamps`, `…/redemptions` | — |

**Manque 03B :** `PATCH /admin/passports/{passport_id}`

### 2.5 Mapping `revoked` (dette documentée 03A)

En lecture, `revoked` → affiché `suspended`.  
**03B :** interdire PATCH depuis/vers `revoked` ; transitions staff **uniquement** `active` ↔ `suspended`. Passport `revoked` en DB → `422` ou `409` explicite si staff tente reactivate.

---

## 3. Périmètre BUILD proposé (03B)

### 3.1 Migration

Table `passport_admin_actions` :

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `passport_id` | UUID FK → passports CASCADE | index |
| `user_id` | UUID FK → users SET NULL | citoyen (dénormalisé pour requêtes) |
| `action` | string(32) index | `suspend`, `reactivate` |
| `actor_user_id` | UUID FK → users SET NULL | staff |
| `previous_status` | string(32) | |
| `new_status` | string(32) | |
| `reason` | text NOT NULL | min length validé en service |
| `metadata` | JSONB nullable | ex. `{"source": "admin_passport_ops"}` |
| `created_at` | timestamptz index | |

Indexes : `passport_id`, `user_id`, `action`, `actor_user_id`, `created_at`.

### 3.2 Endpoint

```http
PATCH /api/v1/admin/passports/{passport_id}
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Signalement abus scan — enquête #123"
}
```

**RBAC :** `moderation.manage` \| `system.admin` (identique 03A).

**Réponse :** `AdminPassportDetailResponse` (même schéma que GET detail) — évite un 2ᵉ round-trip UI en 03C.

### 3.3 Règles de transition

| De | Vers | Autorisé |
|----|------|----------|
| `active` | `suspended` | ✅ si `reason` valide |
| `suspended` | `active` | ✅ réactivation |
| `active` | `active` | ❌ 422 idempotent refusé |
| `suspended` | `suspended` | ❌ 422 |
| `revoked` | * | ❌ 422 `PASSPORT_STATUS_NOT_MUTABLE` |
| * | `revoked` | ❌ hors produit V1 |

**Effets side-effect :**

- `suspend` → `status=suspended`, `suspended_at=now(UTC)`
- `reactivate` → `status=active`, `suspended_at=NULL` (ne pas toucher `activated_at`)

### 3.4 Hors scope 03B

- UI `/passport-ops` (03C)
- Liste historique audit en UI (03C ou 03D)
- `revoked`, tier, redemption cancel
- Désactivation compte `users.is_active` (axe auth séparé — **ne pas coupler** sans décision sécurité)
- Batch suspend

---

## 4. Sécurité (zones rouges)

| Risque | Mitigation BUILD |
|--------|------------------|
| Suspension abusive | `reason` obligatoire + audit append-only |
| Fuite QR après suspend | Scan déjà limité `active` — test régression |
| IDOR cross-passport | PATCH par UUID + 404 générique |
| Staff non autorisé | 403 RBAC tests |
| Réactivation passport `revoked` | Garde transition stricte |

Checklist : `docs/ai/security-checklist.md` avant merge 03B.

---

## 5. Tests minimum (03B-BUILD)

1. MODERATOR suspend `active` → 200, `suspended_at` set, audit row  
2. MODERATOR reactivate `suspended` → 200, `suspended_at` null  
3. USER simple → 403  
4. Transition invalide → 422  
5. `revoked` en DB → PATCH reactivate refusé  
6. Scan resolve sur QR passport suspendu → échec (test intégration scan)  
7. `reason` vide → 422  
8. GET detail après PATCH cohérent  

---

## 6. Découpage tickets recommandé

| Ticket | Contenu |
|--------|---------|
| **03B-BUILD** | Migration + modèle + PATCH + audit + tests |
| **03B-DISCOVERY-TECH** | *(optionnel si CTO veut verrou Pydantic avant code)* Contrats finaux, codes erreur, idempotence |
| **03C-BUILD** | UI `/passport-ops` + hooks + actions suspend/reactivate |
| **03C-D** | Liens cockpit, refresh list, feedback |

---

## 7. Questions ouvertes (CTO)

1. **Suspendre aussi `users.is_active` ?** — Recommandation : **non en V1** (impact login global, hors Passport Ops).
2. **Exposer historique audit dans GET detail ?** — Recommandation : **non V1** ; endpoint `GET …/actions` en 03D si besoin.
3. **Réponse PATCH = detail complet** — OK pour 03C ?

---

## 8. GO suivant

```txt
GO ADMIN-03B-BUILD
```

ou, si verrouillage contrats souhaité :

```txt
GO ADMIN-03B-DISCOVERY-TECH
```
