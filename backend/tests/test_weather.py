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


# --- C3-D1.2-R3A : provenance explicite de la meteo ---------------------------
#
# Sans discriminant, `_dev_stub_current()` etait structurellement identique a une
# reponse OpenWeatherMap : un consommateur pouvait afficher des degres fabriques
# comme reels. Ces tests verrouillent la distinction.


def _openweather_payload_full(now_ts: float) -> dict[str, Any]:
    """Payload provider incluant les champs optionnels min/max et vent."""
    payload = _openweather_payload(now_ts)
    payload["main"] = {
        **payload["main"],
        "temp_min": 17.5,
        "temp_max": 23.5,
    }
    payload["wind"] = {"speed": 4.2, "deg": 180}
    return payload


async def test_weather_provider_response_is_marked_as_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=300)

    now_ts = time.time()

    async def fake_fetch(query: WeatherCurrentQuery) -> dict[str, Any]:
        return _openweather_payload(now_ts)

    service._fetch_openweather_current = fake_fetch  # type: ignore[method-assign]

    result = await service.get_current(WeatherCurrentQuery(city="Laon", lat=None, lon=None))

    assert result.source == "provider"
    # Les valeurs reelles du payload sont conservees telles quelles.
    assert result.temperature == 20.0
    assert result.feels_like == 19.0
    assert result.condition == "ciel dégagé"
    assert result.city == "Laon"


async def test_weather_dev_stub_is_marked_as_development_stub(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "")
    monkeypatch.setenv("APP_ENV", "dev")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=1)

    result = await service.get_current(WeatherCurrentQuery(city="Reims", lat=None, lon=None))

    assert result.source == "development_stub"
    # Le stub ne peut jamais se faire passer pour le provider.
    assert result.source != "provider"
    # Il ne porte aucun champ optionnel provider.
    assert result.temperature_min is None
    assert result.temperature_max is None
    assert result.wind_speed is None


async def test_weather_key_missing_outside_dev_still_raises_503(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Le 503 n'est jamais transforme en faux succes par l'ajout de `source`."""
    monkeypatch.setenv("OPENWEATHER_API_KEY", "")
    monkeypatch.setenv("APP_ENV", "recette")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=1)

    with pytest.raises(AppError) as excinfo:
        await service.get_current(WeatherCurrentQuery(city="Laon", lat=None, lon=None))

    assert excinfo.value.status_code == 503
    assert excinfo.value.code == "weather_key_missing"


async def test_weather_cache_preserves_source(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=300)

    calls = 0
    now_ts = time.time()

    async def fake_fetch(query: WeatherCurrentQuery) -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return _openweather_payload(now_ts)

    service._fetch_openweather_current = fake_fetch  # type: ignore[method-assign]

    query = WeatherCurrentQuery(city="Laon", lat=None, lon=None)
    first = await service.get_current(query)
    second = await service.get_current(query)

    assert calls == 1
    assert first.source == "provider"
    assert second.source == "provider"


async def test_weather_optional_fields_come_from_provider_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=300)

    now_ts = time.time()

    async def fake_fetch(query: WeatherCurrentQuery) -> dict[str, Any]:
        return _openweather_payload_full(now_ts)

    service._fetch_openweather_current = fake_fetch  # type: ignore[method-assign]

    result = await service.get_current(WeatherCurrentQuery(city="Laon", lat=None, lon=None))

    assert result.source == "provider"
    assert result.temperature_min == 17.5
    assert result.temperature_max == 23.5
    assert result.wind_speed == 4.2


async def test_weather_optional_fields_absent_stay_none(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Champs absents du payload : jamais calcules, jamais devines."""
    monkeypatch.setenv("OPENWEATHER_API_KEY", "test-key")
    get_settings.cache_clear()
    clear_weather_cache_for_tests()
    service = WeatherService(get_settings(), cache_ttl_seconds=300)

    now_ts = time.time()

    async def fake_fetch(query: WeatherCurrentQuery) -> dict[str, Any]:
        return _openweather_payload(now_ts)

    service._fetch_openweather_current = fake_fetch  # type: ignore[method-assign]

    result = await service.get_current(WeatherCurrentQuery(city="Laon", lat=None, lon=None))

    assert result.temperature_min is None
    assert result.temperature_max is None
    assert result.wind_speed is None
