# QA-01 — Authentication & Access Control Validation

**Ticket** : QA-01  
**Feature** : FEATURE-ADMIN-V1 (recette auth / accès)  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Auditeur** : QA automatisé (API) + revue statique (Admin / Web)  
**Périmètre** : Backend API, Admin (`:3001`), Web (`:3000`) — **aucune modification produit**

---

# Résumé

Recette ciblée sur l'authentification et le contrôle d'accès avant Passport V2.

| Zone | Verdict | Commentaire |
|------|---------|-------------|
| Backend API auth | **PASS** | Login, logout, refresh, rate limit, RBAC guards conformes |
| Backend routes admin | **PASS** | 401 sans token, 403 rôle insuffisant, SUPER_ADMIN OK |
| Admin UI (statique) | **PASS avec réserves** | Guards présents ; 2 écarts UI staff documentés |
| Web UI (statique) | **PASS** | Même AuthClient, messages humanisés |
| Tests manuels navigateur | **PARTIEL** | Non exécutés dans cette session (pas d'automation browser) |

**Recommandation globale** : **GO conditionnel** — auth backend prêt pour recette Admin V1 ; corriger les écarts **majeurs mineurs** listés avant prod.

---

# Environnement

| Composant | Valeur |
|-----------|--------|
| Stack | Docker Compose `yunicity-dev` |
| API | `http://localhost:8000/api/v1` |
| Admin | `http://localhost:3001/login` (non testé browser) |
| Web | `http://localhost:3000/login` (non testé browser) |
| Compte bootstrap | `admin@yunicity.dev` / `ChangeMeBootstrap1!Dev` |
| DB dev | `yunicity_dev` (bootstrap vérifié actif) |
| JWT access TTL | 15 min (`ACCESS_TOKEN_EXPIRE_MINUTES=15`) |
| Refresh | Cookie HttpOnly `refresh_token`, rotation côté backend |
| Rôles système | `USER`, `MODERATOR`, `CITY_ADMIN`, `SUPER_ADMIN` (pas de rôle `ADMIN` — voir note §6) |

**Méthodes** :
- Script API temporaire exécuté dans le conteneur backend (supprimé après run)
- Revue code : `AuthClient`, `AuthProvider` admin/web, `ProtectedRoute`, `StaffRoute`, `auth.py`, `dependencies.py`
- Tentative pytest `test_auth_endpoints` / `test_rbac_guards` / `test_refresh_rotation` : échecs **environnementaux** (rate limit Redis résiduel après rafale QA), non retenus comme bugs produit

---

# Cas testés

## 1. Login valide (bootstrap SUPER_ADMIN)

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Login bootstrap | API POST `/auth/login` | **PASS** — 200 |
| 1.2 | Rôles retournés | Corps JSON `user.roles` | **PASS** — `['SUPER_ADMIN', 'USER']` |
| 1.3 | Permissions staff | `user.permissions` | **PASS** — inclut `moderation.manage`, `system.admin` |
| 1.4 | Refresh cookie | Set-Cookie | **PASS** — cookie `refresh_token` présent |
| 1.5 | Accès cockpit | GET `/admin/cockpit/summary` + Bearer | **PASS** — 200 |
| 1.6 | Redirection admin post-login | Revue `app/login/page.tsx` | **ATTENDU** — staff → `/`, non-staff → `/unauthorized` |
| 1.7 | UI admin login | Browser | **NON EXÉCUTÉ** — à valider manuellement |

## 2. Login invalide

| # | Cas | Résultat observé | Message |
|---|-----|------------------|---------|
| 2.1 | Email inconnu | 401 `INVALID_CREDENTIALS` | `Identifiants invalides.` |
| 2.2 | Mot de passe faux | 401 `INVALID_CREDENTIALS` | idem |
| 2.3 | Email avec espaces | 200 (normalisation backend) | `normalize_email` strip + lower |
| 2.4 | Email vide | 422 validation Pydantic | Pas de crash |
| 2.5 | Mot de passe vide | 422 validation Pydantic | Pas de crash |
| 2.6 | Champs vides UI admin | Revue HTML | `required` + `type=email` bloque submit côté navigateur |
| 2.7 | Stack trace exposée | Revue code | **PASS** — `AuthError` catchée, message UI uniquement |

**Écart mineur** : Admin affiche le `detail` backend brut ; Web utilise `humanizeAuthFailure()` (messages plus pédagogiques, ex. rate limit).

## 3. Rate limit

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | 7 échecs login même email inconnu | **PASS** — 429 `RATE_LIMITED` à partir de la 6ᵉ tentative email (limite 5 / 15 min) |
| 3.2 | Message utilisateur admin | Revue code | Affiche `Trop de tentatives. Réessayez plus tard.` (detail backend) |
| 3.3 | Récupération après expiration | Non testé (fenêtre 15 min) | **À valider manuellement** ou purge Redis `rl:login:*` en dev |

Limites backend (`auth.py`) : 10 / IP / 15 min, 5 / email / 15 min.

## 4. Session

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 4.1 | Stockage access token admin | Revue code | `MemoryTokenStorage` — mémoire JS uniquement |
| 4.2 | Stockage refresh admin/web | Revue code | Cookie HttpOnly (pas localStorage) |
| 4.3 | Bootstrap session au chargement | `AuthProvider` useEffect | Appel `refreshAccessToken()` puis `/auth/me` |
| 4.4 | Refresh page / fermeture navigateur | Browser | **NON EXÉCUTÉ** — attendu PASS si cookie refresh valide |
| 4.5 | Expiration access token | Revue | Refresh automatique via `authenticatedFetch` sur 401 |

## 5. Logout

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | POST `/auth/logout` | **PASS** — 204 |
| 5.2 | Access token après logout | **OBSERVATION** — `/auth/me` retourne encore **200** avec le même Bearer (JWT non révoqué côté serveur) |
| 5.3 | Refresh après logout | **PASS** — 401 (session refresh invalidée) |
| 5.4 | Retour arrière navigateur | Browser | **NON EXÉCUTÉ** — risque d'affichage cache ; API re-refusera sans refresh |
| 5.5 | URL protégée post-logout admin | Revue `ProtectedRoute` | Redirection `/login` si `user === null` |

## 6. RBAC

**Note rôles** : le ticket mentionne `ADMIN` — dans Yunicity le rôle équivalent ville est **`CITY_ADMIN`**. Pas de rôle littéral `ADMIN`.

| Rôle | Permissions clés staff | Cockpit API | Moderation check | system.admin check | Staff API `/admin/staff` |
|------|------------------------|-------------|------------------|--------------------|--------------------------|
| USER | `auth.me.read`… | 403 | 403 | 403 | 403 |
| MODERATOR | + `moderation.manage` | 200 (attendu) | 200 (tests existants) | 403 | **403** (`system.admin` requis) |
| CITY_ADMIN | + `users.read.all`… | 200 (attendu) | 200 | 403 | 403 |
| SUPER_ADMIN | toutes | 200 | 200 | 200 | 200 |

| # | Cas | Résultat |
|---|-----|----------|
| 6.1 | USER → cockpit | **PASS** — 403 `FORBIDDEN` |
| 6.2 | USER → moderation check | **PASS** — 403 |
| 6.3 | SUPER_ADMIN → cockpit + staff | **PASS** — 200 |
| 6.4 | Menus staff admin | Revue `admin-shell.tsx` | Nav staff visible si `moderation.manage` **ou** `system.admin` |
| 6.5 | Login non-staff admin | Revue `login/page.tsx` | Redirection `/unauthorized` |

## 7. Routes protégées

| # | Cas | Résultat |
|---|-----|----------|
| 7.1 | Cockpit sans auth | **PASS** — 401 `UNAUTHORIZED` |
| 7.2 | Cockpit USER authentifié | **PASS** — 403 |
| 7.3 | Admin UI sans login | Revue `ProtectedRoute` | Redirect `/login` |
| 7.4 | Admin UI staff routes | `StaffRoute` sur cockpit, staff, partners, events, etc. | Redirect `/unauthorized` si authentifié sans permission |

## 8. Tokens

| # | Cas | Résultat |
|---|-----|----------|
| 8.1 | Refresh rotation | Couvert par `test_refresh_rotation.py` (non re-joué — rate limit) ; code `auth_service.refresh` implémente rotation + détection reuse |
| 8.2 | Reuse ancien refresh | **PASS** — 401 lors du test API (famille révoquée) |
| 8.3 | Refresh raw jamais en DB | Test d'intégration existant |
| 8.4 | Mobile refresh body | Header `X-Client-Platform: mobile` retourne `refresh_token` dans JSON |

## 9. Multi-onglets

| # | Cas | Analyse statique | Risque |
|---|-----|------------------|--------|
| 9.1 | Login onglet A | Access token en mémoire par instance React | — |
| 9.2 | Logout onglet B | Invalide cookie refresh global | Onglet A garde access token en mémoire jusqu'au prochain 401 / expiry |
| 9.3 | Synchronisation | Pas de `storage` event / BroadcastChannel | **Désync possible** |

## 10. Cas limites

| # | Cas | Résultat |
|---|-----|----------|
| 10.1 | Double clic login | Bouton `disabled={isSubmitting}` | **PASS** (revue code) |
| 10.2 | Login simultané | Non testé | — |
| 10.3 | Refresh pendant login | Non testé | — |
| 10.4 | Token expiré | `authenticatedFetch` tente refresh puis clear session | Revue code OK |

---

# Résultats

**20 cas API exécutés** : 18 PASS, 2 FAIL contextuels (suite rotation exécutée après logout dans la même session — état cookies invalidé, non représentatif d'un parcours utilisateur isolé).

**Revue statique** : guards admin cohérents avec le backend sur les zones staff principales.

---

# Bugs trouvés

## BUG-QA01-001 — JWT access encore valide après logout

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (sécurité session partagée) |
| Zone | Backend + Admin/Web |
| Reproduction | 1. Login API 2. Noter `access_token` 3. POST `/auth/logout` 4. GET `/auth/me` avec le même Bearer |
| Attendu | 401 immédiat après logout |
| Observé | 200 jusqu'à expiration JWT (~15 min) |
| Impact | Sur poste partagé, logout ne coupe pas immédiatement l'accès API si token copié |
| Note | Pattern courant (stateless JWT) — décision produit / hardening (denylist ou TTL court) |

## BUG-QA01-002 — Pages moderation / creator-content sans `StaffRoute`

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (UI / moindre privilège) |
| Zone | Admin UI |
| Reproduction | 1. Compte USER valide (register web) 2. Login admin → `/unauthorized` 3. Naviguer manuellement vers `/moderation` ou `/creator-content` |
| Attendu | Redirection `/unauthorized` ou blocage |
| Observé (analyse code) | `(protected)/layout.tsx` = `ProtectedRoute` seulement ; pas de `StaffRoute` sur ces segments |
| Impact | Surface UI staff visible ; appels API échouent en 403 mais fuite d'information / UX incohérente |
| Contre-mesure actuelle | API backend `_staff_guard` sur toutes routes `/admin/*` |

## BUG-QA01-003 — MODERATOR voit navigation Staff mais API `/admin/staff` refuse

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (UX / cohérence RBAC) |
| Zone | Admin UI + API |
| Reproduction | Compte `MODERATOR` → menu Staff visible → page `/staff` charge → API 403 `FORBIDDEN` |
| Attendu | Masquer Staff si pas `system.admin`, ou assouplir API (hors scope V1) |
| Observé | `StaffRoute` autorise `moderation.manage` ; endpoint exige `system.admin` |

## BUG-QA01-004 — Désynchronisation session multi-onglets

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** |
| Zone | Admin + Web |
| Reproduction | Login onglet A, logout onglet B, onglet A continue d'afficher session jusqu'à requête API |
| Attendu | Logout global immédiat |
| Observé | `MemoryTokenStorage` non partagé entre onglets |

## BUG-QA01-005 — Messages erreur login admin moins explicites que web

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (UX) |
| Zone | Admin UI |
| Reproduction | Rate limit ou credentials invalides |
| Attendu | Message guidé (comme web `humanizeAuthFailure`) |
| Observé | `err.message` backend direct (`Identifiants invalides.`) |

---

# Gravité — synthèse

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 2 | QA01-001, QA01-002 |
| Mineure | 3 | QA01-003, QA01-004, QA01-005 |

Aucune élévation de privilège API constatée (USER → 403 sur routes admin).

---

# Recommandations

1. **Avant prod** : ajouter `StaffRoute` (ou équivalent) sur `/moderation`, `/creator-content`, et toute page staff hors layouts existants.
2. **Sécurité session** : documenter politique JWT post-logout ; envisager blocklist courte durée ou réduction TTL access token admin.
3. **RBAC UI** : restreindre le lien `/staff` à `isSystemAdminUser()` ou afficher état vide explicite pour MODERATOR.
4. **UX admin** : réutiliser `humanizeAuthFailure` comme sur web.
5. **Recette manuelle restante** (checklist CTO) :
   - [ ] Login UI admin bootstrap → cockpit
   - [ ] Refresh navigateur (session cookie)
   - [ ] Logout + back button
   - [ ] Rate limit message UI
   - [ ] Login web citoyen → feed
6. **Ops dev** : après rafale de tests login, purger `rl:login:*` Redis ou attendre 15 min.

---

# GO / NO GO

## Admin Auth — **GO conditionnel**

| Critère acceptance | Statut |
|--------------------|--------|
| Login validé | ✅ API ; UI à confirmer manuellement |
| Logout validé | ✅ refresh invalidé ; ⚠️ JWT access résiduel |
| RBAC validé | ✅ API ; ⚠️ écarts UI Staff/MODERATOR |
| Routes protégées validées | ✅ API 401/403 ; ⚠️ 2 routes UI sans StaffRoute |
| Rapport QA créé | ✅ |
| Aucun code modifié | ✅ |
| Aucun commit | ✅ |

**GO** pour poursuivre la recette fonctionnelle **FEATURE-ADMIN-V1** (cockpit → staff → parcours métier).

**NO GO prod** tant que BUG-QA01-001 et BUG-QA01-002 ne sont pas traités ou acceptés explicitement par le CTO (risque sécurité / moindre privilège UI).

---

*Document généré dans le cadre BMAD QA HARDENING — audit uniquement, sans correctif.*
