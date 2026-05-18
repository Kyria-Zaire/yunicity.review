"""Map Supabase rows to partner_leads payloads (schema-agnostic heuristics)."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from app.core.organization_constants import OrganizationType
from app.core.partner_lead_constants import PartnerLeadSource, PartnerLeadStatus
from app.core.partner_lead_normalize import normalize_instagram

__all__ = ["normalize_instagram", "map_supabase_row", "map_status", "build_tags"]

# Supabase column name (lower) -> partner_leads field
COLUMN_ALIASES: dict[str, str] = {
    "company_name": "name",
    "business_name": "name",
    "nom": "name",
    "nom_entreprise": "name",
    "name": "name",
    "raison_sociale": "name",
    "ville": "city",
    "city": "city",
    "phone": "phone",
    "telephone": "phone",
    "tel": "phone",
    "mobile": "phone",
    "email": "email",
    "mail": "email",
    "instagram": "instagram",
    "instagram_handle": "instagram",
    "insta": "instagram",
    "website": "website",
    "site": "website",
    "url": "website",
    "address": "address",
    "adresse": "address",
    "contact_name": "contact_name",
    "contact": "contact_name",
    "prenom_nom": "contact_name",
    "notes": "notes",
    "note": "notes",
    "message": "notes",
    "comment": "notes",
    "comments": "notes",
    "description": "notes",
    "category": "category",
    "categorie": "category",
    "type": "organization_type",
    "organization_type": "organization_type",
    "status": "status_raw",
    "signed": "signed_flag",
    "is_signed": "signed_flag",
    "partenaire_signe": "signed_flag",
}

SIGNED_STATUS_TOKENS: frozenset[str] = frozenset(
    {
        "signed",
        "signe",
        "signé",
        "partenaire",
        "partner",
        "active",
        "validated",
        "ok",
        "yes",
        "true",
        "1",
    }
)

ORG_TYPE_MAP: dict[str, OrganizationType] = {
    "commerce": OrganizationType.COMMERCE,
    "shop": OrganizationType.COMMERCE,
    "restaurant": OrganizationType.COMMERCE,
    "association": OrganizationType.ASSOCIATION,
    "ecole": OrganizationType.SCHOOL,
    "school": OrganizationType.SCHOOL,
    "freelance": OrganizationType.FREELANCE,
    "creator": OrganizationType.CREATOR,
    "public": OrganizationType.PUBLIC_AGENCY,
}


def _coerce_str(value: object | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _pick_first(row: dict[str, Any], *keys: str) -> Any | None:
    lower_map = {str(k).lower(): v for k, v in row.items()}
    for key in keys:
        if key.lower() in lower_map and lower_map[key.lower()] is not None:
            return lower_map[key.lower()]
    return None


def map_status(*, status_raw: object | None, signed_flag: object | None) -> PartnerLeadStatus:
    if signed_flag is not None:
        if isinstance(signed_flag, bool) and signed_flag:
            return PartnerLeadStatus.SIGNED
        flag_text = str(signed_flag).strip().lower()
        if flag_text in SIGNED_STATUS_TOKENS:
            return PartnerLeadStatus.SIGNED

    if status_raw is not None:
        status_text = str(status_raw).strip().lower()
        if status_text in SIGNED_STATUS_TOKENS:
            return PartnerLeadStatus.SIGNED

    return PartnerLeadStatus.INTERESTED


def infer_organization_type(raw: str | None) -> OrganizationType | None:
    if not raw:
        return None
    key = raw.strip().lower()
    for token, org_type in ORG_TYPE_MAP.items():
        if token in key:
            return org_type
    return None


def build_tags(
    *,
    source_table: str,
    category: str | None,
    extra: dict[str, Any] | None = None,
) -> list[str]:
    tags = ["supabase-import", f"source-table:{source_table}"]
    if category:
        tag = re.sub(r"[^a-z0-9_-]+", "-", category.strip().lower())
        tag = tag.strip("-")
        if tag:
            tags.append(tag)
    if extra:
        for key in ("form", "form_type", "source_page"):
            val = extra.get(key)
            if val:
                tags.append(f"{key}:{str(val).strip().lower()[:48]}")
    return tags[:20]


def map_supabase_row(
    source_table: str,
    row: dict[str, Any],
    *,
    row_index: int,
) -> tuple[dict[str, Any] | None, list[str]]:
    """Return partner lead create dict or None with error codes."""
    errors: list[str] = []
    extracted: dict[str, Any] = {}

    lower_row = {str(k).lower(): v for k, v in row.items()}

    for col_name, value in lower_row.items():
        target = COLUMN_ALIASES.get(col_name)
        if target and target not in extracted:
            extracted[target] = value

    name = _coerce_str(extracted.get("name"))
    if not name:
        name = _coerce_str(_pick_first(row, "title", "label", "establishment"))
    if not name or len(name) < 2:
        errors.append("missing_name")
        return None, errors

    city = _coerce_str(extracted.get("city"))
    phone = _coerce_str(extracted.get("phone"))
    email = _coerce_str(extracted.get("email"))
    instagram = _coerce_str(extracted.get("instagram"))
    website = _coerce_str(extracted.get("website"))
    address = _coerce_str(extracted.get("address"))
    contact_name = _coerce_str(extracted.get("contact_name"))
    notes = _coerce_str(extracted.get("notes"))
    category = _coerce_str(extracted.get("category"))

    status = map_status(
        status_raw=extracted.get("status_raw"),
        signed_flag=extracted.get("signed_flag"),
    )
    org_type = infer_organization_type(_coerce_str(extracted.get("organization_type")))

    supabase_id = _pick_first(row, "id", "uuid")
    created_raw = _pick_first(row, "created_at", "inserted_at", "submitted_at")

    metadata: dict[str, Any] = {
        "supabase_table": source_table,
        "supabase_row_index": row_index,
        "imported_via": "supabase_partner_import",
    }
    if supabase_id is not None:
        metadata["supabase_id"] = str(supabase_id)
    if created_raw is not None:
        metadata["supabase_created_at"] = str(created_raw)

    suspicious: list[str] = []
    if not city:
        suspicious.append("missing_city")
    if not phone and not email and not instagram:
        suspicious.append("no_contact_channel")
    if suspicious:
        metadata["suspicious_flags"] = suspicious

    payload: dict[str, Any] = {
        "name": name[:160],
        "city": city,
        "phone": phone,
        "email": email,
        "instagram": instagram,
        "website": website,
        "address": address,
        "contact_name": contact_name,
        "notes": notes,
        "organization_type": org_type.value if org_type else None,
        "source": PartnerLeadSource.LANDING_PAGE.value,
        "status": status.value,
        "tags": build_tags(source_table=source_table, category=category, extra=lower_row),
        "metadata": metadata,
        "interested_passport": bool(lower_row.get("interested_passport")),
        "interested_events": bool(lower_row.get("interested_events")),
        "interested_offers": bool(lower_row.get("interested_offers")),
    }

    if email and "@" not in email:
        errors.append("invalid_email")
        return None, errors

    return payload, errors


def parse_optional_datetime(value: object | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
