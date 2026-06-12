import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self._session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        email: str,
        hashed_password: str,
        full_name: str,
        city: str | None,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name.strip(),
            city=city.strip() if city else None,
            is_active=True,
            is_verified=False,
        )
        self._session.add(user)
        await self._session.flush()
        return user

    async def update_password(self, user_id: uuid.UUID, hashed_password: str) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            return
        user.hashed_password = hashed_password
        await self._session.flush()
