"""Initialisation privilégiée du volume média, puis abandon irréversible des privilèges.

Pourquoi ce module existe
-------------------------
Mesure sur Railway (RAILWAY-PREVIEW-UNIFIED-CANDIDATE-12) : un volume attaché arrive
``root:root 0755`` sur un système de fichiers fraîchement formaté — ``lost+found`` est
présent, donc rien n'est hérité du répertoire de l'image que le montage recouvre. Le
conteneur tournant en ``app`` (uid 10001), ``mkdir /data/media/local-video`` échouait en
``Permission denied`` et le service refusait de démarrer.

Déplacer le montage d'un niveau (``/data``) ne ferait que déplacer le défaut : Railway
monterait ce répertoire de la même façon. La seule correction qui tienne est de créer et
d'attribuer l'arborescence AVANT que l'application n'existe, avec les privilèges qu'exige
un ``chown``, puis de les abandonner définitivement.

Contrat
-------
- si l'euid n'est pas 0, ce module ne fait RIEN : le comportement local non-root est
  inchangé, et l'image conserve son ``USER app`` ;
- si l'euid est 0, le volume doit être un VRAI point de montage — vérifié dans
  ``/proc/self/mountinfo``, jamais par une simple présence de répertoire ;
- absence de volume, lien symbolique, utilisateur applicatif introuvable, ``chown``,
  ``setgid`` ou ``setuid`` en échec : refus, exception, sortie non nulle AVANT le
  démarrage du moindre enfant. La séquence est fail-closed de bout en bout ;
- le ``chown`` porte sur QUATRE chemins exactement — la racine et ses trois domaines —
  jamais récursivement sur les médias déjà présents, jamais sur ``lost+found`` ;
- aucun assouplissement de permissions : pas de ``chmod``, pas de world-writable.
"""

from __future__ import annotations

import logging
import os
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

from app.core.media_root import CANONICAL_MEDIA_ROOT, MEDIA_SUBDIRECTORIES

logger = logging.getLogger("yunicity.unified.bootstrap")

#: Utilisateur applicatif de l'image (Dockerfile : uid/gid 10001 fixes).
APP_USERNAME = "app"

#: Source d'autorité pour « ce chemin est-il monté ». `Path.exists()` et `isdir()` ne
#: distinguent pas un volume d'un répertoire d'image : ils valideraient précisément la
#: situation qu'on doit refuser.
MOUNTINFO_PATH = "/proc/self/mountinfo"


class VolumeBootstrapError(RuntimeError):
    """Refus fail-closed. Le message est un motif stable, sans donnée sensible."""


# --- Indirections système -------------------------------------------------------------
# Isolées pour deux raisons : les tests unitaires ne doivent jamais changer l'identité du
# processus pytest, et ces appels n'existent pas sur toutes les plateformes.


def current_euid() -> int | None:
    """euid courant, ou None là où la notion n'existe pas (poste Windows)."""
    geteuid = getattr(os, "geteuid", None)
    return None if geteuid is None else int(geteuid())


def effective_ids() -> tuple[int | None, int | None]:
    getegid = getattr(os, "getegid", None)
    return current_euid(), (None if getegid is None else int(getegid()))


def read_mountinfo() -> str:
    return Path(MOUNTINFO_PATH).read_text(encoding="utf-8")


def _setgroups(groups: Sequence[int]) -> None:
    os.setgroups(list(groups))


def _setgid(gid: int) -> None:
    os.setgid(gid)


def _setuid(uid: int) -> None:
    os.setuid(uid)


def _chown(path: Path, uid: int, gid: int) -> None:
    os.chown(path, uid, gid)


def _is_symlink(path: Path) -> bool:
    return path.is_symlink()


def _realpath(path: Path) -> str:
    return _posix(os.path.realpath(path))


def _posix(path: Path | str) -> str:
    """Compare des chemins POSIX même quand les tests tournent sous Windows.

    Le runtime visé est Linux ; `pathlib` sous Windows rendrait `/data/media` en
    `\\data\\media` et ferait échouer une égalité pourtant vraie sur la cible.
    """
    return str(path).replace("\\", "/")


# --- Détection du volume --------------------------------------------------------------


def _unescape_mount_field(field: str) -> str:
    """`mountinfo` échappe en octal : \\040 espace, \\011 tab, \\012 LF, \\134 backslash."""
    parts: list[str] = []
    index = 0
    while index < len(field):
        char = field[index]
        octal = field[index + 1 : index + 4]
        if char == "\\" and len(octal) == 3 and all(digit in "01234567" for digit in octal):
            parts.append(chr(int(octal, 8)))
            index += 4
            continue
        parts.append(char)
        index += 1
    return "".join(parts)


def mounted_paths() -> frozenset[str]:
    """Points de montage vus par CE processus, lus dans ``/proc/self/mountinfo``.

    Champ 5 de chaque ligne (index 4) : le point de montage.
    """
    paths: set[str] = set()
    for line in read_mountinfo().splitlines():
        fields = line.split(" ")
        if len(fields) >= 5:
            paths.add(_unescape_mount_field(fields[4]))
    return frozenset(paths)


def assert_media_volume_mounted(root: Path) -> None:
    """Exige un volume réel sur exactement ``/data/media``. Fail-closed."""
    if _posix(root) != CANONICAL_MEDIA_ROOT:
        raise VolumeBootstrapError(
            f"MEDIA_ROOT_NOT_CANONICAL: attendu {CANONICAL_MEDIA_ROOT}, recu {root}"
        )
    if _is_symlink(root):
        raise VolumeBootstrapError(
            f"MEDIA_ROOT_IS_SYMLINK: {CANONICAL_MEDIA_ROOT} ne doit pas etre un lien "
            "symbolique — un lien deplacerait les medias hors du volume en silence"
        )
    real = _realpath(root)
    if real != CANONICAL_MEDIA_ROOT:
        raise VolumeBootstrapError(f"MEDIA_ROOT_RESOLVES_ELSEWHERE: {real}")
    if CANONICAL_MEDIA_ROOT not in mounted_paths():
        raise VolumeBootstrapError(
            f"MEDIA_VOLUME_NOT_MOUNTED: {CANONICAL_MEDIA_ROOT} n'est pas un point de "
            "montage. Sans volume persistant, les medias seraient perdus au "
            "redeploiement : le service refuse de demarrer plutot que d'ecrire sur la "
            "couche ephemere du conteneur."
        )


# --- Identité applicative -------------------------------------------------------------


@dataclass(frozen=True)
class AppIdentity:
    """Identité applicative telle que le système la déclare."""

    name: str
    uid: int
    gid: int
    home: str


def resolve_app_identity(username: str = APP_USERNAME) -> AppIdentity:
    """Identité lue dans le système, jamais dupliquée depuis le Dockerfile.

    Recopier 10001 ici créerait une seconde source de vérité, libre de diverger d'un
    rebuild qui déplacerait l'utilisateur — exactement la panne que les uid fixes du
    Dockerfile cherchent à empêcher.
    """
    import pwd  # Unix uniquement : importé au point d'usage, jamais au chargement.

    try:
        entry = pwd.getpwnam(username)
    except KeyError as exc:
        raise VolumeBootstrapError(
            f"APP_USER_NOT_FOUND: utilisateur {username!r} absent de l'image"
        ) from exc
    return AppIdentity(
        name=username,
        uid=int(entry.pw_uid),
        gid=int(entry.pw_gid),
        home=str(entry.pw_dir),
    )


def align_process_environment(identity: AppIdentity) -> None:
    """Recale HOME/USER sur l'identité applicative après l'abandon des privilèges.

    `setuid` ne touche pas l'environnement : démarré en root, le processus garde
    ``HOME=/root``, que l'uid 10001 ne peut plus lire. Des bibliothèques y cherchent
    pourtant des fichiers par utilisateur — mesuré : asyncpg évalue
    ``$HOME/.postgresql/postgresql.key`` et lève ``PermissionError``, de sorte que la
    sonde de readiness rapportait ``database: error`` alors que la base répondait.
    """
    os.environ["HOME"] = identity.home
    os.environ["USER"] = identity.name
    os.environ["LOGNAME"] = identity.name


# --- Préparation et abandon des privilèges --------------------------------------------


def chown_targets(root: Path) -> tuple[Path, ...]:
    """La racine et ses trois domaines — rien d'autre, jamais leur contenu."""
    return (root, *(root / name for name in MEDIA_SUBDIRECTORIES))


def prepare_media_volume(root: Path, uid: int, gid: int) -> tuple[Path, ...]:
    """Crée les sous-répertoires manquants et attribue les QUATRE chemins attendus.

    Non récursif volontairement : les médias déjà présents gardent leur propriétaire, et
    un volume rempli ne paie pas un parcours complet à chaque démarrage. ``lost+found``,
    qui appartient au système de fichiers, n'est jamais touché.
    """
    targets = chown_targets(root)
    for path in targets[1:]:
        path.mkdir(parents=True, exist_ok=True)
    for path in targets:
        try:
            _chown(path, uid, gid)
        except OSError as exc:
            raise VolumeBootstrapError(
                f"MEDIA_CHOWN_FAILED: {path} ({exc.strerror or exc})"
            ) from exc
    return targets


def drop_privileges(uid: int, gid: int) -> None:
    """setgroups → setgid → setuid, puis vérification. Irréversible.

    L'ordre est imposé : abandonner l'uid en premier retirerait le droit de changer de
    groupe, laissant le processus dans les groupes de root.
    """
    try:
        _setgroups([gid])
        _setgid(gid)
        _setuid(uid)
    except OSError as exc:
        raise VolumeBootstrapError(
            f"PRIVILEGE_DROP_FAILED: {exc.strerror or exc}"
        ) from exc

    euid, egid = effective_ids()
    if euid != uid or egid != gid:
        raise VolumeBootstrapError(
            f"PRIVILEGE_DROP_UNVERIFIED: euid={euid} egid={egid}, attendu {uid}/{gid}"
        )


def bootstrap_media_volume(root: Path | None = None) -> bool:
    """Point d'entrée. Renvoie True si la séquence privilégiée a été exécutée.

    Hors root — poste de dev, image locale avec son ``USER app``, CI — ne fait rien :
    le comportement non privilégié reste le comportement par défaut.
    """
    euid = current_euid()
    if euid != 0:
        logger.info("unified_bootstrap_skipped euid=%s", euid)
        return False

    media_root = Path(CANONICAL_MEDIA_ROOT) if root is None else root
    assert_media_volume_mounted(media_root)
    identity = resolve_app_identity()
    targets = prepare_media_volume(media_root, identity.uid, identity.gid)
    logger.info(
        "unified_bootstrap_prepared paths=%s uid=%s gid=%s",
        ",".join(str(path) for path in targets),
        identity.uid,
        identity.gid,
    )
    drop_privileges(identity.uid, identity.gid)
    align_process_environment(identity)
    euid_after, egid_after = effective_ids()
    logger.info(
        "unified_bootstrap_dropped euid=%s egid=%s home=%s",
        euid_after,
        egid_after,
        identity.home,
    )
    return True
