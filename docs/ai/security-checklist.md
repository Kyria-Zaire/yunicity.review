# Checklist sécurité — Yunicity

À parcourir avant **merge vers main** (phase BUILD) et avant **release** (MEASURE → recette / preprod / prod).

Références : `docs/bmad/BMAD.md`, `docs/prd/PRD-template.md` §7, `.cursor/rules/04-reviewer-securite-code.mdc`.

## Secrets & configuration

- [ ] Aucun secret, token, mot de passe ou clé privée dans le diff
- [ ] `.env` ignoré par git ; `.env.example` à jour sans valeurs sensibles
- [ ] Variables prod injectées par l’hébergeur / CI, pas hardcodées
- [ ] Logs et erreurs client ne exposent pas de stack ni de détails internes en prod

## Authentification

- [ ] Login / register / OTP rate-limited
- [ ] Mots de passe hashés (bcrypt/argon2)
- [ ] Refresh tokens hashés en base
- [ ] JWT/session : expiration courte, refresh sécurisé, révocation possible
- [ ] OTP et magic links : expiration + limite de tentatives
- [ ] OAuth : validation `state` / `nonce`
- [ ] Déconnexion invalide le côté serveur si sessions stockées

## Autorisation

- [ ] Jamais faire confiance à un `user_id` fourni par le client
- [ ] Identité dérivée du contexte auth
- [ ] Ownership, rôles, membership ville/tribu vérifiés
- [ ] Pas d’IDOR : un utilisateur ne peut pas accéder aux ressources d’un autre
- [ ] Endpoints admin protégés et audités si applicable

## Validation & API

- [ ] Entrées validées (Pydantic / Zod) — types, tailles, enums
- [ ] Schemas de sortie sans champs privés
- [ ] Pagination sur les listes
- [ ] Réponses d’erreur stables, sans stack trace
- [ ] Uploads : MIME, taille max, stockage sécurisé
- [ ] Pas de SQL/commande OS depuis entrée utilisateur

## API & réseau

- [ ] HTTPS obligatoire en prod
- [ ] CORS : origines explicites (Next, Expo) — pas `*` avec credentials
- [ ] Headers sécurité web (CSP, X-Frame-Options, etc.)
- [ ] Pas de redirection ouverte non contrôlée

## Base de données

- [ ] Migrations Alembic revues
- [ ] Index sur FK et PostGIS si géo
- [ ] Backups avant prod ; migrations destructives planifiées
- [ ] Dry-run migration en preprod

## Webhooks & paiements

- [ ] Vérification signature webhook
- [ ] Corps brut préservé pour signature
- [ ] Table d’idempotence (`event.id`)
- [ ] Protection replay
- [ ] Cartes de test hors prod ; flux 3DS testé en recette/preprod
- [ ] Montants et statuts calculés côté serveur uniquement

## Frontend

- [ ] Aucun secret dans `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`
- [ ] XSS : pas de HTML non sanitizé
- [ ] Stockage token mobile sécurisé
- [ ] `rel="noopener noreferrer"` sur liens externes

## Anti-abus

- [ ] Cloudflare Turnstile sur formulaires publics à risque
- [ ] Honeypot sur formulaires
- [ ] Rate limiting sur endpoints sensibles
- [ ] Logs d’activité suspecte

## Données personnelles (RGPD)

- [ ] Collecte minimale ; rétention documentée
- [ ] Droit d’accès/suppression si données perso
- [ ] Pas de PII dans les logs
- [ ] Pas de copie de données prod brutes vers dev

## Release prod (DECIDE)

- [ ] Migrations testées en recette puis preprod
- [ ] Feature flags ou rollback documenté
- [ ] Monitoring 5xx et échecs auth
- [ ] Rotation des secrets si compromission suspectée

## Références

- OWASP API Security Top 10 : https://owasp.org/API-Security/
- Règle agent : `.cursor/rules/04-reviewer-securite-code.mdc`
