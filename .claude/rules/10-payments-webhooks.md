---
paths:
  - "backend/**/*payment*"
  - "backend/**/*webhook*"
  - "backend/**/*stripe*"
  - "frontend/**/*payment*"
  - "frontend/**/*checkout*"
---

# Payments & webhooks

## Principes

- **Le serveur fait foi** : montants, statuts et droits issus de la DB + provider — jamais du client seul.
- Webhooks = source de vérité asynchrone ; l’UI affiche un état provisoire jusqu’à confirmation.

## Stripe (convention)

1. **Checkout / PaymentIntent** créé côté backend avec `amount` calculé serveur.
2. Client reçoit uniquement `client_secret` ou `session_id` — pas de prix modifiable côté JS.
3. Webhook `POST /api/v1/webhooks/stripe` :
   - Vérifier signature (`stripe.Webhook.construct_event`).
   - Traiter **idempotent** : clé = `event.id` en table `processed_webhooks`.
   - Répondre 200 rapidement ; travail lourd en tâche async si besoin.

```python
# ✅ Idempotence webhook
if await webhook_repo.exists(event.id):
    return {"status": "already_processed"}
await payment_service.handle_event(event)
await webhook_repo.mark_processed(event.id)
```

## États commande / abonnement

- Machine à états explicite : `pending` → `paid` → `refunded` / `failed`.
- Transitions uniquement via service métier, pas de PATCH client sur `status`.

## Frontend

- Afficher succès seulement après polling ou redirect validé serveur.
- Ne pas stocker de données carte — Stripe Elements / Checkout hébergé.

## Tests

- Fixtures événements Stripe signés (CLI ou mocks).
- Cas : double delivery webhook, événement hors ordre, remboursement.

Sécurité : `04-reviewer-securite-code.md`.

# Payments and Webhooks Rules

## Payment Environments
Payment provider must support test mode.
Use test cards in dev, recette, and preprod.
Never use real cards outside prod.

## 3D Secure
Test 3D Secure flows using provider test cards.
Do not fake successful payments in business logic.

## Webhook Rules
Webhook handlers must be:
- signature verified
- idempotent
- logged
- tested
- replay-safe

## Forbidden
- Do not delete accounts from a webhook.
- Do not trust client payment status.
- Do not fulfill premium access before confirmed provider state.
- Do not process same webhook event twice.

## Required Tables Later
Consider:
- payment_events
- subscriptions
- invoices
- partner_billing_accounts
- webhook_event_log