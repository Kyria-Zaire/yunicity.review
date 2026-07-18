"""Weather tests (WEB-SEARCH-02A)."""

from __future__ import annotations

import time
from typing import Any

import httpx
import pytest
from app.core.config import get_settings
from app.core.errors import AppError
from app.services.weather_service import (
    WeatherCurrentQuery,
    WeatherService,
    clear_weather_cache_for_tests,
)


def _openweather_payload(now_ts: float) -> dict[str, Any]:
    # Ensure sunrise/sunset window includes "now" so is_day=true.
    sunrise = int(now_ts - 3600)
    sunset = int(now_ts + 3600)
    return {
        "weather": [{"id": 800, "main": "Clear", "description": "ciel dégagé", "icon": "01d"}],
        "main": {"temp": 20.0, "feels_like": 19.0},
        "sys": {"sunrise": sunrise, "sunset": sunset, "country": "FR"},
        "timezone": 3600,
        "name": "Laon",
    }


async def test_weather_cache_hits(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    settings = get_settings()

    clear_weather_cache_for_tests()
    service = WeatherService(settings, cache_ttl_seconds=300)

    calls = 0
    now_ts = time.time()
    payload = _openweather_payload(now_ts)

    async def fake_fetch(query: WeatherCurrentQuery) -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return payload

    service._fetch_openweather_current = fake_fetch  # type: ignore[method-assign]

    query = WeatherCurrentQuery(city="Laon", lat=None, lon=None)
    first = await service.get_current(query)
    second = await service.get_current(query)

    assert calls == 1
    assert first.city == "Laon"
    assert second.temperature == 20.0


async def test_weather_key_missing_outside_dev(monkeypatch: pytest.MonkeyPatch) -> None:
    # setenv("") instead of delenv: a real key in local .env would otherwise leak in.
    monkeypatch.setenv("OPENWEATHER_API_KEY", "")
    monkeypatch.setenv("APP_ENV", "recette")
    get_settings.cache_clear()
    settings = get_settings()

    clear_weather_cache_for_tests()
    service = WeatherService(settings, cache_ttl_seconds=1)

    query = WeatherCurrentQuery(city="Laon", lat=None, lon=None)
    with pytest.raises(AppError) as excinfo:
        await service.get_current(query)
    assert excinfo.value.code == "weather_key_missing"


async def test_weather_dev_stub_when_key_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    # setenv("") instead of delenv: a real key in local .env would otherwise leak in.
    monkeypatch.setenv("OPENWEATHER_API_KEY", "")
    monkeypatch.setenv("APP_ENV", "dev")
    get_settings.cache_clear()
    settings = get_settings()

    clear_weather_cache_for_tests()
    service = WeatherService(settings, cache_ttl_seconds=1)

    query = WeatherCurrentQuery(city="Reims", lat=None, lon=None)
    result = await service.get_current(query)

    assert result.city == "Reims"
    assert result.country == "FR"
    assert 10.0 <= result.temperature <= 17.0
    assert result.condition


async def test_weather_fetch_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    settings = get_settings()

    clear_weather_cache_for_tests()
    service = WeatherService(settings, cache_ttl_seconds=1)

    async def fake_get(*_args: object, **_kwargs: object) -> None:
        raise httpx.HTTPError("boom")

    class FakeAsyncClient:
        async def __aenter__(self) -> FakeAsyncClient:
            return self

        async def __aexit__(self, *_exc: object) -> None:
            return None

        get = fake_get

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_kw: FakeAsyncClient())

    query = WeatherCurrentQuery(city="Laon", lat=None, lon=None)
    with pytest.raises(AppError) as excinfo:
        await service._fetch_openweather_current(query)
    assert excinfo.value.code == "weather_unavailable"

