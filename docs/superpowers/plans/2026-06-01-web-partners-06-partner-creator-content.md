# WEB-PARTNERS-06 — Partner Creator Content

> Découpage volontairement minimal — pas de marketplace créateurs.

## Vision

Partenaire → contenu créateur associé → visible fiche partenaire → visible feed local → préparation programme créateurs territoriaux.

## Sous-tickets

| Ticket | Scope | Hors scope |
|--------|--------|------------|
| **06A — Foundation** | Table `partner_creator_contents`, lien `Post` (FK), statuts + workflow, permissions org (owner/admin), API self-service `/organizations/me/creator-content`, types TS, tests API | Feed sync, fiche publique, admin UI web |
| **06B — Public Visibility** | `GET /partners/{slug}/creator-content`, rendu fiche partenaire web | Distribution feed |
| **06C — Feed Distribution** | `FeedCreatorContentSyncService`, type post `partner_creator`, ranking feed local | Programme créateurs, analytics |

## Modèle (06A)

- **`partner_creator_contents`** : source de vérité métier (titre, corps, média, statut, modération).
- **`posts.partner_creator_content_id`** : lien 1–1 optionnel vers le feed (rempli en 06C à la publication).
- Miroir du pattern `partner_offers` / `partner_offer_id`.

## Permissions (06A)

- Même rôles que offres/événements : `OrganizationMemberRole.OWNER | ADMIN` via `require_offer_manager`.
- Gate partenaire actif si `PartnerProfile` présent (`PARTNER_NOT_ACTIVE` sinon).
- Organisation vérifiée obligatoire.

## API (06A)

| Méthode | Route | Rôle |
|---------|-------|------|
| POST | `/organizations/me/creator-content` | Créer brouillon |
| GET | `/organizations/me/creator-content` | Lister (orgs gérées) |
| PATCH | `/organizations/me/creator-content/{id}` | Éditer brouillon/rejeté |
| POST | `/organizations/me/creator-content/{id}/submit` | → `pending_review` |

Branche : `feature/web-partners-06-partner-creator-content` depuis `main` propre.
