import calendar
import logging
from datetime import date, datetime, timedelta, timezone

import httpx

from app.config.settings import settings
from app.weather.domain.entities.weather_forecast import WeatherForecast
from app.weather.domain.ports.iweather_provider import GeocodedCity, IWeatherProvider

logger = logging.getLogger(__name__)


class OpenWeatherClient(IWeatherProvider):
    def geocode(self, city_name: str) -> GeocodedCity:
        if not settings.OPENWEATHER_API_KEY:
            raise ValueError("OPENWEATHER_API_KEY is not configured")

        query = city_name.strip()
        if not query:
            raise ValueError("City name is required")

        response = httpx.get(
            settings.OPENWEATHER_GEO_URL,
            params={"q": query, "limit": 1, "appid": settings.OPENWEATHER_API_KEY},
            timeout=15.0,
        )
        response.raise_for_status()
        results = response.json()
        if not results:
            raise ValueError(f"City not found: {query}")

        item = results[0]
        name = item.get("name", query)
        country = item.get("country", "")
        display_name = f"{name},{country}" if country else name
        return GeocodedCity(
            name=display_name,
            lat=float(item["lat"]),
            lon=float(item["lon"]),
        )

    def get_daily_forecast(self, lat: float, lon: float, travel_hour: int) -> WeatherForecast:
        if not settings.OPENWEATHER_API_KEY:
            raise ValueError("OPENWEATHER_API_KEY is not configured")

        entries, timezone_offset = self._fetch_forecast_entries(lat, lon)
        if not entries:
            raise ValueError("No forecast available from OpenWeatherMap")

        best_entry, matched_local_time = self._find_closest_entry(
            entries,
            timezone_offset,
            travel_hour,
        )
        if not best_entry:
            available = self.list_available_local_hours(entries, timezone_offset)
            raise ValueError(
                "No forecast available for the requested travel hour. "
                f"Available local hours from API: {', '.join(available) or 'none'}"
            )

        weather = best_entry.get("weather", [{}])[0]
        pop = best_entry.get("pop", 0)
        main = best_entry.get("main", {})

        logger.info(
            "OpenWeather forecast matched travel_hour=%s with block at %s (mode=%s, tz_offset=%s)",
            travel_hour,
            matched_local_time,
            settings.OPENWEATHER_FORECAST_MODE,
            timezone_offset,
        )

        return WeatherForecast(
            temperature_c=round(float(main.get("temp", 0)), 1),
            feels_like_c=round(float(main.get("feels_like", main.get("temp", 0))), 1),
            rain_probability=int(round(float(pop) * 100)),
            condition=weather.get("main", ""),
            description=weather.get("description", ""),
            matched_local_time=matched_local_time,
            requested_travel_hour=travel_hour,
        )

    def list_available_local_hours(
        self,
        entries: list[dict] | None = None,
        timezone_offset: int | None = None,
        lat: float | None = None,
        lon: float | None = None,
    ) -> list[str]:
        """Lista bloques horarios locales futuros devueltos por OpenWeatherMap."""
        if entries is None:
            if lat is None or lon is None:
                raise ValueError("lat and lon are required when entries are not provided")
            entries, timezone_offset = self._fetch_forecast_entries(lat, lon)

        assert timezone_offset is not None
        now_utc = int(datetime.now(timezone.utc).timestamp())
        hours: list[str] = []
        for entry in entries:
            entry_dt = entry.get("dt")
            if entry_dt is None or int(entry_dt) < now_utc:
                continue
            hours.append(self._format_local_time(int(entry_dt), timezone_offset))
        return hours

    def _fetch_forecast_entries(self, lat: float, lon: float) -> tuple[list[dict], int]:
        forecast_url = self._forecast_url()
        response = httpx.get(
            forecast_url,
            params={
                "lat": lat,
                "lon": lon,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": "metric",
                "lang": "es",
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        entries = data.get("list", [])
        timezone_offset = int(data.get("city", {}).get("timezone", 0))
        return entries, timezone_offset

    def _forecast_url(self) -> str:
        if settings.OPENWEATHER_FORECAST_MODE == "hourly":
            return settings.OPENWEATHER_HOURLY_FORECAST_URL
        return settings.OPENWEATHER_FORECAST_URL

    def _find_closest_entry(
        self,
        entries: list[dict],
        timezone_offset: int,
        travel_hour: int,
    ) -> tuple[dict | None, str]:
        now_utc = int(datetime.now(timezone.utc).timestamp())
        travel_date = self._resolve_travel_target_date(now_utc, timezone_offset, travel_hour)
        target_utc = self._target_utc_timestamp(travel_date, travel_hour, timezone_offset)

        best_entry: dict | None = None
        best_diff: int | None = None
        best_local_time = ""

        for entry in entries:
            entry_dt = entry.get("dt")
            if entry_dt is None or int(entry_dt) < now_utc:
                continue

            diff = abs(int(entry_dt) - target_utc)
            if best_diff is None or diff < best_diff:
                best_diff = diff
                best_entry = entry
                best_local_time = self._format_local_time(int(entry_dt), timezone_offset)

        return best_entry, best_local_time

    def _resolve_travel_target_date(
        self,
        now_utc: int,
        timezone_offset: int,
        travel_hour: int,
    ) -> date:
        today_local = self._city_local_date(now_utc, timezone_offset)
        travel_today_utc = self._target_utc_timestamp(today_local, travel_hour, timezone_offset)
        if travel_today_utc > now_utc:
            return today_local
        return today_local + timedelta(days=1)

    @staticmethod
    def _city_local_date(unix_utc: int, timezone_offset: int) -> date:
        return datetime.fromtimestamp(unix_utc + timezone_offset, tz=timezone.utc).date()

    @staticmethod
    def _target_utc_timestamp(local_date: date, travel_hour: int, timezone_offset: int) -> int:
        return (
            calendar.timegm(
                (local_date.year, local_date.month, local_date.day, travel_hour, 0, 0),
            )
            - timezone_offset
        )

    @staticmethod
    def _format_local_time(unix_utc: int, timezone_offset: int) -> str:
        local_dt = datetime.fromtimestamp(unix_utc + timezone_offset, tz=timezone.utc)
        return local_dt.strftime("%Y-%m-%d %H:%M")
