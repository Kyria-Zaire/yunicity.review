"""Racine media du service unifie : autorisation, arborescence, controle d'ecriture.

Posture
-------
`C3.1-R1D` interdisait le disque local sur un runtime manage, parce qu'il y etait
EPHEMERE : ecrire dedans, c'etait perdre les fichiers au redeploiement. Un volume
persistant retire ce motif -- mais seulement pour CE volume, pas pour un chemin
quelconque. On ne leve donc pas la posture : on l'ouvre sur une cible unique, nommee,
et sous opt-in explicite.

En recette/preprod/prod avec le backend filesystem, SIX conditions doivent tenir
ensemble, sans quoi le service refuse de demarrer :

1. `MANAGED_PERSISTENT_MEDIA_ENABLED` vaut explicitement vrai ;
2. la racine est un chemin absolu ;
3. elle est exactement la racine canonique `/data/media` ;
4. une sonde lecture/ecriture y aboutit ;
5. les sous-repertoires des trois domaines y sont confines ;
6. aucun d'eux n'est un lien symbolique sortant.

Le defaut est `false` : un service qui oublierait l'opt-in echoue bruyamment plutot
que d'ecrire sur une couche ephemere.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path, PurePosixPath

logger = logging.getLogger(__name__)

#: Seule racine acceptee sur un runtime manage. Toute autre valeur est refusee.
CANONICAL_MEDIA_ROOT = "/data/media"

#: Prefixe de la route publique servant les medias. Source unique, partagee par le
#: montage `MediaStaticFiles` et la construction des URLs enregistrees en base.
MEDIA_URL_PREFIX = "media"

#: Sous-repertoires derives des prefixes de cles des trois domaines
#: (`local-video/`, `profiles/`, `stories/`).
MEDIA_SUBDIRECTORIES: tuple[str, ...] = ("local-video", "profiles", "stories")

#: Environnements deployes : la politique stricte s'y applique.
DEPLOYED_ENVS = frozenset({"recette", "preprod", "prod"})


class MediaRootUnavailableError(RuntimeError):
    """La racine media n'est pas utilisable : le service ne peut pas rendre son service."""


def managed_persistent_media_opt_in(environ: dict[str, str] | None = None) -> bool:
    """Opt-in `MANAGED_PERSISTENT_MEDIA_ENABLED`, lu depuis l'environnement.

    `Settings` expose la meme variable ; ce lecteur existe pour les politiques media,
    qui sont appelees depuis des points sans `Settings` sous la main (`allowed_*_roots`)
    et qui lisent deja `os.environ` pour detecter Railway et pytest.
    """
    env = os.environ if environ is None else environ
    return env.get("MANAGED_PERSISTENT_MEDIA_ENABLED", "").strip().lower() in {
        "1", "true", "yes", "on",
    }


def is_managed_cloud_runtime(environ: dict[str, str] | None = None) -> bool:
    """Vrai sur Railway (ou tout hote exposant des variables RAILWAY*)."""
    env = os.environ if environ is None else environ
    return any(key.upper().startswith("RAILWAY") for key in env)


def _normalize(raw_dir: str) -> PurePosixPath:
    return PurePosixPath(raw_dir.strip().replace("\\", "/"))


def requires_strict_policy(*, app_env: str, managed_cloud: bool) -> bool:
    return app_env in DEPLOYED_ENVS or managed_cloud


def check_managed_media_policy(
    raw_dir: str,
    *,
    app_env: str,
    opt_in: bool,
    managed_cloud: bool,
) -> None:
    """Conditions 1 a 3 : opt-in, absolu, racine canonique. Pure, sans acces disque."""
    if not requires_strict_policy(app_env=app_env, managed_cloud=managed_cloud):
        return

    if not opt_in:
        raise MediaRootUnavailableError(
            "MANAGED_PERSISTENT_MEDIA_ENABLED doit valoir true pour utiliser le backend "
            f"filesystem en {app_env} sur un runtime manage. Sans volume persistant "
            "explicitement autorise, les medias seraient perdus au redeploiement."
        )

    normalized = _normalize(raw_dir)
    if not normalized.is_absolute():
        raise MediaRootUnavailableError(
            f"MEDIA_UPLOAD_DIR doit etre un chemin absolu (recu : {raw_dir!r})."
        )
    if ".." in normalized.parts:
        raise MediaRootUnavailableError(
            f"MEDIA_UPLOAD_DIR ne doit pas contenir '..' (recu : {raw_dir!r})."
        )
    if str(normalized) != CANONICAL_MEDIA_ROOT:
        raise MediaRootUnavailableError(
            f"MEDIA_UPLOAD_DIR doit etre exactement {CANONICAL_MEDIA_ROOT} sur un runtime "
            f"manage (recu : {raw_dir!r}). Un chemin arbitraire n'est jamais autorise : "
            "seul le volume persistant declare l'est."
        )


def _reject_outbound_symlinks(root: Path) -> None:
    """Condition 6 : aucun sous-repertoire ne doit pointer hors de la racine."""
    resolved_root = root.resolve()
    for name in MEDIA_SUBDIRECTORIES:
        child = root / name
        if not child.is_symlink():
            continue
        target = child.resolve()
        try:
            target.relative_to(resolved_root)
        except ValueError as exc:
            raise MediaRootUnavailableError(
                f"Le sous-repertoire media {name!r} est un lien symbolique pointant hors "
                f"de {root} ({target}) : refuse."
            ) from exc


def _confine(root: Path) -> None:
    """Condition 5 : chaque sous-repertoire reste sous la racine apres resolution."""
    resolved_root = root.resolve()
    for name in MEDIA_SUBDIRECTORIES:
        resolved_child = (root / name).resolve()
        try:
            resolved_child.relative_to(resolved_root)
        except ValueError as exc:
            raise MediaRootUnavailableError(
                f"Le sous-repertoire media {name!r} sort de la racine {root}."
            ) from exc


def prepare_media_root(
    raw_dir: str,
    *,
    app_env: str,
    opt_in: bool = False,
    managed_cloud: bool | None = None,
) -> Path:
    """Autorise, cree et prouve l'ecriture. Idempotent, rejouable a chaque demarrage."""
    managed = is_managed_cloud_runtime() if managed_cloud is None else managed_cloud
    check_managed_media_policy(
        raw_dir, app_env=app_env, opt_in=opt_in, managed_cloud=managed
    )

    root = Path(raw_dir.strip()).expanduser()
    strict = requires_strict_policy(app_env=app_env, managed_cloud=managed)
    try:
        root.mkdir(parents=True, exist_ok=True)
        _reject_outbound_symlinks(root)
        for name in MEDIA_SUBDIRECTORIES:
            (root / name).mkdir(parents=True, exist_ok=True)
        _confine(root)
        probe = root / ".yunicity-write-probe"
        probe.write_bytes(b"probe")
        if probe.read_bytes() != b"probe":
            raise OSError("relecture de la sonde incoherente")
        probe.unlink()
    except MediaRootUnavailableError:
        raise
    except OSError as exc:
        message = (
            f"Racine media inutilisable : {root} ({exc.strerror or exc}). "
            "Verifier le point de montage du volume et son proprietaire "
            f"(uid={os.getuid() if hasattr(os, 'getuid') else 'n/a'})."
        )
        if strict:
            raise MediaRootUnavailableError(message) from exc
        logger.warning("media_root_not_writable path=%s", root)
        return root

    logger.info(
        "media_root_ready path=%s subdirs=%s strict=%s",
        root,
        ",".join(MEDIA_SUBDIRECTORIES),
        strict,
    )
    return root
