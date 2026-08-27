from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

WeatherSource = Literal["provider", "development_stub"]


class WeatherCurrentOut(BaseModel):
    """Current weather for UI (WEB-SEARCH-02A).

    `source` (C3-D1.2-R3A) rend la provenance EXPLICITE : sans lui, le stub de
    developpement etait structurellement indiscernable d'une reponse
    OpenWeatherMap, et un consommateur pouvait afficher des degres fabriques
    comme s'ils etaient reels. Extension additive : les champs existants sont
    inchanges.
    """

    temperature: float
    feels_like: float
    condition: str
    icon: str | None
    sunrise: datetime | None
    sunset: datetime | None
    is_day: bool
    city: str
    country: str | None
    source: WeatherSource
    # Fournis uniquement par le provider reel ; jamais calcules ni devines.
    temperature_min: float | None = None
    temperature_max: float | None = None
    wind_speed: float | None = None
