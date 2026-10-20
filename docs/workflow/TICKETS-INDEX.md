# Index des tickets

Point d'entrée unique pour savoir **sur quoi on travaille** et **où reprendre**.

S'inscrit dans le workflow officiel
([`YUNICITY-OFFICIAL-WORKFLOW.md`](YUNICITY-OFFICIAL-WORKFLOW.md)) : un ticket
traverse DISCOVER → DESIGN → BUILD → VERIFY → RELEASE, et sa **passation**
conserve l'état entre deux sessions de travail.

---

## Ticket actif

| Ticket | Phase | Passation |
|--------|-------|-----------|
| **État des lieux PR202 WEB et préparation de la recette** | VERIFY | [`passations/PR202-WEB-etat-des-lieux.md`](passations/PR202-WEB-etat-des-lieux.md) |

---

## Candidat suivant

| Ticket | Phase | Passation |
|--------|-------|-----------|
| **Recette fonctionnelle de la publication photo** | VERIFY | [`passations/PR202-WEB-recette-publication-photo.md`](passations/PR202-WEB-recette-publication-photo.md) |

---

## Tickets clos

| Ticket | Clos le | Trace |
|--------|---------|-------|
| **Isolation du déploiement Preview (image Docker)** | 2026-10-20 | [`../ops/INFRA-04-web-image-docker.md`](../ops/INFRA-04-web-image-docker.md) |

---

## Règles de tenue

1. **Un seul ticket actif.** Ouvrir un ticket, c'est d'abord fermer ou suspendre
   le précédent dans ce tableau.
2. **Une passation par ticket**, sous `passations/`, mise à jour **à chaque fin
   de session** — pas seulement à la clôture.
3. **Cet index est le seul endroit** qui désigne le ticket actif. Si une autre
   source le contredit, c'est cet index qui fait foi.
4. Un ticket clos garde un lien vers sa trace, pas vers sa passation : la trace
   est le document durable, la passation était l'outil de reprise.
5. **Aucune passation ne remplace une preuve.** Elle dit où la preuve se trouve
   et dans quel environnement elle a été obtenue.
