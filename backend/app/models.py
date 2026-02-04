"""
Модели данных для системы прогнозирования лесных пожаров
Департамент по чрезвычайным ситуациям города Павлодар
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VegetationType(str, Enum):
    """Тип растительности"""
    CONIFEROUS = "coniferous"  # Хвойный
    DECIDUOUS = "deciduous"    # Лиственный
    MIXED = "mixed"            # Смешанный


class DangerLevel(str, Enum):
    """Уровень пожарной опасности"""
    LOW = "low"           # Низкий (зеленый)
    MEDIUM = "medium"     # Средний (желтый)
    HIGH = "high"         # Высокий (оранжевый)
    EXTREME = "extreme"   # Чрезвычайный (красный)


class WeatherData(BaseModel):
    """Входные метеорологические данные"""
    wind_speed: float = Field(..., ge=0, le=50, description="Скорость ветра (м/с)")
    wind_direction: str = Field(..., description="Направление ветра (С, СВ, В, ЮВ, Ю, ЮЗ, З, СЗ)")
    temperature: float = Field(..., ge=-50, le=60, description="Температура воздуха (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Влажность воздуха (%)")
    soil_moisture: float = Field(..., ge=0, le=100, description="Влажность почвы (%)")
    vegetation_moisture: float = Field(..., ge=0, le=200, description="Влажность растительности (%)")
    precipitation: float = Field(..., ge=0, description="Осадки за последние сутки (мм)")
    vegetation_type: VegetationType = Field(..., description="Тип растительности")

    # Опциональные поля для расположения
    location_name: Optional[str] = Field(None, description="Название точки наблюдения")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Широта")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Долгота")


class PredictionResult(BaseModel):
    """Результат прогнозирования"""
    id: Optional[int] = None
    timestamp: datetime

    # Входные данные
    input_data: WeatherData

    # Расчетные индексы
    nesterov_index: float = Field(..., description="Индекс Нестерова")
    fwi_index: float = Field(..., description="Канадский индекс FWI")
    composite_index: float = Field(..., description="Комплексный индекс опасности")

    # Результат
    danger_level: DangerLevel
    danger_level_text: str
    danger_level_color: str

    # Рекомендации
    recommendations: List[str]


class HistoricalData(BaseModel):
    """Историческая запись"""
    id: int
    timestamp: datetime
    location_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    temperature: float
    humidity: float
    wind_speed: float
    precipitation: float
    nesterov_index: float
    fwi_index: float
    danger_level: str


class ZoneRisk(BaseModel):
    """Зона риска для отображения на карте"""
    id: int
    name: str
    latitude: float
    longitude: float
    danger_level: DangerLevel
    nesterov_index: float
    fwi_index: float
    last_updated: datetime
