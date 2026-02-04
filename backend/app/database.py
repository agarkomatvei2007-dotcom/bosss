"""
Модуль работы с базой данных SQLite
Хранение истории прогнозов пожарной опасности

Департамент по чрезвычайным ситуациям города Павлодар
"""

import sqlite3
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager
import os

# Путь к файлу базы данных
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "..", "fire_forecast.db")


def get_db_connection():
    """Создание подключения к базе данных"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_session():
    """Контекстный менеджер для работы с БД"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_database():
    """Инициализация базы данных и создание таблиц"""
    with db_session() as conn:
        cursor = conn.cursor()

        # Таблица истории прогнозов
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                location_name TEXT,
                latitude REAL,
                longitude REAL,

                -- Входные данные
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                wind_speed REAL NOT NULL,
                wind_direction TEXT,
                precipitation REAL NOT NULL,
                soil_moisture REAL,
                vegetation_moisture REAL,
                vegetation_type TEXT,

                -- Расчетные индексы
                nesterov_index REAL NOT NULL,
                fwi_index REAL NOT NULL,
                composite_index REAL NOT NULL,

                -- Результат
                danger_level TEXT NOT NULL,
                danger_level_text TEXT NOT NULL,

                -- Дополнительно
                notes TEXT
            )
        """)

        # Таблица зон мониторинга
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS monitoring_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Индексы для ускорения запросов
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_predictions_timestamp
            ON predictions(timestamp DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_predictions_location
            ON predictions(location_name)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_predictions_danger_level
            ON predictions(danger_level)
        """)

        conn.commit()


def save_prediction(prediction_data: Dict[str, Any]) -> int:
    """
    Сохранение прогноза в базу данных

    Args:
        prediction_data: Словарь с данными прогноза

    Returns:
        ID созданной записи
    """
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (
                timestamp, location_name, latitude, longitude,
                temperature, humidity, wind_speed, wind_direction,
                precipitation, soil_moisture, vegetation_moisture, vegetation_type,
                nesterov_index, fwi_index, composite_index,
                danger_level, danger_level_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prediction_data.get('timestamp', datetime.now().isoformat()),
            prediction_data.get('location_name'),
            prediction_data.get('latitude'),
            prediction_data.get('longitude'),
            prediction_data['temperature'],
            prediction_data['humidity'],
            prediction_data['wind_speed'],
            prediction_data.get('wind_direction'),
            prediction_data['precipitation'],
            prediction_data.get('soil_moisture'),
            prediction_data.get('vegetation_moisture'),
            prediction_data.get('vegetation_type'),
            prediction_data['nesterov_index'],
            prediction_data['fwi_index'],
            prediction_data['composite_index'],
            prediction_data['danger_level'],
            prediction_data['danger_level_text']
        ))
        return cursor.lastrowid


def get_predictions_history(
    limit: int = 100,
    offset: int = 0,
    location_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Получение истории прогнозов

    Args:
        limit: Максимальное количество записей
        offset: Смещение для пагинации
        location_name: Фильтр по названию локации
        start_date: Начальная дата (ISO формат)
        end_date: Конечная дата (ISO формат)

    Returns:
        Список записей истории
    """
    with db_session() as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM predictions WHERE 1=1"
        params = []

        if location_name:
            query += " AND location_name = ?"
            params.append(location_name)

        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)

        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        return [dict(row) for row in rows]


def get_latest_predictions_by_location(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Получение последних прогнозов для каждой уникальной локации

    Args:
        limit: Максимальное количество локаций

    Returns:
        Список последних прогнозов по локациям
    """
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.* FROM predictions p
            INNER JOIN (
                SELECT location_name, MAX(timestamp) as max_ts
                FROM predictions
                WHERE location_name IS NOT NULL
                GROUP BY location_name
            ) latest ON p.location_name = latest.location_name
                    AND p.timestamp = latest.max_ts
            ORDER BY p.timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_prediction_by_id(prediction_id: int) -> Optional[Dict[str, Any]]:
    """Получение прогноза по ID"""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_statistics(days: int = 30) -> Dict[str, Any]:
    """
    Получение статистики за период

    Args:
        days: Количество дней для анализа

    Returns:
        Словарь со статистикой
    """
    with db_session() as conn:
        cursor = conn.cursor()

        # Общее количество прогнозов
        cursor.execute("""
            SELECT COUNT(*) as total,
                   AVG(temperature) as avg_temp,
                   AVG(humidity) as avg_humidity,
                   AVG(nesterov_index) as avg_nesterov,
                   AVG(fwi_index) as avg_fwi,
                   AVG(composite_index) as avg_composite
            FROM predictions
            WHERE timestamp >= datetime('now', ?)
        """, (f'-{days} days',))
        stats = dict(cursor.fetchone())

        # Распределение по уровням опасности
        cursor.execute("""
            SELECT danger_level, COUNT(*) as count
            FROM predictions
            WHERE timestamp >= datetime('now', ?)
            GROUP BY danger_level
        """, (f'-{days} days',))
        danger_distribution = {row['danger_level']: row['count'] for row in cursor.fetchall()}
        stats['danger_distribution'] = danger_distribution

        return stats


def add_monitoring_zone(name: str, latitude: float, longitude: float, description: str = None) -> int:
    """Добавление зоны мониторинга"""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO monitoring_zones (name, latitude, longitude, description)
            VALUES (?, ?, ?, ?)
        """, (name, latitude, longitude, description))
        return cursor.lastrowid


def get_monitoring_zones() -> List[Dict[str, Any]]:
    """Получение всех зон мониторинга"""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM monitoring_zones ORDER BY name")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def init_mock_data():
    """Инициализация моковых данных для демонстрации"""
    zones = [
        ("Павлодар - Центр", 52.2873, 76.9674, "Центральная часть города"),
        ("Баянаул", 50.7933, 75.7003, "Баянаульский район"),
        ("Экибастуз", 51.7231, 75.3239, "Экибастузский район"),
        ("Аксу", 52.0414, 76.9167, "Аксуский район"),
        ("Лесная зона Север", 52.4500, 76.8500, "Северный лесной массив"),
        ("Лесная зона Восток", 52.3000, 77.2000, "Восточный лесной массив"),
        ("Иртышский район", 52.0000, 76.5000, "Пойма реки Иртыш"),
    ]

    with db_session() as conn:
        cursor = conn.cursor()

        # Проверяем, есть ли уже данные
        cursor.execute("SELECT COUNT(*) FROM monitoring_zones")
        if cursor.fetchone()[0] > 0:
            return  # Данные уже есть

        # Добавляем зоны мониторинга
        for name, lat, lon, desc in zones:
            cursor.execute("""
                INSERT INTO monitoring_zones (name, latitude, longitude, description)
                VALUES (?, ?, ?, ?)
            """, (name, lat, lon, desc))

        # Добавляем исторические данные
        import random
        from datetime import timedelta

        base_date = datetime.now()
        for zone_name, lat, lon, _ in zones:
            for days_ago in range(14, -1, -1):
                date = base_date - timedelta(days=days_ago)

                # Генерация реалистичных метеоданных
                temp = random.uniform(15, 35)
                humidity = random.uniform(20, 80)
                wind = random.uniform(1, 15)
                precip = random.choice([0, 0, 0, 0, 1, 2, 5, 10])

                # Расчет индексов
                from .fire_index import (
                    calculate_nesterov_index,
                    calculate_simplified_fwi,
                    calculate_composite_index,
                    determine_danger_level,
                    VegetationType
                )

                nesterov = calculate_nesterov_index(temp, humidity, precip)
                fwi = calculate_simplified_fwi(temp, humidity, wind, precip)
                composite = calculate_composite_index(
                    nesterov, fwi, VegetationType.MIXED, wind, 50
                )
                level, level_text, _ = determine_danger_level(composite)

                cursor.execute("""
                    INSERT INTO predictions (
                        timestamp, location_name, latitude, longitude,
                        temperature, humidity, wind_speed, wind_direction,
                        precipitation, soil_moisture, vegetation_moisture, vegetation_type,
                        nesterov_index, fwi_index, composite_index,
                        danger_level, danger_level_text
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    date.isoformat(),
                    zone_name, lat, lon,
                    round(temp, 1), round(humidity, 1), round(wind, 1),
                    random.choice(['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']),
                    precip, 50, 100, 'mixed',
                    nesterov, fwi, composite,
                    level.value, level_text
                ))

        conn.commit()
