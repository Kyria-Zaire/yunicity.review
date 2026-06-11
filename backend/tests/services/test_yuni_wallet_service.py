"""YuniWalletService tests (PASSPORT-02A)."""

from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from app.core.yuni_wallet_constants import (
    YuniTransactionReferenceType,
    YuniTransactionType,
    YuniWalletStatus,
)
from app.core.yuni_wallet_errors import (
    YuniWalletInsufficientBalanceError,
    YuniWalletInvalidAmountError,
    YuniWalletInvalidReferenceTypeError,
    YuniWalletInvalidReversalError,
    YuniWalletSuspendedError,
)
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from app.models.user import User
from app.models.yuni_wallet import YuniTransaction
from app.services.yuni_wallet_service import YuniWalletService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def wallet_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip YuniWallet service tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")

    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    init_db(settings)
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"yuni-wallet-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Wallet Tester",
            city="Reims",
        )
        session.add(user)
        await session.commit()
        yield session, user.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> YuniWalletService:
    return YuniWalletService(session)


async def test_get_or_create_wallet_creates_active_wallet(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)

    wallet = await service.get_or_create_wallet(user_id)
    assert wallet.status == YuniWalletStatus.ACTIVE.value
    assert wallet.balance == 0
    assert wallet.lifetime_earned == 0
    assert wallet.lifetime_spent == 0


async def test_earn_creates_transaction_and_updates_balance(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    ref_id = uuid.uuid4()

    tx = await service.earn(
        user_id,
        10,
        YuniTransactionReferenceType.PASSPORT_STAMP.value,
        reference_id=ref_id,
    )

    assert tx.transaction_type == YuniTransactionType.EARN.value
    assert tx.amount == 10
    assert tx.balance_after == 10
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 10
    assert wallet.lifetime_earned == 10


async def test_earn_is_idempotent_for_same_reference(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    ref_id = uuid.uuid4()

    first = await service.earn(
        user_id,
        10,
        YuniTransactionReferenceType.PASSPORT_STAMP.value,
        reference_id=ref_id,
    )
    second = await service.earn(
        user_id,
        10,
        YuniTransactionReferenceType.PASSPORT_STAMP.value,
        reference_id=ref_id,
    )

    assert first.id == second.id
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 10


async def test_spend_creates_transaction_and_updates_balance(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    await service.earn(
        user_id,
        100,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )

    spend_ref = uuid.uuid4()
    tx = await service.spend(
        user_id,
        30,
        YuniTransactionReferenceType.REWARD_REDEMPTION.value,
        reference_id=spend_ref,
    )

    assert tx.transaction_type == YuniTransactionType.SPEND.value
    assert tx.balance_after == 70
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 70
    assert wallet.lifetime_spent == 30


async def test_spend_rejects_insufficient_balance(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    await service.earn(
        user_id,
        10,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )

    with pytest.raises(YuniWalletInsufficientBalanceError):
        await service.spend(
            user_id,
            20,
            YuniTransactionReferenceType.REWARD_REDEMPTION.value,
            reference_id=uuid.uuid4(),
        )

    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 10
    spend_count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(
            YuniTransaction.user_id == user_id,
            YuniTransaction.transaction_type == YuniTransactionType.SPEND.value,
        )
    )
    assert spend_count == 0


async def test_spend_is_idempotent_for_same_reference(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    await service.earn(
        user_id,
        100,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )
    spend_ref = uuid.uuid4()

    first = await service.spend(
        user_id,
        25,
        YuniTransactionReferenceType.REWARD_REDEMPTION.value,
        reference_id=spend_ref,
    )
    second = await service.spend(
        user_id,
        25,
        YuniTransactionReferenceType.REWARD_REDEMPTION.value,
        reference_id=spend_ref,
    )

    assert first.id == second.id
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 75


async def test_concurrent_spends_do_not_create_negative_balance(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    _session, user_id = wallet_db
    from app.db.session import get_engine

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as bootstrap:
        service = YuniWalletService(bootstrap)
        await service.earn(
            user_id,
            100,
            YuniTransactionReferenceType.SYSTEM.value,
            reference_id=uuid.uuid4(),
        )

    async def spend(ref_id: uuid.UUID) -> YuniTransaction | None:
        async with factory() as session:
            service = YuniWalletService(session)
            try:
                return await service.spend(
                    user_id,
                    80,
                    YuniTransactionReferenceType.REWARD_REDEMPTION.value,
                    reference_id=ref_id,
                )
            except YuniWalletInsufficientBalanceError:
                return None

    results = await asyncio.gather(spend(uuid.uuid4()), spend(uuid.uuid4()))
    successes = [item for item in results if item is not None]

    assert len(successes) == 1
    async with factory() as session:
        wallet = await YuniWalletService(session).get_wallet(user_id)
        assert wallet is not None
        assert wallet.balance == 20


async def test_concurrent_earns_keep_correct_balance(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    _session, user_id = wallet_db
    from app.db.session import get_engine

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def earn(amount: int, ref_id: uuid.UUID) -> None:
        async with factory() as session:
            await YuniWalletService(session).earn(
                user_id,
                amount,
                YuniTransactionReferenceType.PASSPORT_STAMP.value,
                reference_id=ref_id,
            )

    await asyncio.gather(
        earn(15, uuid.uuid4()),
        earn(25, uuid.uuid4()),
        earn(10, uuid.uuid4()),
    )

    async with factory() as session:
        wallet = await YuniWalletService(session).get_wallet(user_id)
        assert wallet is not None
        assert wallet.balance == 50
        assert wallet.lifetime_earned == 50


async def test_reverse_spend_recredits_balance_once(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    await service.earn(
        user_id,
        100,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )
    spend_tx = await service.spend(
        user_id,
        40,
        YuniTransactionReferenceType.REWARD_REDEMPTION.value,
        reference_id=uuid.uuid4(),
    )

    reversal = await service.reverse(
        user_id,
        spend_tx.id,
        YuniTransactionReferenceType.SYSTEM.value,
    )
    second = await service.reverse(
        user_id,
        spend_tx.id,
        YuniTransactionReferenceType.SYSTEM.value,
    )

    assert reversal.id == second.id
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 100
    assert wallet.lifetime_spent == 40


async def test_cannot_reverse_earn_transaction(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    earn_tx = await service.earn(
        user_id,
        50,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )

    with pytest.raises(YuniWalletInvalidReversalError):
        await service.reverse(
            user_id,
            earn_tx.id,
            YuniTransactionReferenceType.SYSTEM.value,
        )


async def test_suspended_wallet_cannot_earn_or_spend(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    await service.suspend_wallet(user_id, reason="test")

    with pytest.raises(YuniWalletSuspendedError):
        await service.earn(
            user_id,
            10,
            YuniTransactionReferenceType.SYSTEM.value,
            reference_id=uuid.uuid4(),
        )
    with pytest.raises(YuniWalletSuspendedError):
        await service.spend(
            user_id,
            10,
            YuniTransactionReferenceType.REWARD_REDEMPTION.value,
            reference_id=uuid.uuid4(),
        )


@pytest.mark.parametrize("amount", [0, -3])
async def test_invalid_amount_rejected(
    wallet_db: tuple[AsyncSession, uuid.UUID],
    amount: int,
) -> None:
    session, user_id = wallet_db
    service = _service(session)

    with pytest.raises(YuniWalletInvalidAmountError):
        await service.earn(
            user_id,
            amount,
            YuniTransactionReferenceType.SYSTEM.value,
            reference_id=uuid.uuid4(),
        )


async def test_invalid_reference_type_rejected(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)

    with pytest.raises(YuniWalletInvalidReferenceTypeError):
        await service.earn(user_id, 5, "unknown_reference", reference_id=uuid.uuid4())


async def test_metadata_is_stored(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)
    metadata = {"note": "test earn", "origin": "unit-test"}

    tx = await service.earn(
        user_id,
        5,
        YuniTransactionReferenceType.ADMIN_ADJUSTMENT.value,
        reference_id=uuid.uuid4(),
        metadata=metadata,
    )
    assert tx.metadata_ == metadata


async def test_balance_after_matches_wallet_balance_after_each_transaction(
    wallet_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = wallet_db
    service = _service(session)

    earn_tx = await service.earn(
        user_id,
        40,
        YuniTransactionReferenceType.SYSTEM.value,
        reference_id=uuid.uuid4(),
    )
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert earn_tx.balance_after == wallet.balance

    spend_tx = await service.spend(
        user_id,
        15,
        YuniTransactionReferenceType.REWARD_REDEMPTION.value,
        reference_id=uuid.uuid4(),
    )
    wallet = await service.get_wallet(user_id)
    assert wallet is not None
    assert spend_tx.balance_after == wallet.balance


async def test_ledger_is_append_only() -> None:
    service = YuniWalletService(session=MagicMock())
    public_methods = {
        name
        for name in dir(service)
        if not name.startswith("_") and callable(getattr(service, name))
    }
    forbidden = {"delete_transaction", "update_transaction", "remove_transaction"}
    assert forbidden.isdisjoint(public_methods)
    assert "earn" in public_methods
    assert "spend" in public_methods
    assert "reverse" in public_methods
