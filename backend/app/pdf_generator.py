"""
Модуль генерации PDF отчетов
Департамент по чрезвычайным ситуациям города Павлодар
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List
import os


def get_danger_color(level: str) -> colors.Color:
    """Получение цвета по уровню опасности"""
    color_map = {
        'low': colors.HexColor('#22c55e'),
        'medium': colors.HexColor('#eab308'),
        'high': colors.HexColor('#f97316'),
        'extreme': colors.HexColor('#ef4444'),
    }
    return color_map.get(level, colors.grey)


def get_danger_text(level: str) -> str:
    """Получение текста уровня опасности"""
    text_map = {
        'low': 'НИЗКИЙ',
        'medium': 'СРЕДНИЙ',
        'high': 'ВЫСОКИЙ',
        'extreme': 'ЧРЕЗВЫЧАЙНЫЙ',
    }
    return text_map.get(level, 'НЕИЗВЕСТНО')


def generate_prediction_report(prediction_data: Dict[str, Any]) -> bytes:
    """
    Генерация PDF отчета по прогнозу пожарной опасности

    Args:
        prediction_data: Данные прогноза

    Returns:
        PDF документ в виде bytes
    """
    buffer = BytesIO()

    # Создание документа
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # Стили
    styles = getSampleStyleSheet()

    # Кастомные стили
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=10,
        fontName='Helvetica'
    )

    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=15,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica'
    )

    # Элементы документа
    elements = []

    # Заголовок
    elements.append(Paragraph(
        "ДЕПАРТАМЕНТ ПО ЧРЕЗВЫЧАЙНЫМ СИТУАЦИЯМ",
        title_style
    ))
    elements.append(Paragraph(
        "города Павлодар",
        subtitle_style
    ))
    elements.append(Spacer(1, 10))

    # Название отчета
    elements.append(Paragraph(
        "ОТЧЕТ О ПРОГНОЗЕ ПОЖАРНОЙ ОПАСНОСТИ",
        ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=TA_CENTER,
            spaceBefore=20,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        )
    ))

    # Дата и время
    timestamp = prediction_data.get('timestamp', datetime.now().isoformat())
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp)
        except:
            timestamp = datetime.now()

    elements.append(Paragraph(
        f"Дата и время: {timestamp.strftime('%d.%m.%Y %H:%M')}",
        ParagraphStyle('DateTime', parent=normal_style, alignment=TA_CENTER)
    ))
    elements.append(Spacer(1, 20))

    # Уровень опасности (большой блок)
    danger_level = prediction_data.get('danger_level', 'low')
    danger_color = get_danger_color(danger_level)
    danger_text = get_danger_text(danger_level)

    danger_table = Table([
        [Paragraph(f"УРОВЕНЬ ОПАСНОСТИ: {danger_text}",
                   ParagraphStyle('Danger', fontSize=16, alignment=TA_CENTER,
                                  textColor=colors.white, fontName='Helvetica-Bold'))]
    ], colWidths=[16*cm])
    danger_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), danger_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(danger_table)
    elements.append(Spacer(1, 20))

    # Локация
    location_name = prediction_data.get('location_name', 'Не указано')
    latitude = prediction_data.get('latitude', '-')
    longitude = prediction_data.get('longitude', '-')

    elements.append(Paragraph("МЕСТОПОЛОЖЕНИЕ", header_style))
    location_data = [
        ['Название точки:', location_name],
        ['Координаты:', f"{latitude}° с.ш., {longitude}° в.д." if latitude != '-' else 'Не указаны'],
    ]
    location_table = Table(location_data, colWidths=[5*cm, 11*cm])
    location_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(location_table)
    elements.append(Spacer(1, 15))

    # Метеорологические данные
    elements.append(Paragraph("МЕТЕОРОЛОГИЧЕСКИЕ ДАННЫЕ", header_style))

    input_data = prediction_data.get('input_data', prediction_data)
    weather_data = [
        ['Параметр', 'Значение', 'Единица измерения'],
        ['Температура воздуха', str(input_data.get('temperature', '-')), '°C'],
        ['Относительная влажность', str(input_data.get('humidity', '-')), '%'],
        ['Скорость ветра', str(input_data.get('wind_speed', '-')), 'м/с'],
        ['Направление ветра', str(input_data.get('wind_direction', '-')), ''],
        ['Осадки за сутки', str(input_data.get('precipitation', '-')), 'мм'],
        ['Влажность почвы', str(input_data.get('soil_moisture', '-')), '%'],
        ['Влажность растительности', str(input_data.get('vegetation_moisture', '-')), '%'],
    ]

    veg_type_map = {
        'coniferous': 'Хвойный',
        'deciduous': 'Лиственный',
        'mixed': 'Смешанный'
    }
    veg_type = input_data.get('vegetation_type', '-')
    weather_data.append(['Тип растительности', veg_type_map.get(veg_type, veg_type), ''])

    weather_table = Table(weather_data, colWidths=[6*cm, 5*cm, 5*cm])
    weather_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(weather_table)
    elements.append(Spacer(1, 15))

    # Расчетные индексы
    elements.append(Paragraph("РАСЧЕТНЫЕ ИНДЕКСЫ", header_style))

    indices_data = [
        ['Индекс', 'Значение', 'Описание'],
        ['Индекс Нестерова', str(prediction_data.get('nesterov_index', '-')),
         'Показатель горимости по формуле Нестерова'],
        ['Индекс FWI', str(prediction_data.get('fwi_index', '-')),
         'Канадский индекс пожарной опасности'],
        ['Комплексный индекс', str(prediction_data.get('composite_index', '-')),
         'Интегральный показатель опасности'],
    ]

    indices_table = Table(indices_data, colWidths=[4.5*cm, 3*cm, 8.5*cm])
    indices_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(indices_table)
    elements.append(Spacer(1, 15))

    # Рекомендации
    recommendations = prediction_data.get('recommendations', [])
    if recommendations:
        elements.append(Paragraph("РЕКОМЕНДАЦИИ", header_style))

        for i, rec in enumerate(recommendations, 1):
            elements.append(Paragraph(
                f"{i}. {rec}",
                ParagraphStyle('Rec', parent=normal_style, leftIndent=10, spaceBefore=5)
            ))

        elements.append(Spacer(1, 20))

    # Подпись
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        "_" * 50,
        ParagraphStyle('Line', parent=normal_style, alignment=TA_LEFT)
    ))
    elements.append(Paragraph(
        "Подпись ответственного лица",
        ParagraphStyle('SignLabel', parent=normal_style, fontSize=9, textColor=colors.grey)
    ))

    # Футер
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Отчет сгенерирован автоматически системой прогнозирования лесных пожаров",
        ParagraphStyle('Footer', parent=normal_style, fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))
    elements.append(Paragraph(
        f"© ДЧС города Павлодар, {datetime.now().year}",
        ParagraphStyle('Copyright', parent=normal_style, fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))

    # Сборка документа
    doc.build(elements)

    return buffer.getvalue()


def generate_history_report(predictions: List[Dict[str, Any]], period: str = "за период") -> bytes:
    """
    Генерация PDF отчета по истории прогнозов

    Args:
        predictions: Список прогнозов
        period: Описание периода

    Returns:
        PDF документ в виде bytes
    """
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )

    elements = []

    # Заголовок
    elements.append(Paragraph(
        "ДЕПАРТАМЕНТ ПО ЧРЕЗВЫЧАЙНЫМ СИТУАЦИЯМ",
        title_style
    ))
    elements.append(Paragraph(
        f"История прогнозов пожарной опасности {period}",
        ParagraphStyle('Subtitle', parent=styles['Heading2'], fontSize=12, alignment=TA_CENTER)
    ))
    elements.append(Spacer(1, 20))

    # Таблица с данными
    if predictions:
        table_data = [['Дата', 'Локация', 'Темп.', 'Влаж.', 'Ветер', 'Нестеров', 'FWI', 'Уровень']]

        for pred in predictions[:50]:  # Ограничиваем 50 записями
            timestamp = pred.get('timestamp', '')
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp).strftime('%d.%m %H:%M')
                except:
                    pass

            table_data.append([
                str(timestamp)[:14],
                str(pred.get('location_name', '-'))[:15],
                f"{pred.get('temperature', '-')}°",
                f"{pred.get('humidity', '-')}%",
                f"{pred.get('wind_speed', '-')}",
                str(pred.get('nesterov_index', '-')),
                str(pred.get('fwi_index', '-')),
                get_danger_text(pred.get('danger_level', '')),
            ])

        col_widths = [2.5*cm, 3*cm, 1.5*cm, 1.5*cm, 1.5*cm, 2*cm, 1.5*cm, 3*cm]
        table = Table(table_data, colWidths=col_widths)

        # Стиль таблицы с цветовой кодировкой
        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]

        # Цветовая кодировка строк по уровню опасности
        for i, pred in enumerate(predictions[:50], 1):
            level = pred.get('danger_level', '')
            if level == 'extreme':
                table_style.append(('BACKGROUND', (-1, i), (-1, i), colors.HexColor('#fecaca')))
            elif level == 'high':
                table_style.append(('BACKGROUND', (-1, i), (-1, i), colors.HexColor('#fed7aa')))
            elif level == 'medium':
                table_style.append(('BACKGROUND', (-1, i), (-1, i), colors.HexColor('#fef08a')))
            elif level == 'low':
                table_style.append(('BACKGROUND', (-1, i), (-1, i), colors.HexColor('#bbf7d0')))

        table.setStyle(TableStyle(table_style))
        elements.append(table)
    else:
        elements.append(Paragraph("Нет данных за указанный период", styles['Normal']))

    # Статистика
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Всего записей: {len(predictions)}",
        ParagraphStyle('Stats', parent=styles['Normal'], fontSize=10)
    ))

    # Футер
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Отчет сгенерирован: {datetime.now().strftime('%d.%m.%Y %H:%M')}",
        ParagraphStyle('Footer', fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))

    doc.build(elements)

    return buffer.getvalue()
