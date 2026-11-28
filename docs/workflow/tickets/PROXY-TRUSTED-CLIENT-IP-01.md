# PROXY-TRUSTED-CLIENT-IP-01 — IP client dérivée d'un `X-Forwarded-For` non vérifié

⛔ **ZONE ROUGE** : limitation de débit et anti-abus.

| Champ | Valeur |
|-------|--------|
| **Statut** | 🟡 **OUVERT**, créé le 2026-11-27 sur décision CTO (D3 de PASSPORT-PRESENCE-01B) |
| **Origine** | Plan de PASSPORT-PRESENCE-01B : limite d'émission de sessions par IP |
| **Base observée** | `dcf30975` (`feat/c3-videos-refonte-final`) |
| **Production / `main`** | non traité |

## 1. Constat, prouvé par lecture du code à `dcf30975`

Onze modules définissent chacun leur propre `_client_ip(request)` :
`auth`, `map`, `notifications`, `organizations`, `passport`, `posts`, `profile`, `scan`,
`search`, `stories` et `tribes` (tous sous `backend/app/api/v1/`). Ces onze copies
retiennent toutes la **première** entrée de l'en-tête `X-Forwarded-For`, à défaut
`request.client.host`.

L'API démarre par `uvicorn app.main:create_app --factory --host 0.0.0.0 --port …`
(`app/runtime/unified_process.py`), sans option `--proxy-headers` ni
`--forwarded-allow-ips` explicite.

## 2. Risque

La première entrée de `X-Forwarded-For` est fournie par le client, sauf si le proxy
d'entrée **remplace** l'en-tête au lieu de compléter une valeur existante. Si Railway la
complète, un client peut choisir l'IP sous laquelle il est compté, et toute limite par
IP (connexion, inscription, publication, scan, émission de session de présence…) se
contourne en changeant cet en-tête à chaque requête.

**Non prouvé** : le comportement réel du proxy Railway (remplacement ou ajout de
`X-Forwarded-For`, nombre de sauts) n'a pas été observé. C'est une hypothèse à vérifier,
pas un constat.

## 3. Règle provisoire (CTO, 2026-11-27)

Tant que ce ticket n'est pas clos, une limite par IP n'est qu'une **protection
secondaire**. Elle ne doit jamais être présentée comme une garantie de sécurité. Les
protections principales restent les limites rattachées à un compte authentifié
(utilisateur, agent).

## 4. Travail attendu

1. Prouver le comportement du proxy Railway (Preview), par exemple avec une route de
   diagnostic temporaire, non exposée en production et sans journal d'IP persistant, ou
   avec la documentation Railway confrontée à une mesure.
2. Définir une fonction **unique** de résolution de l'IP client, fondée sur le nombre de
   proxys de confiance (entrée la plus à droite non fiable) ou sur la configuration
   `--forwarded-allow-ips` d'uvicorn, puis remplacer les onze copies.
3. Tests : en-tête forgé par le client sans effet sur la clé de comptage ; absence
   d'en-tête ; plusieurs sauts.
4. Revue sécurité humaine, Preview, puis décision séparée pour la production.

## 5. Hors périmètre

- Toute modification de PASSPORT-PRESENCE-01B : ce lot utilise la limite par IP comme
  protection secondaire, sans corriger `_client_ip`.
- Stockage d'IP : interdit pour le domaine de présence (B9) ; rien n'est ajouté ici.

## Prochaine action

Planification par le CTO. Aucune modification de code tant qu'un GO n'est pas donné sur
ce ticket.
