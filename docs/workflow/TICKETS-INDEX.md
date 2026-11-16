# Index des tickets

Point d’entrée unique pour savoir **sur quoi on travaille** et **où reprendre**.

S’inscrit dans le workflow officiel
([`YUNICITY-OFFICIAL-WORKFLOW.md`](YUNICITY-OFFICIAL-WORKFLOW.md)) : un ticket
traverse DISCOVER → DESIGN → BUILD → VERIFY → RELEASE, et sa **passation**
conserve l’état entre deux sessions.

---

## ⏭️ REPRISE — à lire en premier *(2026-11-16)*

### Périmètre d’intervention autorisé

| Autorisé | Hors intervention |
|----------|-------------------|
| Repo GitHub **`Kyria-Zaire/yunicity.review`** | Production **`yunicity.city`** (et `www`) |
| Preview **`preview.yunicity.city`** + API Preview associée | Services Railway / CDN **production** (`api.yunicity.city`, `media.yunicity.city`, admin prod, etc.) |
| Branche de livraison Preview **`feat/c3-videos-refonte-final`** | Branche **`main`** et tout déclencheur qui redéploie la prod |

**Déclencheurs (cibles effectives, d’après docs ops / INFRA-04 / PROFILE-POST-MENU) :**

- Services Preview (`yunicity.review` web + `unified-media-preview` API) : watch
  GitHub sur **`feat/c3-videos-refonte-final`** → déploiement auto au push FF
  (sans `--force`). Domaine web Preview : **`preview.yunicity.city`**.
- Config web Preview : `/frontend/railway.web-docker.toml` (volontairement **pas**
  `railway.toml`, pour éviter qu’un service prod enraciné sur `frontend/` hérite
  du builder Docker).
- Services **production** (`yunicity.city`) : hors périmètre — **ne pas** pousser
  sur `main` ni toucher leurs configs / variables sans demande explicite.

✅ **Revue CTO terminée** (diff documentaire de réconciliation).
**GO : commit local uniquement** — aucun push ni déploiement.
SHA produit Preview documenté inchangé : **`cb028a72`**.

### Worktree de reprise

| | |
|--|--|
| Worktree | `C:\Users\kyria\yunicity-wt-video-lot1` |
| Branche locale | `feat/video-refonte-l3l4-mobile-v23` |
| HEAD local (relevé réconciliation) | **`cb028a72`** |
| Branche Preview / livraison | `feat/c3-videos-refonte-final` (tip documenté **`cb028a72`**) |

### Ticket actif

**Aucun ticket produit ouvert.**

Clôtures CTO du **2026-11-16** (recette finale Preview **`cb028a72`**) :

| Ticket | Passation | Note SHA |
|--------|-----------|----------|
| ✅ `VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01` | [`passations/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01.md`](passations/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01.md) | Livraison/clôture **`cb028a72`** ; validations nav/auth/Safari **conservées sur `2d0c48c4`** |
| ✅ `VIDEO-REFONTE-L7-DESKTOP-GRILLE-01` | [`passations/VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-grille-mixte.md`](passations/VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-grille-mixte.md) | Code **`a30c9346`** ; clos avec tip **`cb028a72`** |
| ✅ `VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01` | [`passations/VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01-lecteur-superpose.md`](passations/VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01-lecteur-superpose.md) | idem |
| ✅ `VIDEO-REFONTE-L9-DESKTOP-01` | [`passations/VIDEO-REFONTE-L9-DESKTOP-01-ouverture-echec.md`](passations/VIDEO-REFONTE-L9-DESKTOP-01-ouverture-echec.md) | idem |
| ✅ `VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01` | [`passations/VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01.md`](passations/VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01.md) | Correctifs sur **`2d0c48c4`** ; clos avec la série |

**Ne pas relancer** les recettes validées. **Ne pas** attribuer les validations
`2d0c48c4` à `cb028a72`.

### Prochaine action (une seule)

**Revue CTO terminée → GO commit local uniquement** (aucun push / deploy).
Périmètre : 30 chemins de
[`LISTE-FICHIERS-PROPOSES-AU-COMMIT.txt`](LISTE-FICHIERS-PROPOSES-AU-COMMIT.txt).
Message : `docs(workflow): reconcile handoffs and video ticket closures`.
SHA Preview documenté : **`cb028a72`** (inchangé).

Après ce commit local : `/clear` et **choix du prochain sujet par Kyria**
(aucun ticket produit pré-ouvert).

Rapport : [`RAPPORT-RECONCILIATION-PASSATIONS-2026-11-16.md`](RAPPORT-RECONCILIATION-PASSATIONS-2026-11-16.md).

---

## Suspendus (NON clos) — hors actif

| Ticket | État connu |
|--------|------------|
| `VIDEO-REFONTE-IOS-SAFARI-P0-02` | Suspendu (NON clos) |
| `VIDEO-REFONTE-L3L4-MOBILE-01` | Suspendu (NON clos) |
| `VIDEO-REFONTE-L1-COMMANDES-01` | Suspendu (NON clos) |
| `VIDEO-REFONTE-L1B-CREATEURS-01` | Suspendu (NON clos) |

Détail historique : archives d’index (ne pas traiter comme instructions actuelles).

---

## Clos récents (repères)

| Ticket | SHA / stade | Passation |
|--------|-------------|-----------|
| L2 partage | Preview **`815c6bdf`** | [`passations/VIDEO-REFONTE-L2-PARTAGE-01-partage-h1-h2-h3.md`](passations/VIDEO-REFONTE-L2-PARTAGE-01-partage-h1-h2-h3.md) |
| L5 medium | code **`e49f4bb4`**, tip docs **`3b1586bb`** | [`passations/VIDEO-REFONTE-L5-MEDIUM-01-fil-vertical.md`](passations/VIDEO-REFONTE-L5-MEDIUM-01-fil-vertical.md) |
| Photo recette | clos **2026-10-22** (réserves) | [`passations/PR202-WEB-recette-publication-photo.md`](passations/PR202-WEB-recette-publication-photo.md) |
| PROFILE-POST-MENU | Preview **`2ebdbe96`** (2026-11-02) | [`passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md`](passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md) |
| APP-SQL | Preview **`6ef03cee`** ; C5 `FastAPI(debug=False)` | [`passations/APP-SQL-ERROR-VALUES-01-erreurs-sql.md`](passations/APP-SQL-ERROR-VALUES-01-erreurs-sql.md) |
| Passport self-redeem | Preview **`eef6fd62`** | [`passations/PASSPORT-SELF-REDEEM-API-01-auto-consommation.md`](passations/PASSPORT-SELF-REDEEM-API-01-auto-consommation.md) |
| Scan oracle | Preview **`1900fb01`** | [`passations/SCAN-RESOLVE-TOKEN-ORACLE-01-oracle-jeton.md`](passations/SCAN-RESOLVE-TOKEN-ORACLE-01-oracle-jeton.md) |

Autres : QR tiers (outil rotation **livré**, rotation **NON exécutée**) ;
FEED-NEW (défaut 5 photos **non reproduit**, mitigation seulement) ;
DEPS-NEXT (historique + suspension — **pas** de réactivation d’autorisation prod).

---

## Archives d’index (historiques)

**Sélectionnées pour le commit documentaire** (seuls fichiers sous
`docs/workflow/archives/` dans ce worktree) :

| Fichier | Rôle |
|---------|------|
| [`archives/TICKETS-INDEX-avant-reconciliation-2026-11-16-video-lot1.md`](archives/TICKETS-INDEX-avant-reconciliation-2026-11-16-video-lot1.md) | Ancien index **court photo** de ce worktree — **à committer** |
| [`archives/TICKETS-INDEX-historique-complet-pr202-ci-WT-2026-11-16.md`](archives/TICKETS-INDEX-historique-complet-pr202-ci-WT-2026-11-16.md) | Copie de l’index **enrichi** de `yunicity-wt-pr202-ci` — **à committer** (ne pas exécuter ses bandeaux) |

**Hors ces deux fichiers :** aucun autre contenu sous `docs/workflow/archives/`
ici. Les index des **autres** worktrees n’ont **pas** été écrasés ; ce sont des
copies historiques distinctes, **hors** périmètre de commit de ce chantier.

---

## Règles de tenue

1. **Un seul ticket actif.** Ouvrir un ticket = d’abord fermer ou suspendre le précédent ici.
2. **Une passation par ticket**, mise à jour **à chaque fin de session**.
3. **Cet index désigne le ticket actif.** En cas de conflit, **il fait foi**.
4. **Une preuve garde son SHA et son environnement.**
5. Archives ZIP de continuité (hors dépôt) : ne pas les modifier.
