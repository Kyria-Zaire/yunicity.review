# ADR-ENV-01 — Environnements Recette / Production

| Champ | Valeur |
|-------|--------|
| Statut | **PROPOSED** |
| Feature | PLATFORM-FOUNDATION |
| Ticket | ADR-ENV-01 |
| Date | 2026-06-16 |
| Auteur | Architecture (synthèse précédents Yunicity) |
| Liens | `docs/governance/AI-COLLABORATION.md`, `docs/workflow/FEATURE-ROADMAP-POST-RC.md`, `docs/qa/MEDIA-INFRA-V1-smoke-test.md`, `backend/docs/test-database-safety.md`, `docs/ops/INFRA-01-cloudflare-setup-checklist.md` |

---

## Contexte

Yunicity est **déployée et utilisée** sur Railway avec frontend, backend, PostgreSQL, Redis, stockage Cloudflare R2, CDN et domaines publics (`*.yunicity.city`).

La doctrine projet documente une hiérarchie `dev → recette → preprod → prod` (`.cursor/rules/09-environments.mdc`, `docs/governance/AI-COLLABORATION.md`). En pratique, **l'exploitation opérationnelle repose aujourd'hui sur un déploiement unique** qui sert à la fois le trafic réel et une part significative des validations équipe (Reality Checks, smoke tests, seeds pilotes).

Cette ADR tranche **quand** une Recette distincte devient une exigence — pas **comment** la provisionner.

---

## Précédents Yunicity (faits observés)

| # | Précédent | Source | Implication |
|---|-----------|--------|-------------|
| P1 | **Production opérationnelle** — stack Railway + Postgres + Redis + R2 + CDN en service | Contexte projet ; `docs/qa/RF-02B-seed-deployment-checklist.md` (`api.yunicity.city`) | Les utilisateurs et partenaires consomment déjà la plateforme live |
| P2 | **Reality Checks RC-01 à RC-06** exécutés sur la plateforme réelle (notes ~6,1/10) | `docs/workflow/FEATURE-ROADMAP-POST-RC.md` | Les audits produit/ops ont porté sur l'environnement live, pas sur une recette isolée |
| P3 | **Smoke MEDIA-INFRA-V1** (`pilot_m00_seed_videos.py --smoke`) crée utilisateurs `pilot-m00-*@example.com`, vidéos et objets R2 sur l'API cible ; cleanup storage partiel, **résidus DB possibles** | `docs/qa/MEDIA-INFRA-V1-smoke-test.md` §3.1, §Cleanup DB | Les comptes et médias de test **cohabitent** avec les données réelles sur la stack visée |
| P4 | **Avertissement explicite** : ne pas lancer `--smoke` sur prod sans GO CTO | `docs/qa/MEDIA-INFRA-V1-smoke-test.md` §Prod safety | L'équipe reconnaît le risque de collision test / prod sur le même déploiement |
| P5 | **Near-miss secrets R2 / variables Railway** — tokens injectés hébergeur, jamais en git ; procédure L4 si fuite | `docs/governance/AI-COLLABORATION.md` §2.5.C | Un environnement unique concentre le risque de mauvaise variable (bucket prod, `APP_ENV`, clés R2) |
| P6 | **Worker vidéo** partage `DATABASE_URL`, `REDIS_URL` et token R2 avec l'API via références Railway | `docs/ops/INFRA-03-railway-video-worker-setup.md` §4 | Toute validation worker touche les mêmes dépendances que le trafic utilisateur |
| P7 | **Incident pytest / dev DB** — tests d'intégration destructifs sur la base dev partagée (disparition compte admin bootstrap) ; correctif `PLATFORM-TEST-DB-SAFETY-01` | `backend/docs/test-database-safety.md` | Preuve interne que **partager une ressource d'état** entre dev/test et exploitation entraîne des incidents évitables |
| P8 | **Creators V2** — backend upload async mergé ; **client upload public et ouverture prod** encore ouverts (`VIDEO-04A–D`) | `docs/workflow/FEATURE-ROADMAP-POST-RC.md` §VIDEO-04 ; `docs/ops/VIDEO-01-media-storage-readiness.md` (NO-GO prod publique uploads) | Prochaine vague = écriture média par utilisateurs réels — surface de risque accrue |
| P9 | **Démonstrations partenaires** — parcours pilote Reims, comptes `pilot-*`, checklist recette partenaires | `docs/product-review/WEB-PARTNERS-REVIEW-01.md`, `docs/superpowers/specs/2026-06-01-web-partners-08-pilot-readiness-design.md` | Besoin croissant de montrer des parcours complets sans polluer l'expérience citoyenne live |
| P10 | **Nommage recette documenté** (`api.recette.yunicity.city`, `yunicity-media-recette`) sans séparation opérationnelle complète de bout en bout | `docs/ops/INFRA-01-cloudflare-setup-checklist.md`, `docs/architecture/MEDIA-PLATFORM.md` | La cible architecturale existe sur le papier ; l'isolation runtime n'est pas encore une garantie |

---

## Question

**À partir de quel moment Yunicity devra disposer d'un environnement Recette distinct de la Production, et pourquoi ?**

---

## 1. Pourquoi un environnement unique était adapté au démarrage

| Facteur | Observation Yunicity |
|---------|----------------------|
| **Time-to-market** | Lancer Reims pilote sur une stack Railway unique a permis Reality Checks, merges VIDEO-03A/INFRA-03 et smoke R2 sans latence de provisioning multi-env |
| **Charge faible** | RC moyenne ~6,1 — plateforme crédible mais sous-alimentée ; pas de pic uploads vidéo publics |
| **Équipe réduite** | Founder + CTO ; une stack = une vérité ops, un seul jeu de secrets à maintenir (hors git) |
| **Backend upload async récent** | Publish 202 + worker ARQ validé smoke ~2,6 s happy path — pas encore de flux massif créateurs |
| **Coût cognitif** | Doctrine `dev → recette → prod` posée ; implémentation progressive acceptable en phase pilote |

**Conclusion :** l'environnement unique était un **choix rationnel de phase 0** — vitesse et simplicité prioritaires sur l'isolation.

---

## 2. Pourquoi cela devient insuffisant

| Risque | Précédent |
|--------|-----------|
| **Pollution données** | Seeds `pilot-m00-*`, résidus smoke, comptes partenaires pilote mélangés aux citoyens réels (P3, P9) |
| **Effets de bord non reproductibles** | Reality Checks et smokes sur prod live rendent difficile de distinguer régression déploiement vs état données (P2, P4) |
| **Erreurs de configuration** | Near-miss secrets R2 / variables Railway — une confusion `APP_ENV` ou bucket sur stack unique impacte immédiatement les utilisateurs (P5) |
| **Écriture média publique** | VIDEO-04 ouvrira uploads citoyens ; magic bytes (VIDEO-03B.1) et retry worker (VIDEO-03B.2) durcissent le backend mais pas le risque « test sur prod » (P8) |
| **Démonstrations partenaires** | Parcours write (offres, events, scan) sur stack live sans sandbox dédiée (P9) |
| **Dette déjà payée en local** | PLATFORM-TEST-DB-SAFETY-01 montre que sans séparation, les outils de validation **endommagent** l'environnement qu'ils testent (P7) — pattern reproduisable côté Railway si non traité |

---

## 3. Déclencheur officiel de la séparation Recette / Production

La séparation **devient obligatoire avant** le **premier jalon** parmi les suivants *(le premier atteint déclenche l'exigence)* :

| Priorité | Jalon | Justification |
|----------|-------|---------------|
| **J1 (bloquant)** | **Merge + déploiement du client upload public Creators V2** (`VIDEO-04B` ou équivalent — premier PUT média citoyen hors équipe interne) | Écriture binaire irreversible (R2) + données sociales ; gate prod CREATORS-V2 (`FEATURE-ROADMAP-POST-RC.md`) |
| **J2 (bloquant)** | **Démonstration partenaire avec parcours write** (création offre/event/vidéo visible publiquement) sur infrastructure Yunicity | Besoin produit explicite (P9) sans impact citoyens réels |
| **J3 (fortement recommandé)** | **Exécution récurrente de smoke / seeds automatisés** (`pilot_m00`, seeds pilote partenaires) **plus** d'une fois par semaine | P3, P4 — collision test/prod devient structurelle |

**Date cible recommandée :** Recette opérationnelle **avant le merge de VIDEO-04B** (client upload), soit **avant Q3 2026** si la roadmap CREATORS-V2 reste inchangée — à confirmer par Product Authority lors du GO VIDEO-04A.

**Ce qui n'est pas un déclencheur :** merges backend seuls (VIDEO-03A/B), doc sync, Reality Checks read-only, dev local Docker.

### Constat du déclenchement

- **Product Authority** constate qu'un des jalons J1, J2 ou J3 est atteint ou planifié.
- **Architecture Authority** ouvre le ticket d'implémentation correspondant.
- Ce constat est tracé dans le ticket concerné conformément à `docs/governance/AI-COLLABORATION.md` (DOC-GOV-01).

---

## 4. Bénéfices attendus de la séparation

| Bénéfice | Lien précédent |
|----------|----------------|
| **Sandbox validation** | Smoke, seeds `pilot-*`, migrations Alembic testées sans résidu sur prod (P3, P7) |
| **Démos partenaires** | Parcours write complets sur `*.recette.yunicity.city` (P9, P10) |
| **Réduction blast radius** | Rotation secrets / buckets R2 recette vs prod (P5, INFRA-01 least-privilege) |
| **BMAD MEASURE fiable** | Métriques recette avant promote prod — aligné doctrine `09-environments.mdc` |
| **Confiance déploiement** | Worker ARQ, FFmpeg, Redis testés sur recette avant promote (P6, VIDEO-03A) |

---

## Architecture cible (haut niveau)

Description volontairement haute niveau — sans plan d'implémentation.

### Recette

| Composant | Cible |
|-----------|-------|
| Railway | Projet Railway dédié |
| Données | PostgreSQL dédié |
| Queue / cache | Redis dédié |
| Médias | Bucket Cloudflare R2 dédié |
| Exposition | Domaine `*.recette.yunicity.city` |

### Production

| Composant | Cible |
|-----------|-------|
| Infrastructure | Infrastructure actuelle |
| Isolation | Complètement isolée de la Recette |

**Niveau d'isolation recherché :** séparation complète des ressources d'état (données, files, objets, secrets, déploiements) entre Recette et Production — aucun partage runtime.

Les choix d'implémentation détaillés seront définis dans le futur ticket d'exécution, lorsque l'un des déclencheurs J1, J2 ou J3 sera atteint.

---

## 5. Pourquoi cette décision n'implique pas une implémentation immédiate

| Raison | Fait |
|--------|------|
| **Gate prod uploads pas encore franchi** | VIDEO-04 client absent ; NO-GO prod publique uploads documenté (P8) |
| **Correctifs sécurité récents mergés** | VIDEO-03B.1 (magic bytes), VIDEO-03B.2 (retry) réduisent le risque backend sans exiger recette demain |
| **Coût provisioning non trivial** | Postgres, Redis, Railway services, buckets R2, DNS, secrets — hors scope ADR (P10) |
| **Pilote Reims encore en phase carburant terrain** | RF-01 à RF-05 prioritaires sur infra parallèle (`FEATURE-ROADMAP-POST-RC.md`) |
| **Nature de cet artefact** | ADR = décision datée ; chantier infra = ticket(s) futur(s) après GO Founder + CTO |

---

## Décision

| Horizon | Décision |
|---------|----------|
| **Court terme (now → avant J1/J2)** | **Maintenir l'environnement unique opérationnel** pour le pilote Reims live, sous discipline stricte : pas de `--smoke` sur prod sans GO CTO (P4), pas de seeds destructifs sur stack live, secrets Railway hors git (P5) |
| **Avant jalon J1 ou J2** | **Créer une Recette distincte de la Production** — bases, Redis, buckets R2 et déploiements Railway séparés ; domaines `*.recette.yunicity.city` dédiés à la validation et aux démos |
| **Cet ADR** | **Aucune implémentation** — pas de modification Railway, pas de ticket technique créé, pas de changement prod |

**Statut cible après validation Founder + CTO :** `APPROVED` — puis référence obligatoire pour tout ticket infra environnements futur.

---

## Conséquences

| Type | Description |
|------|-------------|
| **Positive** | Décision claire ; déclencheurs mesurables ; alignement doctrine vs réalité ops |
| **Négative (acceptée)** | Court terme : risque résiduel test/prod tant que J1/J2 non atteints |
| **Neutre** | Le nommage « recette » déjà présent dans la doc devra être **réaligné** sur une recette réellement isolée lors du chantier futur |

---

## Alternatives rejetées

| Alternative | Raison du rejet |
|-------------|-----------------|
| Recette immédiate (maintenant) | Coût et charge ops disproportionnés vs gates prod non franchis (§5) |
| Recette uniquement au GO prod national | Trop tard pour VIDEO-04 et démos partenaires (J1, J2) |
| Preprod avant recette | Yunicity n'a pas encore de preprod opérationnelle ; recette suffit pour la prochaine étape (P10) |
| Environnement unique permanent | Contredit P3–P7 ; dette ops croissante avec uploads publics |

---

## Références

- `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — phases DISCOVER → RELEASE
- `docs/governance/AI-COLLABORATION.md` — Authority Matrix, incident secrets
- `docs/workflow/FEATURE-ROADMAP-POST-RC.md` — gate CREATORS-V2, VIDEO-04
- `docs/qa/MEDIA-INFRA-V1-smoke-test.md` — collision test/prod
- `backend/docs/test-database-safety.md` — précédent séparation dev/test
