"""Resend transactional email client (QA-05B)."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class EmailDeliveryError(RuntimeError):
    """Raised when a transactional email could not be delivered."""


class EmailRateLimited(EmailDeliveryError):
    """Le fournisseur a refusé pour cause de débit ou de quota (HTTP 429).

    Distincte d'une panne ou d'une erreur de configuration : elle est temporaire
    et porte, quand le fournisseur le fournit, le délai après lequel réessayer.
    Tout confondre dans une erreur générique empêchait de savoir s'il fallait
    attendre trente secondes ou corriger un domaine.
    """

    def __init__(self, message: str, retry_after_seconds: int | None = None) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


def _retry_after_seconds(response: httpx.Response) -> int | None:
    raw = response.headers.get("retry-after")
    if not raw:
        return None
    try:
        # La spécification autorise aussi une date HTTP ; Resend renvoie des
        # secondes. Une valeur illisible vaut mieux ignorée qu'interprétée.
        return max(int(float(raw.strip())), 0)
    except ValueError:
        return None


def observed_provider_quota(response: httpx.Response) -> dict[str, int]:
    """Quotas restants annoncés par le fournisseur, s'il les expose.

    Sert aux métriques : savoir qu'on approche du plafond avant de le heurter.
    Absent de certaines réponses, d'où la tolérance.
    """
    quotas: dict[str, int] = {}
    for entete, cle in (
        ("x-resend-daily-quota", "daily"),
        ("x-resend-monthly-quota", "monthly"),
    ):
        brut = response.headers.get(entete)
        if brut is None:
            continue
        try:
            quotas[cle] = int(float(brut.strip()))
        except ValueError:
            continue
    return quotas


def _raise_for_provider_error(response: httpx.Response, *, event: str, to: str) -> None:
    """Traduit une réponse en échec, en séparant le débit du reste."""
    quotas = observed_provider_quota(response)
    if quotas:
        logger.info("resend_quota_observed", extra=quotas)

    if response.status_code == 429:
        delai = _retry_after_seconds(response)
        logger.warning(
            f"{event}_rate_limited",
            extra={"recipient": _mask_email(to), "retry_after_seconds": delai},
        )
        raise EmailRateLimited("Resend rate limited the request", delai)

    logger.error(
        f"{event}_provider_error",
        extra={"recipient": _mask_email(to), "status_code": response.status_code},
    )
    raise EmailDeliveryError(f"Resend returned HTTP {response.status_code}")


def local_link_disclosure_allowed(settings: Settings) -> bool:
    """Le lien peut-il etre imprime en clair dans les journaux ? (AUTH-03)

    Un lien de reinitialisation ou de verification vaut un mot de passe a usage
    unique. L'imprimer n'a de sens que sur le poste d'un developpeur qui deroule
    le parcours a la main ; partout ailleurs c'est une fuite.

    Trois conditions CUMULATIVES, et la fonction est fail-closed : au moindre
    doute, elle rend False.

    1. `RAILWAY_ENVIRONMENT` absente. Railway injecte cette variable dans tout
       conteneur qu'il execute ; sa presence signifie « serveur deploye », ce que
       la configuration applicative ne peut pas simuler par erreur.
    2. `APP_ENV` vaut exactement `dev`. Preview et Production declarent `prod`,
       recette et preprod declarent leur propre valeur.
    3. Le fournisseur est `console`. Avec `resend`, l'e-mail part reellement et
       le journal n'a aucune raison de doubler le lien.

    Aucun drapeau dedie n'est introduit : il n'y a donc rien qu'une variable
    Railway mal placee puisse activer a elle seule.
    """
    if os.getenv("RAILWAY_ENVIRONMENT"):
        return False
    if settings.app_env != "dev":
        return False
    return settings.email_provider == "console"


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
        # Le jeton n'est imprime que sur un poste de developpement local.
        # Auparavant il l'etait inconditionnellement : un environnement deploye
        # en `console` ecrivait des liens de reinitialisation valides dans ses
        # journaux, lisibles par quiconque y a acces (AUTH-03).
        extra: dict[str, Any] = {"recipient": _mask_email(to)}
        if local_link_disclosure_allowed(settings):
            extra["reset_url"] = reset_url
        logger.warning("password_reset_email_console_only", extra=extra)
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
        _raise_for_provider_error(response, event="password_reset_email", to=to)

    logger.info(
        "password_reset_email_sent",
        extra={"recipient": _mask_email(to)},
    )


def build_email_verification_html(verification_url: str, expire_hours: int = 24) -> str:
    """E-mail de confirmation d'adresse — sobre, sans image distante, sans suivi.

    Aucune ressource externe : le message reste lisible meme avec le chargement
    d'images desactive, et ne transmet rien au moment de l'ouverture.
    """
    return f"""<!DOCTYPE html>
<html lang="fr">
  <body style="font-family:system-ui,sans-serif;line-height:1.6;color:#111;">
    <p style="font-size:18px;font-weight:700;color:#2A2FFF;margin:0 0 16px;">Yunicity</p>
    <p>Bonjour,</p>
    <p>Confirmez votre adresse e-mail pour activer votre compte Yunicity.</p>
    <p>
      <a href="{verification_url}"
         style="display:inline-block;padding:12px 20px;border-radius:9999px;
                background:#2A2FFF;color:#fff;text-decoration:none;font-weight:600;">
        Confirmer mon adresse
      </a>
    </p>
    <p style="font-size:14px;color:#555;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
      {verification_url}
    </p>
    <p><strong>Ce lien expire dans {expire_hours} heures.</strong></p>
    <p style="font-size:14px;color:#555;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message :
      aucun compte ne sera activé.
    </p>
    <p>— L'équipe Yunicity</p>
  </body>
</html>"""


async def send_email_verification_email(
    *,
    to: str,
    verification_url: str,
    settings: Settings,
) -> None:
    if settings.email_provider == "console":
        # Le jeton ne doit JAMAIS atterrir dans un journal (AUTH-01). En dev local
        # le lien est imprime pour pouvoir dérouler le parcours a la main ; partout
        # ailleurs — Preview inclus, qui declare app_env=prod — seul le destinataire
        # masque est trace.
        # Meme garde-fou que la reinitialisation : `app_env == "dev"` seul ne
        # couvrait pas le cas d'un serveur deploye declarant `dev` (AUTH-03).
        fields: dict[str, Any] = {"recipient": _mask_email(to)}
        if local_link_disclosure_allowed(settings):
            fields["verification_url"] = verification_url
        logger.warning("email_verification_console_only", extra=fields)
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
        "subject": "Confirmez votre adresse e-mail Yunicity",
        "html": build_email_verification_html(
            verification_url, settings.email_verification_expire_hours
        ),
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
            "email_verification_transport_error",
            extra={"recipient": _mask_email(to)},
        )
        raise EmailDeliveryError("Resend transport failed") from exc

    if response.status_code >= 400:
        _raise_for_provider_error(response, event="email_verification", to=to)

    logger.info("email_verification_sent", extra={"recipient": _mask_email(to)})
