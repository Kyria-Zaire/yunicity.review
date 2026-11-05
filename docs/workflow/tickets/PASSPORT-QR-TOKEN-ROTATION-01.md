# PASSPORT-QR-TOKEN-ROTATION-01 — Rotation des jetons QR Passport exposés · PRÉPRODUCTION

> **Statut : procédure préparée le 2026-11-05, NON exécutée.** Né de
> `PASSPORT-QR-THIRD-PARTY-01`. ⛔ **ZONE ROUGE** (jetons porteurs).
> **Périmètre : préproduction (Preview `dazzling-wisdom`) UNIQUEMENT.**
> ⛔ **Production exclue** : aucune lecture ni action sans demande explicite de
> Kyria — un éventuel volet production fera l'objet d'une décision séparée.
> Exécution soumise à **validation explicite de Kyria**.

## 1. Pourquoi

Jusqu'au correctif `PASSPORT-QR-THIRD-PARTY-01`, l'image du QR était demandée à
`https://api.qrserver.com/v1/create-qr-code/?…&data=<payload>` : le contenu du
QR partait chez ce tiers à chaque affichage — **établi sur la Preview** (code
servi + appel observé en QA locale sur le même code).

| Jeton | Contenu du QR | Durée de vie | Action |
|---|---|---|---|
| **Passport citoyen** | `YNCP1:<qr_token>` | **statique, sans rotation** (`generate_qr_token_placeholder` : `qr_ph_` + `secrets.token_urlsafe(24)`) | **rotation nécessaire** — un jeton exposé reste valable indéfiniment |
| **Tampon partenaire** | URL de réclamation avec JWT `passport_stamp` | **24 h max** (`STAMP_QR_MAX_EXPIRES_MINUTES = 1440`) | **aucune** — expirés d'eux-mêmes 24 h après émission |

Aucune trace serveur ne dit **quels** QR ont été affichés : la seule option sûre
est la rotation de **tous les Passports actifs de la Preview**.

## 2. Conséquences pour les anciens QR

- **Tout QR Passport citoyen affiché, capturé ou imprimé AVANT la rotation
  devient invalide.** Au scan partenaire, le serveur répond **`404
  PASSPORT_NOT_FOUND`** (`scan_redemption_service.py`, recherche
  `get_active_by_qr_token`) — le partenaire voit un refus.
- **Le citoyen n'a rien à faire** : en rouvrant `/passport` (ou le détail
  d'offre), le QR est **régénéré sur l'appareil** à partir du nouveau jeton.
  Une page déjà ouverte garde l'ancien QR jusqu'au rechargement.
- **App mobile** : si elle met en cache le `qr_payload`, ce cache devient
  invalide jusqu'au prochain chargement — **non vérifié** (hors web).
- **Redemptions et tampons déjà enregistrés** : **inchangés** (la rotation ne
  touche que `qr_token`).
- **Recette en cours** : tout QR de test gardé en capture (recette G-2,
  scénarios manuels) doit être **régénéré** après la rotation.
- **Retour arrière** = restaurer les anciens jetons, donc **les réactiver alors
  qu'ils sont exposés** : à n'utiliser qu'en cas d'incident bloquant.

## 3. Procédure — préproduction uniquement (à valider, non exécutée)

**Pré-requis**
1. Correctif `PASSPORT-QR-THIRD-PARTY-01` **déployé sur la Preview** et vérifié :
   aucune référence ni requête `api.qrserver.com` dans la version servie.
   *Sinon le nouveau jeton repart chez le tiers au premier affichage.*
2. Fenêtre annoncée aux personnes qui recettent sur la Preview.

**Outil** — script de maintenance **dédié et revu**, sur le modèle de
`backend/scripts/` (`backfill_*`, `data_cleanup_01_*`) ; **pas de SQL brut** :
- `--dry-run` par défaut : compte les Passports actifs **sans rien écrire** ;
- `--apply` : pour chaque Passport actif, `qr_token =
  generate_qr_token_placeholder()` dans **une transaction** ; contrainte
  `uq_passports_qr_token` respectée ;
- garde-fou d'environnement : **refuse de s'exécuter** si la base ciblée n'est
  pas celle de la Preview ;
- **aucun jeton journalisé** (ni ancien ni nouveau) : seulement des compteurs ;
- test automatisé sur base jetable (dry-run sans écriture ; apply change tous
  les jetons actifs, unicité préservée, ancien jeton refusé au scan).

**Exécution (Preview)**
1. Sauvegarde de la table `passports` de la base Preview (procédure Railway de
   l'environnement) ; vérifier qu'elle est relisible.
2. `--dry-run` → nombre de Passports actifs **N**, consigné.
3. Validation de Kyria sur **N**.
4. `--apply` → **N** jetons changés, consigné.

**Contrôles après**
- nombre de jetons changés = **N** ;
- sur `preview.yunicity.city` : un QR régénéré se **décode** et est **accepté**
  au scan partenaire (compte partenaire de recette requis — **aucun n'est
  documenté à ce jour**) ;
- un ancien QR (capture de test) est **refusé** (`PASSPORT_NOT_FOUND`) ;
- aucune requête vers `api.qrserver.com` pendant ces contrôles.

## 3 bis. ✅ Préparé le 2026-11-05 — branche `chore/passport-qr-token-rotation` (non commitée, non poussée)

**Outil**
- `backend/app/repositories/passport_repository.py` : `count_by_status`,
  `list_ids`, `set_qr_token`.
- `backend/app/services/passport_qr_rotation_service.py` : `preview()`
  (compte, **n'écrit rien**) et `rotate_all()` (nouveau `qr_token` pour
  **chaque Passport, tout statut** — un Passport suspendu puis réactivé ne doit
  pas retrouver un jeton exposé ; ne commite pas).
- `backend/scripts/rotate_passport_qr_tokens.py` : **simulation par défaut** ;
  **ciblage Railway** (le nom de base seul ne distingue pas les
  environnements) : `--expected-railway-project`, `--expected-railway-environment`,
  `--expected-railway-service` comparés à `RAILWAY_PROJECT_ID` /
  `RAILWAY_ENVIRONMENT_ID` / `RAILWAY_SERVICE_ID` — **vérifiés avant toute
  requête, simulation comprise** s'ils sont fournis, **obligatoires** avec
  `--execute` ; l'écriture exige en plus `--expected-database <nom>` et
  `--expected-count <N>` (= `current_database()` et nombre réel) — sinon
  **refus** (code 2) ; une transaction, **rollback** en cas d'échec ; sortie =
  cible (noms + identifiants Railway) et **compteurs seulement**.

**Tests** — `backend/tests/test_passport_qr_rotation.py` (**12** : 6 ciblage Railway, 5 garde-fous, 1 intégration), base jetable
(`scripts/qa-backend-pytest-host.sh`, base `yunicity_test_*` supprimée) :
garde-fous (5) ; intégration : simulation sans écriture → rotation → **tous les
Passports (dont un suspendu) changent de jeton**, unicité, **ancien QR refusé
`404 PASSPORT_NOT_FOUND`**, **nouveau QR accepté `200`** au `POST
/api/v1/scan/resolve` (lecture seule) d'un partenaire de test, **aucun jeton**
dans le rapport ni les journaux. **Mutation** : rotation partielle → test
rouge. `ruff`, `mypy` verts ; avec les tests existants scan / API Passport /
QR de tampon : **30 passed**.

**Simulation locale** (QA, base `yunicity_qa`, lecture seule) :
`[simulation] base=yunicity_qa passports_total=2 par_statut=(active=2)
jetons_remplaces=0`. Tentative `--execute` avec mauvaise base et mauvais nombre
→ **deux refus**, aucune écriture.

**Aucun lancement automatique — vérifié** : service API Preview
`unified-media-preview` (`8c799b6b-…`) construit par **Railpack** depuis
`/backend` ; démarrage `python -m app.runtime.unified_process` ; pré-déploiement
`alembic upgrade head` **seulement** ; **aucune migration** dans ce lot ; le code
de rotation n'est importé que par le script et ses tests (`app/runtime`,
`app/main.py`, `workers`, `alembic` : aucune référence).

**Cible Preview (pour la simulation)** : projet `dazzling-wisdom`
`9e19425b-a3c7-4a01-a4ba-debb5207ff19` · environnement `production` *(nom
Railway de l'unique environnement du projet Preview)*
`fe15407b-5f4f-4ae6-9026-6e4ae65f0cd4` · service `unified-media-preview`
`8c799b6b-fff1-465d-80fc-eff6112b077a`.

**Simulation prévue** (lecture seule), depuis le poste, une fois l'accès SSH
ouvert :

```
railway ssh --project 9e19425b-a3c7-4a01-a4ba-debb5207ff19   --environment fe15407b-5f4f-4ae6-9026-6e4ae65f0cd4   --service 8c799b6b-fff1-465d-80fc-eff6112b077a --   python scripts/rotate_passport_qr_tokens.py     --expected-railway-project 9e19425b-a3c7-4a01-a4ba-debb5207ff19     --expected-railway-environment fe15407b-5f4f-4ae6-9026-6e4ae65f0cd4     --expected-railway-service 8c799b6b-fff1-465d-80fc-eff6112b077a
```

**Accès Railway disponibles (vérifiés le 2026-11-05)** : CLI authentifiée ;
`railway ssh keys list` → **aucune clé enregistrée** ; clé locale
`~/.ssh/id_ed25519.pub` présente ; base `postgis-preview` **sans proxy TCP**
(réseau privé). **Étape unique pour Kyria** : `railway ssh keys add` (enregistre
la clé locale).

**Nombre de Passports de la Preview : NON OBTENU.** La base `postgis-preview`
n'a **aucun proxy TCP public** (réseau privé Railway seulement) : elle n'est pas
joignable depuis le poste. Voies possibles, **à décider** :
1. *(recommandée)* livrer le script sur la Preview (avance rapide), puis
   lancer la **simulation dans le service API Preview** via `railway ssh` —
   exige qu'une **clé SSH** soit ajoutée au compte Railway (action de Kyria).
2. Ouvrir un **proxy TCP temporaire** sur `postgis-preview` — **réglage
   d'infrastructure**, expose la base : déconseillé.
3. Compter par l'**API d'administration** Passport de la Preview — exige un
   **compte administrateur** sur la Preview (non documenté).

**Compte partenaire de test** : **aucun** sur la QA locale (aucun
`OrganizationMember` dans `qa_fixtures.py`) ni documenté sur la Preview.
Pour tester « ancien QR refusé / nouveau QR accepté » sur la Preview :
- créer un compte de test, lui faire **gérer une organisation vérifiée**
  (membre `owner` ou `admin` actif — règle `list_managed_organization_ids`) ;
- avant rotation : capturer le QR d'un citoyen de test ; `POST
  /api/v1/scan/resolve` (**lecture seule**) → `200` ;
- après rotation : même QR → `404 PASSPORT_NOT_FOUND` ; QR rechargé → `200`.
Le scénario est **déjà prouvé** en test automatisé sur base jetable ; la
Preview ajoute la preuve sur l'environnement réel.

**Constat de sécurité, NON traité** : `resolve_for_partner` cherche le Passport
**avant** de vérifier que l'appelant gère une organisation → tout utilisateur
connecté distingue un jeton valide (`403 SCAN_PARTNER_FORBIDDEN`) d'un jeton
inconnu (`404`). Consigné dans l'index (`SCAN-RESOLVE-TOKEN-ORACLE-01`).

## 4. Hors périmètre

- **Production** : décision séparée, sur demande explicite.
- Rotation **périodique** des `qr_token` (QR « live ») : ticket produit futur.
- Durcissement de la CSP (`img-src` `report-only`, `https:` générique).
- Recherche admin par `qr_token` (`admin_passport_repository.py`) : exposition
  interne du jeton, à revoir avec la rotation.
