"""Rotation des jetons QR Passport (PASSPORT-QR-TOKEN-ROTATION-01).

Les ``qr_token`` sont statiques. Ceux affichés avant PASSPORT-QR-THIRD-PARTY-01
ont pu partir chez un service tiers de génération de QR : la rotation leur
substitue un nouveau jeton opaque. Tous les Passports sont concernés, quel que
soit leur statut — un Passport suspendu puis réactivé ne doit pas retrouver un
jeton exposé.

Aucun jeton n'est journalisé ni renvoyé : seuls des compteurs sortent d'ici.
La transaction est gérée par l'appelant (commit ou rollback).
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_tokens import generate_qr_token_placeholder
from app.repositories.passport_repository import PassportRepository


@dataclass(frozen=True)
class PassportQrRotationReport:
    counts_by_status: dict[str, int]
    total: int
    rotated: int


class PassportQrRotationService:
    def __init__(self, session: AsyncSession) -> None:
        self._passports = PassportRepository(session)
        self._session = session

    async def preview(self) -> PassportQrRotationReport:
        """Compte les Passports concernés, sans rien écrire."""
        counts = await self._passports.count_by_status()
        return PassportQrRotationReport(
            counts_by_status=counts, total=sum(counts.values()), rotated=0
        )

    async def rotate_all(self) -> PassportQrRotationReport:
        """Attribue un nouveau ``qr_token`` à chaque Passport. Ne commite pas."""
        counts = await self._passports.count_by_status()
        ids = await self._passports.list_ids()
        for passport_id in ids:
            await self._passports.set_qr_token(passport_id, generate_qr_token_placeholder())
        await self._session.flush()
        return PassportQrRotationReport(
            counts_by_status=counts, total=sum(counts.values()), rotated=len(ids)
        )
