"""Current weather service with short TTL cache (WEB-SEARCH-02A)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Final

import httpx

from app.core.config import Settings
from app.core.errors import AppError
from app.schemas.weather import WeatherCurrentOut

WEATHER_CACHE_TTL_SECONDS: Final[int] = 300  # 5 minutes
OPENWEATHER_CURRENT_URL: Final[str] = "https://api.openweathermap.org/data/2.5/weather"

_CACHE: dict[str, tuple[float, WeatherCurrentOut]] = {}


@dataclass(frozen=True, slots=True)
class WeatherCurrentQuery:
    lat: float | None = None
    lon: float | None = None
    city: str | None = None


def _cache_key(query: WeatherCurrentQuery) -> str:
    if query.city:
        return f"city:{query.city.strip().lower()}"
    if query.lat is None or query.lon is None:
        return "invalid"
    return f"geo:{round(query.lat, 3)}:{round(query.lon, 3)}"


class WeatherService:
    def __init__(
        self,
        settings: Settings,
        *,
        cache_ttl_seconds: int = WEATHER_CACHE_TTL_SECONDS,
    ) -> None:
        self._settings = settings
        self._cache_ttl_seconds = cache_ttl_seconds

    async def get_current(self, query: WeatherCurrentQuery) -> WeatherCurrentOut:
        key = _cache_key(query)
        cached = _CACHE.get(key)
        now_mono = time.monotonic()
        if cached is not None:
            expires_mono = cached[0] + self._cache_ttl_seconds
            if now_mono < expires_mono:
                return cached[1]

        if not self._settings.openweather_api_key:
            if self._settings.app_env == "dev":
                stub = self._dev_stub_current(query)
                _CACHE[key] = (now_mono, stub)
                return stub
            raise AppError(
                status_code=503,
                code="weather_key_missing",
                detail="Météo indisponible : clé OpenWeather API manquante.",
            )

        payload = await self._fetch_openweather_current(query)
        parsed = self._parse_openweather_current(payload)

        _CACHE[key] = (now_mono, parsed)
        return parsed

    def _dev_stub_current(self, query: WeatherCurrentQuery) -> WeatherCurrentOut:
        """Deterministic local preview when OpenWeather is not configured (dev only)."""
        city = (query.city or "Reims").strip() or "Reims"
        seed = len(city) + datetime.now(UTC).day
        temps = [11.0, 13.0, 15.0, 12.0, 14.0, 16.0]
        labels = [
            "Nuages légers",
            "Éclaircies",
            "Ciel clair",
            "Brume matinale",
            "Douceur printanière",
            "Ciel voilé",
        ]
        index = seed % len(temps)
        temperature = temps[index]
        now_utc = datetime.now(UTC)
        hour = now_utc.hour
        is_day = 7 <= hour < 20
        return WeatherCurrentOut(
            temperature=temperature,
            feels_like=temperature - 1.0,
            condition=labels[index],
            icon="02d" if is_day else "02n",
            sunrise=None,
            sunset=None,
            is_day=is_day,
            city=city,
            country="FR",
        )

    async def _fetch_openweather_current(self, query: WeatherCurrentQuery) -> dict[str, Any]:
        params: dict[str, str] = {
            "units": "metric",
            "lang": "fr",
            "appid": self._settings.openweather_api_key or "",
        }

        if query.city:
            params["q"] = query.city.strip()
        elif query.lat is not None and query.lon is not None:
            params["lat"] = str(query.lat)
            params["lon"] = str(query.lon)
        else:
            raise AppError(
                status_code=400,
                code="weather_params_invalid",
                detail="Paramètres invalides pour la météo.",
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(OPENWEATHER_CURRENT_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise AppError(
                status_code=503,
                code="weather_unavailable",
                detail="Météo indisponible pour le moment.",
            ) from exc

        if not isinstance(data, dict):
            raise AppError(
                status_code=503,
                code="weather_unavailable",
                detail="Météo indisponible pour le moment.",
            )
        return data

    def _parse_openweather_current(self, data: dict[str, Any]) -> WeatherCurrentOut:
        try:
            weather0 = data.get("weather", [])[0] if isinstance(data.get("weather"), list) else None
            if not isinstance(weather0, dict):
                raise KeyError("weather[0]")

            main = data["main"]
            if not isinstance(main, dict):
                raise KeyError("main")

            sys = data.get("sys", {})
            if not isinstance(sys, dict):
                sys = {}

            temp = float(main["temp"])
            feels_like = float(main["feels_like"])
            condition = str(weather0.get("description", "")).strip() or "Météo"
            icon = weather0.get("icon")
            icon_str = str(icon) if isinstance(icon, str) else None

            sunrise_ts = sys.get("sunrise")
            sunset_ts = sys.get("sunset")

            sunrise = (
                datetime.fromtimestamp(float(sunrise_ts), tz=UTC)
                if isinstance(sunrise_ts, (int, float, str))
                else None
            )
            sunset = (
                datetime.fromtimestamp(float(sunset_ts), tz=UTC)
                if isinstance(sunset_ts, (int, float, str))
                else None
            )

            now_utc_ts = time.time()
            is_day = True
            if sunrise and sunset:
                is_day = sunrise.timestamp() <= now_utc_ts <= sunset.timestamp()

            city = str(data.get("name") or "Ville inconnue")
            country = sys.get("country")
            country_str = str(country) if isinstance(country, str) else None

            return WeatherCurrentOut(
                temperature=temp,
                feels_like=feels_like,
                condition=condition,
                icon=icon_str,
                sunrise=sunrise,
                sunset=sunset,
                is_day=is_day,
                city=city,
                country=country_str,
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise AppError(
                status_code=503,
                code="weather_unavailable",
                detail="Météo indisponible pour le moment.",
            ) from exc


def clear_weather_cache_for_tests() -> None:
    _CACHE.clear()

