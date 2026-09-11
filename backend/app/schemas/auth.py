from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserPublic


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=2, max_length=128)
    city: str | None = Field(default=None, max_length=128)
    #: Jeton Turnstile (AUTH-04A). Optionnel dans le contrat, exigé par le mode :
    #: un client mobile ou une version web antérieure n'est pas cassé par le seul
    #: déploiement de cette version, et l'exigence s'active avec le mode PUBLIC.
    turnstile_token: str | None = Field(default=None, max_length=2048, alias="turnstile_token")


class RegistrationStatusResponse(BaseModel):
    """État d'ouverture, lu par le frontend au lieu d'être déclaré par lui.

    Public et minimal : rien qu'un client ne puisse déjà déduire en tentant une
    inscription. Aucun seuil, aucun quota, aucun secret — la site key Turnstile
    est publique par conception, c'est elle qui monte le widget.
    """

    open: bool
    mode: str
    turnstile_required: bool
    turnstile_site_key: str | None = None
    closes_at: datetime | None = None
    #: Vrai quand le mode ouvrirait, mais qu'une protection indispensable manque.
    #: `open` vaut alors faux : un frontend ancien qui ne lit que `open` ferme
    #: correctement le formulaire sans connaitre ce champ.
    temporarily_unavailable: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=1)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic
    refresh_token: str | None = Field(
        default=None,
        description="Présent uniquement pour clients mobile (header X-Client-Platform: mobile).",
    )


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str | None = Field(
        default=None,
        description="Nouveau refresh pour clients mobile uniquement.",
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Réponse unique de `forgot-password`.

    Ne contient jamais le lien ni le jeton, dans aucun environnement (AUTH-03).
    Le lien vaut un mot de passe à usage unique : il ne transite que par l'e-mail.
    """

    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=128)


class ResetPasswordResponse(BaseModel):
    message: str


class RegistrationPendingResponse(BaseModel):
    """Inscription enregistrée, session différée jusqu'à la vérification (AUTH-01).

    Renvoyée en 202 — et non 201 — uniquement pour les comptes soumis à
    `EMAIL_VERIFICATION_ENFORCED_FROM`. Le code HTTP suffit donc à distinguer les
    deux issues sans rendre `access_token` optionnel dans `AuthTokenResponse`,
    ce qui aurait cassé le contrat de tous les clients existants.
    """

    message: str
    user: UserPublic
    verification_required: Literal[True] = True
    #: Faux quand l'e-mail n'a pas pu partir. Il n'existe AUCUNE file de reprise :
    #: le compte et son jeton restent valides, et seul un renvoi explicite
    #: enverra le lien. Le client doit donc proposer ce renvoi.
    verification_email_sent: bool = True


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1, max_length=512)


class VerifyEmailResponse(BaseModel):
    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str
