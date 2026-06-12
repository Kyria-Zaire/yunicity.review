"""Admin activity feed presentation helpers (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.core.admin_activity_constants import (
    ACTIVITY_ALERT_COUNT_CRITICAL_THRESHOLD,
    AdminActivityAlertSeverity,
    AdminActivityFeedSeverity,
)
from app.repositories.admin_activity_repository import ActivityFeedRawRow
from app.schemas.admin_activity import AdminActivityCheckStatus

UNAVAILABLE_TARGET_LABEL = "Élément supprimé ou indisponible"

_ACTION_TITLES: dict[str, dict[str, str]] = {
    "partner": {
        "create_profile": "Profil partenaire créé",
        "activate": "Partenaire activé",
        "pause": "Partenaire mis en pause",
        "upgrade_premium": "Partenaire passé premium",
        "update_settings": "Paramètres partenaire mis à jour",
    },
    "passport": {
        "suspend": "Passeport suspendu",
        "reactivate": "Passeport réactivé",
    },
    "offer": {
        "approve": "Offre approuvée",
        "reject": "Offre rejetée",
        "archive": "Offre archivée",
    },
    "event": {
        "approve": "Événement approuvé",
        "reject": "Événement rejeté",
        "cancel": "Événement annulé",
    },
    "creator": {
        "approve": "Contenu approuvé",
        "reject": "Contenu rejeté",
        "archive": "Contenu archivé",
    },
    "report": {
        "report_created": "Nouveau signalement citoyen",
        "dismiss": "Signalement classé sans suite",
        "resolve": "Signalement résolu",
        "resolve_hide_post": "Signalement résolu avec masquage",
    },
    "staff": {
        "assign_role": "Rôle staff attribué",
        "revoke_role": "Rôle staff retiré",
        "suspend": "Compte staff suspendu",
        "reactivate": "Compte staff réactivé",
    },
}


def map_check_status(raw: str) -> AdminActivityCheckStatus:
    if raw == "ok":
        return "ok"
    if raw == "error":
        return "error"
    return "unknown"


def count_severity(count: int) -> AdminActivityAlertSeverity:
    if count <= 0:
        return "healthy"
    if count >= ACTIVITY_ALERT_COUNT_CRITICAL_THRESHOLD:
        return "critical"
    return "warning"


def aggregate_section_severity(count: int) -> AdminActivityAlertSeverity:
    return count_severity(count)


def feed_item_severity(category: str, action: str) -> AdminActivityFeedSeverity:
    if action in {"reject", "suspend", "cancel", "pause", "resolve_hide_post"}:
        return "warning"
    if action in {"approve", "reactivate", "activate", "upgrade_premium", "create_profile"}:
        return "success"
    if action == "report_created":
        return "warning"
    if category == "staff" and action in {"assign_role", "revoke_role", "suspend"}:
        return "warning"
    return "info"


def actor_label(row: ActivityFeedRawRow) -> str:
    if row.action == "report_created":
        return "Citoyen"
    if row.actor_user_id is not None:
        return "Admin Yunicity"
    return "Système"


def build_action_title(row: ActivityFeedRawRow) -> str:
    return _ACTION_TITLES.get(row.category, {}).get(row.action, f"Action {row.action}")


def build_action_description(row: ActivityFeedRawRow, target_label: str) -> str:
    title = build_action_title(row)
    if target_label == UNAVAILABLE_TARGET_LABEL:
        return f"{title}."
    return f"{title} — {target_label}."


def build_target_href(row: ActivityFeedRawRow) -> str:
    target = str(row.target_id)
    hrefs = {
        "partner": f"/partners/organizations/{target}",
        "passport": f"/passport-ops/{target}",
        "offer": f"/passport-offers/{target}",
        "event": f"/events/{target}",
        "creator": f"/creator-content/{target}",
        "report": f"/moderation/{target}",
        "staff": f"/staff/{target}",
    }
    return hrefs.get(row.category, "/")


def resolve_target_label(
    row: ActivityFeedRawRow,
    *,
    organization_names: dict[uuid.UUID, str],
    offer_titles: dict[uuid.UUID, str],
    event_titles: dict[uuid.UUID, str],
    creator_titles: dict[uuid.UUID, str],
    passport_numbers: dict[uuid.UUID, str],
) -> str:
    target_id = row.target_id
    if row.category == "partner":
        return organization_names.get(target_id, UNAVAILABLE_TARGET_LABEL)
    if row.category == "offer":
        return offer_titles.get(target_id, UNAVAILABLE_TARGET_LABEL)
    if row.category == "event":
        return event_titles.get(target_id, UNAVAILABLE_TARGET_LABEL)
    if row.category == "creator":
        return creator_titles.get(target_id, UNAVAILABLE_TARGET_LABEL)
    if row.category == "passport":
        number = passport_numbers.get(target_id)
        return f"Passeport {number}" if number else UNAVAILABLE_TARGET_LABEL
    if row.category == "report":
        return f"Signalement #{str(target_id)[:8]}"
    if row.category == "staff":
        return "Compte staff"
    return UNAVAILABLE_TARGET_LABEL


def encode_feed_cursor(created_at: datetime, row_id: uuid.UUID) -> str:
    import base64

    payload = f"{created_at.isoformat()}|{row_id}"
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("ascii")


def decode_feed_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    import base64
    from datetime import datetime

    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
        created_at_raw, row_id_raw = decoded.split("|", 1)
        return datetime.fromisoformat(created_at_raw), uuid.UUID(row_id_raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("Invalid activity feed cursor") from exc
