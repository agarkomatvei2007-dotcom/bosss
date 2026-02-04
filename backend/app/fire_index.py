"""
Модуль расчета индексов пожарной опасности
Реализованы: индекс Нестерова и упрощенный Канадский индекс FWI

Департамент по чрезвычайным ситуациям города Павлодар
"""

import numpy as np
from typing import Tuple, List
from .models import DangerLevel, VegetationType


def calculate_humidity_deficit(temperature: float, humidity: float) -> float:
    """
    Расчет дефицита влажности воздуха

    Дефицит влажности = давление насыщенного пара - фактическое давление пара
    Упрощенная формула: d = (100 - humidity) * e_s / 100
    где e_s = 6.11 * 10^(7.5 * T / (237.3 + T)) - формула Магнуса

    Args:
        temperature: Температура воздуха (°C)
        humidity: Относительная влажность (%)

    Returns:
        Дефицит влажности (гПа)
    """
    if temperature <= 0:
        return 0.0

    # Давление насыщенного пара по формуле Магнуса
    e_s = 6.11 * (10 ** (7.5 * temperature / (237.3 + temperature)))

    # Дефицит влажности
    deficit = (100 - humidity) * e_s / 100

    return max(0, deficit)


def calculate_nesterov_index(
    temperature: float,
    humidity: float,
    precipitation: float,
    previous_index: float = 0.0
) -> float:
    """
    Расчет показателя горимости по формуле Нестерова

    Формула: Г = Σ(t * d) для дней без осадков
    где:
        t - температура воздуха в 13:00 (°C)
        d - дефицит влажности воздуха (гПа)

    При выпадении осадков >= 3 мм индекс сбрасывается до 0

    Args:
        temperature: Температура воздуха (°C)
        humidity: Относительная влажность (%)
        precipitation: Количество осадков (мм)
        previous_index: Предыдущее значение индекса

    Returns:
        Индекс Нестерова
    """
    # Если осадки >= 3 мм, индекс сбрасывается
    if precipitation >= 3.0:
        return 0.0

    # Расчет дефицита влажности
    deficit = calculate_humidity_deficit(temperature, humidity)

    # Прирост индекса за текущий день
    daily_increment = temperature * deficit if temperature > 0 else 0

    # Накопительный индекс
    nesterov_index = previous_index + daily_increment

    return round(nesterov_index, 2)


def calculate_ffmc(temperature: float, humidity: float, wind_speed: float, precipitation: float) -> float:
    """
    Расчет индекса влажности мелкого топлива (Fine Fuel Moisture Code)
    Упрощенная версия из Канадской системы FWI

    Args:
        temperature: Температура (°C)
        humidity: Влажность (%)
        wind_speed: Скорость ветра (м/с)
        precipitation: Осадки (мм)

    Returns:
        Индекс FFMC (0-100)
    """
    # Начальное значение влажности топлива
    mo = 85.0  # Стандартное начальное значение

    # Корректировка на осадки
    if precipitation > 0.5:
        rf = precipitation - 0.5
        if mo <= 150:
            mo = mo + 42.5 * rf * np.exp(-100 / (251 - mo)) * (1 - np.exp(-6.93 / rf))
        else:
            mo = mo + 42.5 * rf * np.exp(-100 / (251 - mo)) * (1 - np.exp(-6.93 / rf)) + \
                 0.0015 * (mo - 150) ** 2 * np.sqrt(rf)
        mo = min(mo, 250)

    # Расчет равновесной влажности при высушивании
    ed = 0.942 * (humidity ** 0.679) + 11 * np.exp((humidity - 100) / 10) + \
         0.18 * (21.1 - temperature) * (1 - np.exp(-0.115 * humidity))

    # Расчет равновесной влажности при увлажнении
    ew = 0.618 * (humidity ** 0.753) + 10 * np.exp((humidity - 100) / 10) + \
         0.18 * (21.1 - temperature) * (1 - np.exp(-0.115 * humidity))

    # Определение направления изменения влажности
    if mo > ed:
        # Высушивание
        ko = 0.424 * (1 - (humidity / 100) ** 1.7) + \
             0.0694 * np.sqrt(wind_speed * 3.6) * (1 - (humidity / 100) ** 8)
        kd = ko * 0.581 * np.exp(0.0365 * temperature)
        m = ed + (mo - ed) * (10 ** (-kd))
    elif mo < ew:
        # Увлажнение
        kl = 0.424 * (1 - ((100 - humidity) / 100) ** 1.7) + \
             0.0694 * np.sqrt(wind_speed * 3.6) * (1 - ((100 - humidity) / 100) ** 8)
        kw = kl * 0.581 * np.exp(0.0365 * temperature)
        m = ew - (ew - mo) * (10 ** (-kw))
    else:
        m = mo

    # Преобразование влажности в FFMC
    ffmc = 59.5 * (250 - m) / (147.2 + m)
    ffmc = max(0, min(100, ffmc))

    return round(ffmc, 2)


def calculate_isi(wind_speed: float, ffmc: float) -> float:
    """
    Расчет индекса начального распространения (Initial Spread Index)

    Args:
        wind_speed: Скорость ветра (м/с)
        ffmc: Индекс влажности мелкого топлива

    Returns:
        Индекс ISI
    """
    # Влажность топлива из FFMC
    m = 147.2 * (101 - ffmc) / (59.5 + ffmc)

    # Функция ветра (конвертируем м/с в км/ч)
    wind_kmh = wind_speed * 3.6
    fw = np.exp(0.05039 * wind_kmh)

    # Функция влажности
    ff = 91.9 * np.exp(-0.1386 * m) * (1 + m ** 5.31 / (4.93 * 10 ** 7))

    isi = 0.208 * fw * ff

    return round(isi, 2)


def calculate_simplified_fwi(
    temperature: float,
    humidity: float,
    wind_speed: float,
    precipitation: float,
    vegetation_moisture: float = 100.0
) -> float:
    """
    Упрощенный расчет Канадского индекса пожарной опасности (FWI)

    Учитывает:
    - Температуру и влажность воздуха
    - Скорость ветра
    - Осадки
    - Влажность растительности

    Args:
        temperature: Температура (°C)
        humidity: Влажность воздуха (%)
        wind_speed: Скорость ветра (м/с)
        precipitation: Осадки (мм)
        vegetation_moisture: Влажность растительности (%)

    Returns:
        Упрощенный индекс FWI (0-100+)
    """
    # Базовый расчет FFMC и ISI
    ffmc = calculate_ffmc(temperature, humidity, wind_speed, precipitation)
    isi = calculate_isi(wind_speed, ffmc)

    # Корректировка на влажность растительности
    vegetation_factor = max(0.3, 1 - vegetation_moisture / 200)

    # Корректировка на осадки
    precipitation_factor = max(0, 1 - precipitation / 10)

    # Расчет FWI
    fwi = isi * vegetation_factor * precipitation_factor

    # Температурная корректировка
    if temperature > 25:
        fwi *= 1 + (temperature - 25) * 0.02
    elif temperature < 10:
        fwi *= max(0.3, temperature / 10)

    return round(max(0, fwi), 2)


def get_vegetation_coefficient(vegetation_type: VegetationType) -> float:
    """
    Коэффициент пожароопасности по типу растительности

    Args:
        vegetation_type: Тип растительности

    Returns:
        Коэффициент (1.0 - 1.5)
    """
    coefficients = {
        VegetationType.CONIFEROUS: 1.5,   # Хвойные леса наиболее пожароопасны
        VegetationType.MIXED: 1.25,        # Смешанные леса
        VegetationType.DECIDUOUS: 1.0,     # Лиственные леса наименее опасны
    }
    return coefficients.get(vegetation_type, 1.0)


def calculate_composite_index(
    nesterov_index: float,
    fwi_index: float,
    vegetation_type: VegetationType,
    wind_speed: float,
    soil_moisture: float
) -> float:
    """
    Расчет комплексного индекса пожарной опасности

    Объединяет индекс Нестерова и FWI с учетом дополнительных факторов

    Args:
        nesterov_index: Индекс Нестерова
        fwi_index: Канадский индекс FWI
        vegetation_type: Тип растительности
        wind_speed: Скорость ветра (м/с)
        soil_moisture: Влажность почвы (%)

    Returns:
        Комплексный индекс опасности
    """
    # Нормализация индекса Нестерова (типичный диапазон 0-10000)
    normalized_nesterov = min(100, nesterov_index / 100)

    # FWI уже в диапазоне 0-100+
    normalized_fwi = min(100, fwi_index)

    # Взвешенное среднее двух индексов
    base_index = 0.5 * normalized_nesterov + 0.5 * normalized_fwi

    # Коэффициент растительности
    veg_coef = get_vegetation_coefficient(vegetation_type)

    # Корректировка на ветер (усиление при сильном ветре)
    wind_factor = 1 + max(0, (wind_speed - 5)) * 0.05

    # Корректировка на влажность почвы (снижение при высокой влажности)
    soil_factor = max(0.5, 1 - soil_moisture / 200)

    # Итоговый комплексный индекс
    composite = base_index * veg_coef * wind_factor * soil_factor

    return round(composite, 2)


def determine_danger_level(composite_index: float) -> Tuple[DangerLevel, str, str]:
    """
    Определение уровня пожарной опасности по комплексному индексу

    Args:
        composite_index: Комплексный индекс опасности

    Returns:
        Кортеж (уровень, текстовое описание, цвет)
    """
    if composite_index < 20:
        return DangerLevel.LOW, "Низкий", "#22c55e"  # Зеленый
    elif composite_index < 50:
        return DangerLevel.MEDIUM, "Средний", "#eab308"  # Желтый
    elif composite_index < 75:
        return DangerLevel.HIGH, "Высокий", "#f97316"  # Оранжевый
    else:
        return DangerLevel.EXTREME, "Чрезвычайный", "#ef4444"  # Красный


def get_recommendations(danger_level: DangerLevel, composite_index: float) -> List[str]:
    """
    Формирование рекомендаций на основе уровня опасности

    Args:
        danger_level: Уровень опасности
        composite_index: Комплексный индекс

    Returns:
        Список рекомендаций
    """
    recommendations = {
        DangerLevel.LOW: [
            "Пожарная обстановка в пределах нормы",
            "Продолжать штатный мониторинг территории",
            "Поддерживать стандартный уровень готовности"
        ],
        DangerLevel.MEDIUM: [
            "Усилить патрулирование лесных массивов",
            "Проверить готовность противопожарного оборудования",
            "Ограничить разведение костров в лесной зоне",
            "Информировать население о мерах предосторожности"
        ],
        DangerLevel.HIGH: [
            "Ввести особый противопожарный режим",
            "Запретить посещение лесов гражданами",
            "Организовать дежурство пожарных расчетов",
            "Подготовить технику для оперативного реагирования",
            "Усилить авиапатрулирование территории"
        ],
        DangerLevel.EXTREME: [
            "ВНИМАНИЕ! Чрезвычайная пожарная опасность!",
            "Ввести режим чрезвычайной ситуации",
            "Запретить любые работы в лесной зоне",
            "Мобилизовать все противопожарные силы",
            "Подготовить эвакуацию населенных пунктов вблизи лесов",
            "Оповестить все службы экстренного реагирования",
            "Организовать круглосуточное дежурство"
        ]
    }

    return recommendations.get(danger_level, [])
