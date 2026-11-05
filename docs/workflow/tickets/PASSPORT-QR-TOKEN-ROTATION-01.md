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

## 4. Hors périmètre

- **Production** : décision séparée, sur demande explicite.
- Rotation **périodique** des `qr_token` (QR « live ») : ticket produit futur.
- Durcissement de la CSP (`img-src` `report-only`, `https:` générique).
- Recherche admin par `qr_token` (`admin_passport_repository.py`) : exposition
  interne du jeton, à revoir avec la rotation.
