"""Resend transactional email client (QA-05B)."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class EmailDeliveryError(RuntimeError):
    """Raised when a transactional email could not be delivered."""


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    if len(local) <= 2:
        return f"**@{domain}"
    return f"{local[0]}***{local[-1]}@{domain}"


def build_password_reset_email_html(reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe Yunicity.</p>
    <p><a href="{reset_url}">Réinitialiser mon mot de passe</a></p>
    <p>Ce lien expire bientôt. Si vous n'êtes pas à l'origine de cette demande,
    ignorez cet email.</p>
    <p>— L'équipe Yunicity</p>
  </body>
</html>"""


async def send_password_reset_email(
    *,
    to: str,
    reset_url: str,
    settings: Settings,
) -> None:
    if settings.email_provider == "console":
        logger.warning(
            "password_reset_email_console_only",
            extra={"recipient": _mask_email(to), "reset_url": reset_url},
        )
        return

    if settings.email_provider != "resend":
        return

    api_key = settings.resend_api_key
    from_address = settings.email_from
    if not api_key or not from_address:
        raise EmailDeliveryError("Resend is not configured")

    payload: dict[str, Any] = {
        "from": from_address,
        "to": [to],
        "subject": "Réinitialisation de votre mot de passe Yunicity",
        "html": build_password_reset_email_html(reset_url),
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(RESEND_API_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.exception(
            "password_reset_email_transport_error",
            extra={"recipient": _mask_email(to)},
        )
        raise EmailDeliveryError("Resend transport failed") from exc

    if response.status_code >= 400:
        logger.error(
            "password_reset_email_provider_error",
            extra={
                "recipient": _mask_email(to),
                "status_code": response.status_code,
            },
        )
        raise EmailDeliveryError(f"Resend returned HTTP {response.status_code}")

    logger.info(
        "password_reset_email_sent",
        extra={"recipient": _mask_email(to)},
    )
