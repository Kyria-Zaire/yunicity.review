from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserPublic


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=2, max_length=128)
    city: str | None = Field(default=None, max_length=128)


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


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1, max_length=512)


class VerifyEmailResponse(BaseModel):
    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str
