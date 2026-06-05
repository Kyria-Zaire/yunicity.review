# Récupération compte admin recette / dev (PLATFORM-AUTH-RECOVERY-01)

## Problème observé

Login web/admin renvoie `AuthError — Identifiants invalides` lorsque :

| Cause | Mécanisme backend |
|-------|-------------------|
| Email inconnu | `AuthService.login` → 401 `INVALID_CREDENTIALS` |
| Mot de passe incorrect | idem |
| Compte suspendu | 403 `ACCOUNT_SUSPENDED` (pas « Identifiants invalides ») |
| Rôle SUPER_ADMIN perdu | login OK mais accès admin/staff refusé |
| Seed `--pilot` ré-exécuté | peut écraser le hash d'un compte existant (collision email/UUID) |

Aucun `DELETE FROM users` / `TRUNCATE users` dans les seeds — la disparition est surtout due à **mot de passe écrasé**, **compte désactivé**, ou **rôle retiré**.

## Compte bootstrap

Variables d'environnement :

```env
YUNICITY_BOOTSTRAP_ADMIN_EMAIL=admin@yunicity.dev
YUNICITY_BOOTSTRAP_ADMIN_PASSWORD=<mot de passe fort>
YUNICITY_BOOTSTRAP_ADMIN_FULL_NAME=Yunicity Bootstrap Admin  # optionnel
```

En **dev/recette** uniquement : si les variables sont absentes, fallback documenté dans `.env.example`.

Le compte est marqué `users.is_system_account = true` et protégé contre suspension / retrait de rôle via l'API staff.

## Récupération rapide

```bash
# 1. Migration (si nouvelle colonne)
docker compose exec backend alembic upgrade head

# 2. Bootstrap idempotent
docker compose exec backend python scripts/bootstrap_admin.py

# 3. Vérifier login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yunicity.dev","password":"ChangeMeBootstrap1!Dev"}'
```

Le seed principal appelle la même logique :

```bash
docker compose exec backend python -m app.db.seeds
docker compose exec backend python -m app.db.seeds --pilot  # ne touche plus is_system_account
```

## Promotion manuelle (utilisateur existant)

```bash
docker compose exec backend python -m app.db.dev promote_user \
  --email votre.email@example.com --role SUPER_ADMIN
```

Nécessite un compte **déjà présent** avec mot de passe connu.

## Interdictions

- `scripts/bootstrap_admin.py` refusé si `APP_ENV=prod`
- Pas de bypass frontend, pas de mot de passe en dur dans le code applicatif (hors fallback dev/recette documenté)

## Protection compte système

Endpoints staff (`/api/v1/admin/staff/{id}/suspend`, `.../roles/{role}`) :

- Code : `STAFF_SYSTEM_ACCOUNT_PROTECTED`
- Message : `System account cannot be suspended or deleted.`
