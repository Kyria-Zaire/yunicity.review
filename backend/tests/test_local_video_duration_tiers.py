"""VIDEO-04D — paliers de duree par createur.

Politique (arbitrage CTO) :
    role RBAC `VERIFIED_CREATOR` -> verified -> 180 s
    tout le reste                -> pilot    ->  90 s

Le palier staff 300 s n'est PAS active (VIDEO-04D-STAFF-300-CAPACITY).

Ces tests verrouillent la retombee sure : toute identite indeterminee, tout role
inconnu, tout signal non canonique (`User.is_verified`, organisation verifiee)
donne 90 s. Aucune video n'est generee : `_probe_media` est mocke.
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

import pytest
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_MAX_BYTES,
    LOCAL_VIDEO_MAX_DURATION_SECONDS,
    LOCAL_VIDEO_UPLOAD_RATE_LIMIT,
    LOCAL_VIDEO_VERIFIED_MAX_DURATION_SECONDS,
)
from app.core.local_video_duration_policy import (
    VERIFIED_CREATOR_ROLE_KEY,
    LocalVideoDurationTier,
    max_duration_for_roles,
    resolve_duration_policy,
    resolve_duration_tier,
)
from app.db.seeds.auth_rbac import ROLE_DEFINITIONS, ROLE_PERMISSION_KEYS
from app.services.local_video.processor import LocalVideoMediaProcessor

pytestmark = pytest.mark.unit


# --------------------------------------------------------------------------
# Politique — source unique
# --------------------------------------------------------------------------


def test_pilot_is_ninety_seconds() -> None:
    assert max_duration_for_roles(["USER"]) == 90
    assert LOCAL_VIDEO_MAX_DURATION_SECONDS == 90


def test_verified_creator_is_one_hundred_eighty_seconds() -> None:
    assert max_duration_for_roles([VERIFIED_CREATOR_ROLE_KEY]) == 180
    assert LOCAL_VIDEO_VERIFIED_MAX_DURATION_SECONDS == 180


@pytest.mark.parametrize(
    "roles",
    [
        None,
        [],
        ["USER"],
        ["ROLE_QUI_N_EXISTE_PAS"],
        ["MODERATOR"],
        ["CITY_ADMIN"],
        ["SUPER_ADMIN"],
    ],
)
def test_every_other_identity_falls_back_to_pilot(roles: list[str] | None) -> None:
    """Retombee sure. Le staff n'obtient PAS 180 ni 300 dans cette livraison."""
    assert resolve_duration_tier(roles) is LocalVideoDurationTier.PILOT
    assert max_duration_for_roles(roles) == 90


def test_staff_with_verified_creator_gets_one_eighty_only() -> None:
    """Un staff ne recoit 180 que s'il porte explicitement le role produit."""
    assert max_duration_for_roles(["SUPER_ADMIN", VERIFIED_CREATOR_ROLE_KEY]) == 180


def test_three_hundred_seconds_is_never_reachable() -> None:
    """Le palier staff 300 s est reporte : aucune combinaison ne doit l'ouvrir."""
    for roles in (
        [VERIFIED_CREATOR_ROLE_KEY],
        ["SUPER_ADMIN"],
        ["SUPER_ADMIN", "MODERATOR", VERIFIED_CREATOR_ROLE_KEY],
        list(ROLE_DEFINITIONS.keys()),
    ):
        assert max_duration_for_roles(roles) <= 180


def test_policy_exposes_size_and_label() -> None:
    policy = resolve_duration_policy([VERIFIED_CREATOR_ROLE_KEY])
    assert policy.tier is LocalVideoDurationTier.VERIFIED
    assert policy.max_duration_seconds == 180
    assert policy.max_bytes == LOCAL_VIDEO_MAX_BYTES
    assert policy.label


# --------------------------------------------------------------------------
# RBAC — le role est produit, jamais administratif
# --------------------------------------------------------------------------


def test_verified_creator_role_is_seeded() -> None:
    assert VERIFIED_CREATOR_ROLE_KEY in ROLE_DEFINITIONS


def test_verified_creator_role_grants_no_permission() -> None:
    """Verrou : un role produit ne doit conferer aucun droit administratif."""
    assert ROLE_PERMISSION_KEYS[VERIFIED_CREATOR_ROLE_KEY] == frozenset()


def test_verified_creator_is_not_a_platform_staff_role() -> None:
    from app.core.staff_admin_constants import (
        ASSIGNABLE_STAFF_ROLE_KEYS,
        STAFF_PLATFORM_ROLE_KEYS,
    )

    assert VERIFIED_CREATOR_ROLE_KEY not in STAFF_PLATFORM_ROLE_KEYS
    # ... mais il reste attribuable/revocable par le mecanisme ADMIN-08B existant.
    assert VERIFIED_CREATOR_ROLE_KEY in ASSIGNABLE_STAFF_ROLE_KEYS


def test_client_supplied_tier_cannot_reach_the_policy() -> None:
    """La politique ne lit que des cles de role. Un `creator_tier` client est inerte."""
    assert max_duration_for_roles(["verified"]) == 90
    assert max_duration_for_roles(["creator_tier=verified"]) == 90
    assert max_duration_for_roles(["VERIFIED"]) == 90  # casse differente = non reconnu


def test_publish_schema_has_no_tier_field() -> None:
    """Aucun champ de tier ne doit exister dans le contrat de publication."""
    from app.schemas.local_video import LocalVideoPublishRequest

    champs = set(LocalVideoPublishRequest.model_fields)
    assert not {c for c in champs if "tier" in c.lower() or "duration" in c.lower()}


# --------------------------------------------------------------------------
# Frontieres appliquees par le processeur
# --------------------------------------------------------------------------


class _StubStorage:
    def read_to_path(self, storage_key: str, destination: Path) -> None:
        del storage_key
        destination.write_bytes(b"\x00" * 32)

    def build_processed_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return f"local-video/{city_slug}/{video_id}/processed.mp4"

    def build_thumbnail_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return f"local-video/{city_slug}/{video_id}/thumbnail.jpg"

    def upload_file(self, source: Path, storage_key: str, content_type: str) -> None:
        del source, storage_key, content_type


def _processor(
    monkeypatch: pytest.MonkeyPatch,
    duration_seconds: float,
) -> LocalVideoMediaProcessor:
    settings: Settings = get_settings().model_copy(
        update={"local_video_max_duration_seconds": LOCAL_VIDEO_MAX_DURATION_SECONDS},
    )
    proc = LocalVideoMediaProcessor(settings, _StubStorage())  # type: ignore[arg-type]
    monkeypatch.setattr(shutil, "which", lambda name: f"/usr/bin/{name}")
    monkeypatch.setattr(proc, "_probe_media", lambda path: (duration_seconds, 640, 360))
    monkeypatch.setattr(proc, "_maybe_transcode", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        proc,
        "_extract_thumbnail",
        lambda source, destination: Path(destination).write_bytes(b"\xff\xd8\xff"),
    )
    return proc


def _run(proc: LocalVideoMediaProcessor, limite: int | None):  # type: ignore[no-untyped-def]
    return proc.process(
        source_storage_key="local-video/reims/source.mp4",
        city_slug="reims",
        video_id=uuid.uuid4(),
        content_type="video/mp4",
        max_duration_seconds=limite,
    )


@pytest.mark.parametrize("duree", [89.0, 90.0])
def test_pilot_boundary_accepts(monkeypatch: pytest.MonkeyPatch, duree: float) -> None:
    assert _run(_processor(monkeypatch, duree), 90).duration_seconds == duree


def test_pilot_boundary_rejects_ninety_one(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(AppError) as exc:
        _run(_processor(monkeypatch, 91.0), 90)
    assert exc.value.code == "LOCAL_VIDEO_TOO_LONG"
    assert exc.value.detail == "Vidéo trop longue (max. 90 s)."


@pytest.mark.parametrize("duree", [179.0, 180.0])
def test_verified_boundary_accepts(monkeypatch: pytest.MonkeyPatch, duree: float) -> None:
    assert _run(_processor(monkeypatch, duree), 180).duration_seconds == duree


def test_verified_boundary_rejects_one_eighty_one(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(AppError) as exc:
        _run(_processor(monkeypatch, 181.0), 180)
    assert exc.value.code == "LOCAL_VIDEO_TOO_LONG"
    assert exc.value.detail == "Vidéo trop longue (max. 180 s)."


def test_pilot_cannot_reach_the_verified_ceiling(monkeypatch: pytest.MonkeyPatch) -> None:
    """Une video de 150 s est refusee a un pilote, acceptee a un createur verifie."""
    with pytest.raises(AppError) as exc:
        _run(_processor(monkeypatch, 150.0), max_duration_for_roles(["USER"]))
    assert exc.value.code == "LOCAL_VIDEO_TOO_LONG"
    assert (
        _run(
            _processor(monkeypatch, 150.0),
            max_duration_for_roles([VERIFIED_CREATOR_ROLE_KEY]),
        ).duration_seconds
        == 150.0
    )


def test_absent_snapshot_falls_back_to_pilot(monkeypatch: pytest.MonkeyPatch) -> None:
    """Job enfile avant le deploiement : aucun snapshot -> defaut pilote."""
    with pytest.raises(AppError) as exc:
        _run(_processor(monkeypatch, 120.0), None)
    assert exc.value.detail == "Vidéo trop longue (max. 90 s)."


def test_retry_keeps_the_same_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    """Le snapshot voyage dans les arguments du job : trois essais, meme limite."""
    for _ in range(3):
        with pytest.raises(AppError) as exc:
            _run(_processor(monkeypatch, 181.0), 180)
        assert exc.value.detail == "Vidéo trop longue (max. 180 s)."


def test_message_matches_the_applied_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    for limite in (90, 180):
        with pytest.raises(AppError) as exc:
            _run(_processor(monkeypatch, 500.0), limite)
        assert f"max. {limite} s" in exc.value.detail


def test_size_and_quota_unchanged() -> None:
    assert LOCAL_VIDEO_MAX_BYTES == 50 * 1024 * 1024
    assert LOCAL_VIDEO_UPLOAD_RATE_LIMIT == 10


def test_policy_never_consults_forbidden_signals() -> None:
    """Verrou explicite sur l'arbitrage CTO.

    `User.is_verified` n'est ecrit que par le bootstrap admin et ne designe pas un
    createur ; `Organization.verification_status` et `organization_id` viennent
    d'un payload client sans preuve d'appartenance (LOCAL-VIDEO-ORG-AUTHZ-P1).
    Aucun des trois ne doit entrer dans le calcul du palier.
    """
    import inspect

    from app.core import local_video_duration_policy as module

    code = inspect.getsource(module)
    corps = "\n".join(
        ligne
        for ligne in code.splitlines()
        if not ligne.strip().startswith("#") and "PAS" not in ligne
    )
    for interdit in ("is_verified", "organization_id", "verification_status"):
        assert f"{interdit} " not in corps.replace(".", " ")


def test_policy_signature_only_accepts_role_keys() -> None:
    """Impossible de passer un signal non canonique : la politique ne prend que des roles."""
    import inspect

    from app.core.local_video_duration_policy import resolve_duration_policy

    params = list(inspect.signature(resolve_duration_policy).parameters)
    assert params == ["role_keys"]
