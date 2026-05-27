from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class WeatherCurrentOut(BaseModel):
    """Current weather for UI (WEB-SEARCH-02A)."""

    temperature: float
    feels_like: float
    condition: str
    icon: str | None
    sunrise: datetime | None
    sunset: datetime | None
    is_day: bool
    city: str
    country: str | None

