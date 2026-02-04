"""
Главный модуль FastAPI приложения
Система прогнозирования лесных пожаров
Департамент по чрезвычайным ситуациям города Павлодар
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from datetime import datetime
from typing import Optional, List
import pandas as pd
import numpy as np
from io import BytesIO, StringIO
import json

from .models import (
    WeatherData, PredictionResult, HistoricalData, ZoneRisk,
    DangerLevel, VegetationType
)
from .fire_index import (
    calculate_nesterov_index,
    calculate_simplified_fwi,
    calculate_composite_index,
    determine_danger_level,
    get_recommendations
)
from .database import (
    init_database, init_mock_data, save_prediction,
    get_predictions_history, get_latest_predictions_by_location,
    get_prediction_by_id, get_statistics, get_monitoring_zones
)
from .pdf_generator import generate_prediction_report, generate_history_report


# Инициализация приложения
app = FastAPI(
    title="Система прогнозирования лесных пожаров",
    description="API для Департамента по чрезвычайным ситуациям города Павлодар",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске приложения"""
    init_database()
    init_mock_data()


# ==================== ЭНДПОИНТЫ API ====================

@app.get("/api/health")
async def health_check():
    """Проверка работоспособности API"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/predict", response_model=PredictionResult)
async def predict_fire_danger(data: WeatherData):
    """
    Расчет прогноза пожарной опасности

    Принимает метеорологические данные и возвращает:
    - Индекс Нестерова
    - Канадский индекс FWI
    - Комплексный индекс опасности
    - Уровень опасности с цветовой кодировкой
    - Рекомендации по действиям
    """
    try:
        # Расчет индекса Нестерова
        nesterov_index = calculate_nesterov_index(
            temperature=data.temperature,
            humidity=data.humidity,
            precipitation=data.precipitation
        )

        # Расчет упрощенного FWI
        fwi_index = calculate_simplified_fwi(
            temperature=data.temperature,
            humidity=data.humidity,
            wind_speed=data.wind_speed,
            precipitation=data.precipitation,
            vegetation_moisture=data.vegetation_moisture
        )

        # Расчет комплексного индекса
        composite_index = calculate_composite_index(
            nesterov_index=nesterov_index,
            fwi_index=fwi_index,
            vegetation_type=data.vegetation_type,
            wind_speed=data.wind_speed,
            soil_moisture=data.soil_moisture
        )

        # Определение уровня опасности
        danger_level, danger_text, danger_color = determine_danger_level(composite_index)

        # Получение рекомендаций
        recommendations = get_recommendations(danger_level, composite_index)

        # Формирование результата
        result = PredictionResult(
            timestamp=datetime.now(),
            input_data=data,
            nesterov_index=nesterov_index,
            fwi_index=fwi_index,
            composite_index=composite_index,
            danger_level=danger_level,
            danger_level_text=danger_text,
            danger_level_color=danger_color,
            recommendations=recommendations
        )

        # Сохранение в базу данных
        prediction_data = {
            'timestamp': result.timestamp.isoformat(),
            'location_name': data.location_name,
            'latitude': data.latitude,
            'longitude': data.longitude,
            'temperature': data.temperature,
            'humidity': data.humidity,
            'wind_speed': data.wind_speed,
            'wind_direction': data.wind_direction,
            'precipitation': data.precipitation,
            'soil_moisture': data.soil_moisture,
            'vegetation_moisture': data.vegetation_moisture,
            'vegetation_type': data.vegetation_type.value,
            'nesterov_index': nesterov_index,
            'fwi_index': fwi_index,
            'composite_index': composite_index,
            'danger_level': danger_level.value,
            'danger_level_text': danger_text
        }
        result.id = save_prediction(prediction_data)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка расчета: {str(e)}")


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Загрузка файла с историческими данными (CSV или Excel)

    Ожидаемые колонки:
    - temperature (обязательно)
    - humidity (обязательно)
    - wind_speed (обязательно)
    - precipitation (обязательно)
    - wind_direction (опционально)
    - soil_moisture (опционально)
    - vegetation_moisture (опционально)
    - vegetation_type (опционально)
    - location_name (опционально)
    - latitude (опционально)
    - longitude (опционально)
    - date/timestamp (опционально)
    """
    try:
        # Чтение файла
        content = await file.read()

        # Определение типа файла и парсинг
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(content))
        else:
            raise HTTPException(
                status_code=400,
                detail="Поддерживаются только файлы CSV и Excel (.xlsx, .xls)"
            )

        # Проверка обязательных колонок
        required_columns = ['temperature', 'humidity', 'wind_speed', 'precipitation']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Отсутствуют обязательные колонки: {', '.join(missing_columns)}"
            )

        # Обработка каждой строки
        results = []
        for _, row in df.iterrows():
            # Подготовка данных
            weather_data = WeatherData(
                temperature=float(row['temperature']),
                humidity=float(row['humidity']),
                wind_speed=float(row['wind_speed']),
                precipitation=float(row['precipitation']),
                wind_direction=str(row.get('wind_direction', 'С')),
                soil_moisture=float(row.get('soil_moisture', 50)),
                vegetation_moisture=float(row.get('vegetation_moisture', 100)),
                vegetation_type=VegetationType(row.get('vegetation_type', 'mixed')),
                location_name=row.get('location_name'),
                latitude=row.get('latitude'),
                longitude=row.get('longitude')
            )

            # Расчет индексов
            nesterov_index = calculate_nesterov_index(
                weather_data.temperature,
                weather_data.humidity,
                weather_data.precipitation
            )

            fwi_index = calculate_simplified_fwi(
                weather_data.temperature,
                weather_data.humidity,
                weather_data.wind_speed,
                weather_data.precipitation,
                weather_data.vegetation_moisture
            )

            composite_index = calculate_composite_index(
                nesterov_index,
                fwi_index,
                weather_data.vegetation_type,
                weather_data.wind_speed,
                weather_data.soil_moisture
            )

            danger_level, danger_text, danger_color = determine_danger_level(composite_index)

            # Сохранение в БД
            prediction_data = {
                'timestamp': datetime.now().isoformat(),
                'location_name': weather_data.location_name,
                'latitude': weather_data.latitude,
                'longitude': weather_data.longitude,
                'temperature': weather_data.temperature,
                'humidity': weather_data.humidity,
                'wind_speed': weather_data.wind_speed,
                'wind_direction': weather_data.wind_direction,
                'precipitation': weather_data.precipitation,
                'soil_moisture': weather_data.soil_moisture,
                'vegetation_moisture': weather_data.vegetation_moisture,
                'vegetation_type': weather_data.vegetation_type.value,
                'nesterov_index': nesterov_index,
                'fwi_index': fwi_index,
                'composite_index': composite_index,
                'danger_level': danger_level.value,
                'danger_level_text': danger_text
            }
            record_id = save_prediction(prediction_data)

            results.append({
                'id': record_id,
                'location_name': weather_data.location_name,
                'nesterov_index': nesterov_index,
                'fwi_index': fwi_index,
                'composite_index': composite_index,
                'danger_level': danger_level.value,
                'danger_level_text': danger_text
            })

        return {
            "status": "success",
            "message": f"Обработано записей: {len(results)}",
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файла: {str(e)}")


@app.get("/api/history")
async def get_history(
    limit: int = Query(100, ge=1, le=1000, description="Количество записей"),
    offset: int = Query(0, ge=0, description="Смещение"),
    location: Optional[str] = Query(None, description="Фильтр по локации"),
    start_date: Optional[str] = Query(None, description="Начальная дата (ISO формат)"),
    end_date: Optional[str] = Query(None, description="Конечная дата (ISO формат)")
):
    """Получение истории прогнозов с фильтрацией"""
    try:
        history = get_predictions_history(
            limit=limit,
            offset=offset,
            location_name=location,
            start_date=start_date,
            end_date=end_date
        )
        return {"status": "success", "data": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории: {str(e)}")


@app.get("/api/zones")
async def get_risk_zones():
    """Получение зон риска для отображения на карте"""
    try:
        # Получаем последние прогнозы по каждой локации
        latest = get_latest_predictions_by_location(limit=20)

        zones = []
        for pred in latest:
            if pred.get('latitude') and pred.get('longitude'):
                zones.append({
                    'id': pred['id'],
                    'name': pred.get('location_name', 'Неизвестно'),
                    'latitude': pred['latitude'],
                    'longitude': pred['longitude'],
                    'danger_level': pred['danger_level'],
                    'danger_level_text': pred['danger_level_text'],
                    'nesterov_index': pred['nesterov_index'],
                    'fwi_index': pred['fwi_index'],
                    'composite_index': pred.get('composite_index', 0),
                    'temperature': pred.get('temperature'),
                    'humidity': pred.get('humidity'),
                    'last_updated': pred['timestamp']
                })

        return {"status": "success", "zones": zones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения зон: {str(e)}")


@app.get("/api/statistics")
async def get_stats(days: int = Query(30, ge=1, le=365)):
    """Получение статистики за период"""
    try:
        stats = get_statistics(days=days)
        return {"status": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")


@app.get("/api/export/pdf")
async def export_pdf(
    prediction_id: Optional[int] = Query(None, description="ID конкретного прогноза"),
    start_date: Optional[str] = Query(None, description="Начало периода для отчета по истории"),
    end_date: Optional[str] = Query(None, description="Конец периода")
):
    """
    Экспорт отчета в PDF формате

    Если указан prediction_id - генерируется отчет по конкретному прогнозу
    Иначе - отчет по истории за указанный период
    """
    try:
        if prediction_id:
            # Отчет по конкретному прогнозу
            prediction = get_prediction_by_id(prediction_id)
            if not prediction:
                raise HTTPException(status_code=404, detail="Прогноз не найден")

            # Добавляем рекомендации
            danger_level = DangerLevel(prediction['danger_level'])
            prediction['recommendations'] = get_recommendations(
                danger_level,
                prediction.get('composite_index', 0)
            )

            pdf_content = generate_prediction_report(prediction)
            filename = f"fire_forecast_{prediction_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        else:
            # Отчет по истории
            history = get_predictions_history(
                limit=100,
                start_date=start_date,
                end_date=end_date
            )
            period = ""
            if start_date and end_date:
                period = f"с {start_date} по {end_date}"
            elif start_date:
                period = f"с {start_date}"
            elif end_date:
                period = f"по {end_date}"

            pdf_content = generate_history_report(history, period)
            filename = f"fire_forecast_history_{datetime.now().strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации PDF: {str(e)}")


@app.get("/api/export/csv")
async def export_csv(
    start_date: Optional[str] = Query(None, description="Начало периода"),
    end_date: Optional[str] = Query(None, description="Конец периода"),
    location: Optional[str] = Query(None, description="Фильтр по локации")
):
    """Экспорт данных в CSV формате"""
    try:
        history = get_predictions_history(
            limit=10000,
            start_date=start_date,
            end_date=end_date,
            location_name=location
        )

        if not history:
            raise HTTPException(status_code=404, detail="Нет данных для экспорта")

        # Преобразование в DataFrame
        df = pd.DataFrame(history)

        # Переименование колонок на русский
        column_names = {
            'timestamp': 'Дата и время',
            'location_name': 'Локация',
            'latitude': 'Широта',
            'longitude': 'Долгота',
            'temperature': 'Температура (°C)',
            'humidity': 'Влажность (%)',
            'wind_speed': 'Скорость ветра (м/с)',
            'wind_direction': 'Направление ветра',
            'precipitation': 'Осадки (мм)',
            'soil_moisture': 'Влажность почвы (%)',
            'vegetation_moisture': 'Влажность растительности (%)',
            'vegetation_type': 'Тип растительности',
            'nesterov_index': 'Индекс Нестерова',
            'fwi_index': 'Индекс FWI',
            'composite_index': 'Комплексный индекс',
            'danger_level': 'Уровень опасности',
            'danger_level_text': 'Описание уровня'
        }
        df = df.rename(columns=column_names)

        # Генерация CSV
        output = StringIO()
        df.to_csv(output, index=False, encoding='utf-8-sig')
        output.seek(0)

        filename = f"fire_forecast_data_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"

        return StreamingResponse(
            BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка экспорта CSV: {str(e)}")


@app.get("/api/monitoring-zones")
async def get_zones():
    """Получение списка зон мониторинга"""
    try:
        zones = get_monitoring_zones()
        return {"status": "success", "zones": zones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


# Запуск приложения (для разработки)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
