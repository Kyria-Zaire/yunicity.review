# AUDIT-CSP-01 — La Content-Security-Policy est inerte

> **Statut** : constat consigné, **aucune modification de sécurité effectuée**.
> **Origine** : relevé incident pendant la validation élargie WEB (PR202), le 12/10/2026.
> **Nature** : à instruire dans un audit de sécurité dédié, hors boucle de recette.

## Le constat

L'application sert sa politique en **report-only, sans aucun point de collecte**.
Elle ne bloque donc rien, et ne rapporte rien non plus : elle est sans effet.

WebKit le dit explicitement dans la console, et c'est ainsi que le constat a été
découvert — le moteur journalise, là où Chromium reste muet :

> `The Content Security Policy '<politique>' was delivered in report-only mode,`
> `but does not specify a 'report-to'; the policy will have no effect. Please`
> `either add a 'report-to' directive, or deliver the policy via the`
> `'Content-Security-Policy' header.`

## Ce qui est établi, et comment

| Fait | Preuve |
|------|--------|
| La politique est délivrée en report-only | `frontend/apps/web/lib/security-headers.ts` pose `Content-Security-Policy-Report-Only` |
| Par en-tête HTTP, et non par `<meta>` | `curl -D -` sur `/login` renvoie `content-security-policy-report-only: default-src 'self'; …` |
| Aucune directive de rapport | zéro occurrence de `report-to`, `report-uri` ou `reporting-endpoints` dans la politique |
| Aucun en-tête de rapport | zéro en-tête `Reporting-Endpoints` ou `Report-To` servi |
| Le test existant ne couvre pas le point | `lib/security-headers.test.ts` vérifie que l'en-tête **est défini**, pas qu'il puisse rapporter |

## Pourquoi cela compte

Le mode report-only est le palier normal avant une mise en application : on
observe les violations, puis on bascule. Ici le palier est vide. Aucune
violation n'est collectée, donc rien ne peut être observé, donc la bascule ne
dispose d'aucune donnée. Le dispositif donne l'apparence d'une protection sans
en produire l'effet ni le renseignement — c'est le pire des deux états, parce
qu'il se lit comme un acquis.

La politique elle-même n'est pas en cause et n'a pas été évaluée ici. Le constat
porte sur sa **délivrance**.

## Pistes pour l'audit, à arbitrer ailleurs

Trois directions, non tranchées :

1. Ajouter `report-to` et l'en-tête `Reporting-Endpoints` correspondant, en
   conservant le report-only : la politique produit alors du renseignement.
2. Basculer en `Content-Security-Policy` applicatif après avoir mesuré les
   violations réelles — jamais avant, sous peine de casser des pages.
3. Retirer l'en-tête s'il est décidé de ne pas investir : un en-tête inerte
   présent est plus trompeur qu'absent.

Chacune touche la sécurité de la plateforme et relève d'une décision humaine,
avec revue dédiée. **Rien n'a été modifié dans la boucle de recette où ce
constat est apparu.**

## Rattachement

- Zone rouge « sécurité » du workflow officiel : revue dédiée requise.
- Source unique des règles : `docs/ai/security-checklist.md`.
- Découvert via la spec `26-medium-feed-stories-long-rail` sous WebKit, dont le
  relevé de console imprimait le message intégral.
