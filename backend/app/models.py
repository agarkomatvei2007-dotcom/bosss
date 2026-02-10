"""
Модели данных для системы расчета распространения лесных пожаров
Департамент по чрезвычайным ситуациям города Павлодар
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FireSpreadInput(BaseModel):
    """Входные данные для расчета распространения пожара"""
    E: float = Field(..., ge=0.0, le=1.0, description="Коэффициент черноты пламени (0-1)")
    wind_speed: float = Field(..., ge=0, le=50, description="Скорость ветра под пологом леса на высоте 2 м (м/с)")
    wind_direction: str = Field(..., description="Направление ветра (С, СВ, В, ЮВ, Ю, ЮЗ, З, СЗ)")
    rho: float = Field(..., gt=0, le=1000, description="Плотность сложения горючего материала (кг/м³)")
    W: float = Field(..., ge=0, le=200, description="Влажность горючего материала (%)")
    t: float = Field(..., gt=0, le=72, description="Время с начала пожара (часы)")

    # Локация
    location_name: Optional[str] = Field(None, description="Название точки (Баянаул / Щербакты)")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class FireSpreadResult(BaseModel):
    """Результат расчета распространения пожара"""
    timestamp: datetime
    input_data: FireSpreadInput

    # Скорости распространения (м/мин)
    v1: float = Field(..., description="Скорость по фронту (м/мин)")
    v2: float = Field(..., description="Скорость по флангу (м/мин)")
    v3: float = Field(..., description="Скорость по тылу (м/мин)")

    # Периметр и площадь
    perimeter: float = Field(..., description="Периметр кромки пожара (м)")
    area: float = Field(..., description="Площадь пожара (м²)")
    area_ha: float = Field(..., description="Площадь пожара (га)")

    # Расстояния за время t
    d_front: float = Field(..., description="Расстояние по фронту (м)")
    d_flank: float = Field(..., description="Расстояние по флангу (м)")
    d_rear: float = Field(..., description="Расстояние по тылу (м)")

    # Параметры эллипса для карты
    semi_major: float = Field(..., description="Полуось эллипса по ветру (м)")
    semi_minor: float = Field(..., description="Полуось эллипса перпендикулярно ветру (м)")
    center_offset: float = Field(..., description="Смещение центра эллипса от точки возгорания (м)")
