"""Weather endpoints (WEB-SEARCH-02A)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.config import get_settings
from app.core.errors import AppError
from app.schemas.weather import WeatherCurrentOut
from app.services.weather_service import WeatherCurrentQuery, WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherCurrentOut)
async def get_current_weather(
    lat: float | None = Query(default=None, ge=-90, le=90),
    lon: float | None = Query(default=None, ge=-180, le=180),
    city: str | None = Query(default=None, min_length=1, max_length=128),
) -> WeatherCurrentOut:
    if (lat is None) != (lon is None):
        raise AppError(
            status_code=400,
            code="weather_params_invalid",
            detail="Paramètres météo invalides (lat/lon incomplets).",
        )
    if city is None and lat is None:
        raise AppError(
            status_code=400,
            code="weather_params_invalid",
            detail="Paramètres météo invalides (city manquant).",
        )

    query = WeatherCurrentQuery(lat=lat, lon=lon, city=city)
    settings = get_settings()
    return await WeatherService(settings).get_current(query)
