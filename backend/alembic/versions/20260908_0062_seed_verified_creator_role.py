"""seed VERIFIED_CREATOR role (VIDEO-04D)

Revision ID: 20260908_0062
Revises: 20260829_0061

VIDEO-04D introduit le palier de duree `verified` (180 s), accorde par le seul role
RBAC `VERIFIED_CREATOR`. Le `preDeployCommand` des environnements n'execute que
`alembic upgrade head`, jamais les seeds : sans cette revision le role n'existe pas
en Preview, le palier reste inerte, et une attribution via ADMIN-08B echouerait.
La politique reste sure entre-temps (toute identite inconnue retombe sur pilot
90 s), mais la fonctionnalite ne serait pas livree.

Idempotente par construction (ON CONFLICT (key) DO NOTHING) : sure sur une base
vierge, sure sur une base deja seedee par `python -m app.db.seeds`, sure a rejouer.

Les valeurs sont inlinees plutot qu'importees de `app.db.seeds.auth_rbac`, comme
20260718_0055 l'a etabli : une revision doit rester un instantane historique
stable. Un futur changement de `ROLE_DEFINITIONS` devra livrer sa propre
migration au lieu de reecrire silencieusement ce que celle-ci a fait. Un test
verrouille l'egalite entre ces valeurs et `ROLE_DEFINITIONS` d'aujourd'hui, de
sorte que la duplication ne peut pas diverger sans etre vue.

Aucune permission n'est attachee et aucun utilisateur n'est associe : c'est un
role PRODUIT, il n'ouvre aucune surface d'administration.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260908_0062"
down_revision: str | None = "20260829_0061"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


#: Instantane des valeurs de `ROLE_DEFINITIONS["VERIFIED_CREATOR"]` a cette revision.
_ROLE_KEY = "VERIFIED_CREATOR"
_ROLE_NAME = "Créateur vérifié"
_ROLE_DESCRIPTION = "Palier de durée vidéo étendu (180 s)"


_INSERT_ROLE = sa.text(
    """
    INSERT INTO roles (id, key, name, description, is_system)
    VALUES (gen_random_uuid(), :key, :name, :description, true)
    ON CONFLICT (key) DO NOTHING
    """
)

_COUNT_ASSIGNMENTS = sa.text(
    """
    SELECT count(*)
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.key = :key
    """
)

_DELETE_ROLE = sa.text("DELETE FROM roles WHERE key = :key")


def upgrade() -> None:
    """Cree le role s'il manque. Ne touche a rien d'autre.

    Si le role existe deja — seed CLI joue avant la migration, ou revision rejouee —
    `ON CONFLICT DO NOTHING` laisse la ligne existante intacte : ni doublon, ni
    ecrasement du libelle, ni modification des roles historiques.
    """
    op.get_bind().execute(
        _INSERT_ROLE,
        {"key": _ROLE_KEY, "name": _ROLE_NAME, "description": _ROLE_DESCRIPTION},
    )


def downgrade() -> None:
    """Retire le role, mais REFUSE si des utilisateurs le portent.

    `user_roles.role_id` est en ON DELETE RESTRICT : la base refuserait deja la
    suppression. On verifie d'abord pour rendre un message explicite plutot qu'une
    erreur de contrainte, et pour garantir qu'aucune attribution utilisateur n'est
    detruite au passage. Aucun autre role n'est touche.
    """
    bind = op.get_bind()
    assigned = bind.execute(_COUNT_ASSIGNMENTS, {"key": _ROLE_KEY}).scalar_one()
    if assigned:
        raise RuntimeError(
            f"Downgrade refuse : {assigned} utilisateur(s) portent le role "
            f"{_ROLE_KEY}. Revoquez ces attributions via ADMIN-08B avant de "
            f"redescendre cette revision — supprimer le role detruirait des "
            f"donnees d'autorisation."
        )
    bind.execute(_DELETE_ROLE, {"key": _ROLE_KEY})
