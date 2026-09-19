"""Local Video feed persistence (FEATURE-CREATORS-V2 / C2-S2-00)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Integer, and_, case, func, literal, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.local_video_constants import LocalVideoStatus
from app.core.local_video_feed_ranking import LocalVideoFeedTier
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.user import User


class LocalVideoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _tier_expression(self, viewer_neighborhood_id: uuid.UUID | None):  # type: ignore[no-untyped-def]
        """Tier calcule EN SQL — jamais un tri complet en memoire.

        Sans quartier etabli pour le spectateur, toute la page est un repli :
        c'est ce qui garantit qu'aucun motif « Parce que tu es a X » ne sera
        emis a tort en aval.
        """
        if viewer_neighborhood_id is None:
            return literal(LocalVideoFeedTier.TERRITORY_FALLBACK.value).cast(Integer)
        return case(
            (
                LocalVideo.neighborhood_id == viewer_neighborhood_id,
                literal(LocalVideoFeedTier.NEIGHBORHOOD.value),
            ),
            else_=literal(LocalVideoFeedTier.CITY.value),
        ).cast(Integer)

    async def resolve_viewer_neighborhood(
        self,
        *,
        city: str,
        latitude: float,
        longitude: float,
        default_radius_meters: int,
    ) -> tuple[uuid.UUID, str] | None:
        """Quartier ACTIF le plus proche des coordonnees, dans son rayon.

        Une seule requete, bornee aux quartiers actifs de la ville (12 pour
        Reims) : la distance est ensuite calculee sur ces quelques lignes, ce
        qui evite a la fois le N+1 et une fonction geospatiale par ligne de
        video. Un quartier portant son propre `radius_meters` prime sur le
        rayon par defaut.
        """
        from app.services.local_video.geo import haversine_meters

        stmt = select(
            Neighborhood.id,
            Neighborhood.display_name,
            Neighborhood.latitude,
            Neighborhood.longitude,
            Neighborhood.radius_meters,
        ).where(
            Neighborhood.city.ilike(city.strip()),
            Neighborhood.is_active.is_(True),
            Neighborhood.latitude.is_not(None),
            Neighborhood.longitude.is_not(None),
        )
        rows = (await self._session.execute(stmt)).all()

        meilleur: tuple[float, uuid.UUID, str] | None = None
        for row in rows:
            distance = haversine_meters(
                latitude, longitude, float(row.latitude), float(row.longitude)
            )
            rayon = row.radius_meters or default_radius_meters
            if distance > rayon:
                continue
            if meilleur is None or distance < meilleur[0]:
                meilleur = (distance, row.id, row.display_name)
        return (meilleur[1], meilleur[2]) if meilleur else None

    async def list_published_feed(
        self,
        *,
        city: str,
        limit: int,
        cursor_published_at: datetime | None = None,
        cursor_id: uuid.UUID | None = None,
        cursor_tier: int | None = None,
        viewer_neighborhood_id: uuid.UUID | None = None,
    ) -> list[tuple[LocalVideo, int]]:
        """Page du feed, classee `(tier ASC, published_at DESC, id DESC)`.

        Les filtres de publication sont inchanges : seules les videos PUBLISHED
        d'un auteur actif et d'un quartier ACTIF, avec `published_at` renseigne,
        sortent. Le filtre `Neighborhood.is_active` est ce qui garantit qu'un
        secteur fusionne desactive ne peut jamais devenir une preference de
        classement.
        """
        tier = self._tier_expression(viewer_neighborhood_id)

        stmt = (
            select(LocalVideo, tier.label("feed_tier"))
            .join(User, LocalVideo.author_user_id == User.id)
            .join(Neighborhood, LocalVideo.neighborhood_id == Neighborhood.id)
            .where(
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
                LocalVideo.city.ilike(city.strip()),
                User.is_active.is_(True),
                Neighborhood.is_active.is_(True),
                LocalVideo.published_at.is_not(None),
            )
            .options(
                selectinload(LocalVideo.author).selectinload(User.profile),
                selectinload(LocalVideo.neighborhood),
                selectinload(LocalVideo.cultural_place),
                selectinload(LocalVideo.local_event),
                selectinload(LocalVideo.tribe),
            )
            .order_by(
                tier.asc(),
                LocalVideo.published_at.desc(),
                LocalVideo.created_at.desc(),
                LocalVideo.id.desc(),
            )
            .limit(limit)
        )

        if cursor_published_at is not None and cursor_id is not None:
            if cursor_tier is None:
                # Curseur historique a deux segments : predicat d'origine, pour
                # ne pas casser un client deja en cours de pagination.
                stmt = stmt.where(
                    or_(
                        LocalVideo.published_at < cursor_published_at,
                        and_(
                            LocalVideo.published_at == cursor_published_at,
                            LocalVideo.id < cursor_id,
                        ),
                    )
                )
            else:
                stmt = stmt.where(
                    or_(
                        tier > cursor_tier,
                        and_(tier == cursor_tier, LocalVideo.published_at < cursor_published_at),
                        and_(
                            tier == cursor_tier,
                            LocalVideo.published_at == cursor_published_at,
                            LocalVideo.id < cursor_id,
                        ),
                    )
                )

        result = await self._session.execute(stmt)
        vues: set[uuid.UUID] = set()
        page: list[tuple[LocalVideo, int]] = []
        for video, feed_tier in result.unique().all():
            if video.id in vues:
                continue
            vues.add(video.id)
            page.append((video, int(feed_tier)))
        return page

    async def list_published_for_neighborhood(
        self,
        *,
        neighborhood_id: uuid.UUID,
        limit: int,
    ) -> list[LocalVideo]:
        stmt = (
            select(LocalVideo)
            .join(User, LocalVideo.author_user_id == User.id)
            .where(
                LocalVideo.neighborhood_id == neighborhood_id,
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
                LocalVideo.published_at.is_not(None),
                User.is_active.is_(True),
            )
            .options(
                selectinload(LocalVideo.author).selectinload(User.profile),
                selectinload(LocalVideo.neighborhood),
                # VIDEO-03 — le teaser expose le slug du lieu lie pour son CTA
                # « Y aller ». En lot : une requete pour toute la page, jamais une
                # par video.
                selectinload(LocalVideo.cultural_place),
            )
            .order_by(
                LocalVideo.published_at.desc(),
                LocalVideo.created_at.desc(),
                LocalVideo.id.desc(),
            )
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def count_published_for_neighborhood(self, neighborhood_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(LocalVideo)
            .join(User, LocalVideo.author_user_id == User.id)
            .where(
                LocalVideo.neighborhood_id == neighborhood_id,
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
                LocalVideo.published_at.is_not(None),
                User.is_active.is_(True),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def get_published_by_id(self, video_id: uuid.UUID) -> LocalVideo | None:
        result = await self._session.execute(
            select(LocalVideo).where(
                LocalVideo.id == video_id,
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
            )
        )
        return result.scalar_one_or_none()

    async def increment_like_count(self, video_id: uuid.UUID, delta: int) -> None:
        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.like_count = max(0, video.like_count + delta)

    async def increment_comment_count(self, video_id: uuid.UUID, delta: int) -> None:
        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.comment_count = max(0, video.comment_count + delta)

    async def increment_report_count(self, video_id: uuid.UUID) -> None:
        from app.core.local_video_constants import LOCAL_VIDEO_REPORT_REVIEW_PRIORITY_THRESHOLD

        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.report_count = max(0, video.report_count + 1)
        if video.report_count >= LOCAL_VIDEO_REPORT_REVIEW_PRIORITY_THRESHOLD:
            video.review_priority = True
