"""
Модуль генерации PDF отчетов
Департамент по чрезвычайным ситуациям города Павлодар
"""

import os
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ================= НАСТРОЙКА ШРИФТОВ =================
# Определяем папку, где лежит этот скрипт, и ищем шрифт рядом
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(BASE_DIR, "DejaVuSans.ttf")

try:
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont('RusFont', FONT_PATH))
        FONT_NAME = 'RusFont'
    else:
        # Если шрифта нет, используем стандартный (будут квадраты, но не упадет)
        FONT_NAME = 'Helvetica'
except Exception:
    FONT_NAME = 'Helvetica'
# =====================================================


def get_danger_color(level: str) -> colors.Color:
    """Цвет для уровня опасности"""
    return {
        'low': colors.HexColor('#22c55e'),     # Зеленый
        'medium': colors.HexColor('#eab308'),  # Желтый
        'high': colors.HexColor('#f97316'),    # Оранжевый
        'extreme': colors.HexColor('#ef4444'), # Красный
    }.get(level, colors.grey)


def get_danger_text(level: str) -> str:
    """Текст для уровня опасности"""
    return {
        'low': 'НИЗКИЙ',
        'medium': 'СРЕДНИЙ',
        'high': 'ВЫСОКИЙ',
        'extreme': 'ЧРЕЗВЫЧАЙНЫЙ',
    }.get(level, 'НЕИЗВЕСТНО')


def generate_prediction_report(prediction_data: Dict[str, Any]) -> bytes:
    """Генерация PDF отчета по одному прогнозу"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()

    # Базовые стили с нашим шрифтом
    title_style = ParagraphStyle('CT', parent=styles['Heading1'], fontSize=18, alignment=TA_CENTER, spaceAfter=20, fontName=FONT_NAME)
    subtitle_style = ParagraphStyle('CS', parent=styles['Heading2'], fontSize=14, alignment=TA_CENTER, spaceAfter=10, fontName=FONT_NAME)
    header_style = ParagraphStyle('Hd', parent=styles['Heading3'], fontSize=12, spaceBefore=15, spaceAfter=10, fontName=FONT_NAME)
    normal_style = ParagraphStyle('CN', parent=styles['Normal'], fontSize=10, fontName=FONT_NAME)

    elements = []

    # 1. Заголовок
    elements.extend([
        Paragraph("ДЕПАРТАМЕНТ ПО ЧРЕЗВЫЧАЙНЫМ СИТУАЦИЯМ", title_style),
        Paragraph("города Павлодар", subtitle_style),
        Spacer(1, 10),
        Paragraph("ОТЧЕТ О ПРОГНОЗЕ ПОЖАРНОЙ ОПАСНОСТИ", ParagraphStyle('RT', parent=title_style, fontSize=16)),
    ])

    # 2. Дата
    ts = prediction_data.get('timestamp', datetime.now())
    if isinstance(ts, str):
        try: ts = datetime.fromisoformat(ts)
        except: ts = datetime.now()
    
    elements.append(Paragraph(f"Дата и время: {ts.strftime('%d.%m.%Y %H:%M')}", 
                            ParagraphStyle('DT', parent=normal_style, alignment=TA_CENTER)))
    elements.append(Spacer(1, 20))

    # 3. Блок опасности
    lvl = prediction_data.get('danger_level', 'low')
    d_table = Table([[Paragraph(f"УРОВЕНЬ ОПАСНОСТИ: {get_danger_text(lvl)}", 
                               ParagraphStyle('D', fontSize=16, alignment=TA_CENTER, textColor=colors.white, fontName=FONT_NAME))]], 
                    colWidths=[16*cm])
    d_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), get_danger_color(lvl)),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    elements.extend([d_table, Spacer(1, 20)])

    # 4. Локация
    elements.append(Paragraph("МЕСТОПОЛОЖЕНИЕ", header_style))
    loc_table = Table([
        ['Название точки:', prediction_data.get('location_name', 'Не указано')],
        ['Координаты:', f"{prediction_data.get('latitude', '-')} / {prediction_data.get('longitude', '-')}"]
    ], colWidths=[5*cm, 11*cm])
    loc_table.setStyle(TableStyle([('FONTNAME', (0,0), (-1,-1), FONT_NAME)]))
    elements.extend([loc_table, Spacer(1, 15)])

    # 5. Метеоданные
    elements.append(Paragraph("МЕТЕОРОЛОГИЧЕСКИЕ ДАННЫЕ", header_style))
    inp = prediction_data.get('input_data', prediction_data)
    w_data = [
        ['Параметр', 'Значение', 'Ед. изм.'],
        ['Температура', str(inp.get('temperature', '-')), '°C'],
        ['Влажность', str(inp.get('humidity', '-')), '%'],
        ['Ветер', str(inp.get('wind_speed', '-')), 'м/с'],
        ['Осадки', str(inp.get('precipitation', '-')), 'мм'],
        ['Влажность почвы', str(inp.get('soil_moisture', '-')), '%'],
        ['Растительность', str(inp.get('vegetation_type', '-')), '']
    ]
    w_table = Table(w_data, colWidths=[6*cm, 5*cm, 5*cm])
    w_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,-1), FONT_NAME),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    elements.extend([w_table, Spacer(1, 15)])

    # 6. Индексы
    elements.append(Paragraph("РАСЧЕТНЫЕ ИНДЕКСЫ", header_style))
    i_data = [
        ['Индекс', 'Значение'],
        ['Нестеров', str(prediction_data.get('nesterov_index', '-'))],
        ['FWI', str(prediction_data.get('fwi_index', '-'))],
        ['Комплексный', str(prediction_data.get('composite_index', '-'))],
    ]
    i_table = Table(i_data, colWidths=[8*cm, 8*cm])
    i_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,-1), FONT_NAME),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    elements.extend([i_table, Spacer(1, 15)])

    # 7. Рекомендации
    recs = prediction_data.get('recommendations', [])
    if recs:
        elements.append(Paragraph("РЕКОМЕНДАЦИИ", header_style))
        for r in recs:
            elements.append(Paragraph(f"- {r}", ParagraphStyle('Rec', parent=normal_style, leftIndent=10, spaceAfter=5)))

    # Футер
    elements.extend([
        Spacer(1, 30),
        Paragraph("_"*50, normal_style),
        Paragraph("Подпись ответственного лица", ParagraphStyle('Sign', parent=normal_style, fontSize=8, textColor=colors.grey)),
        Spacer(1, 20),
        Paragraph(f"Сгенерировано: {datetime.now().strftime('%d.%m.%Y %H:%M')}", 
                 ParagraphStyle('F', parent=normal_style, fontSize=8, alignment=TA_CENTER, textColor=colors.grey))
    ])

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_history_report(predictions: List[Dict[str, Any]], period: str = "") -> bytes:
    """Генерация PDF отчета по истории"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('T', parent=styles['Heading1'], fontName=FONT_NAME, alignment=TA_CENTER)
    
    elements = [
        Paragraph("ИСТОРИЯ ПРОГНОЗОВ", title_style),
        Paragraph(period, ParagraphStyle('Sub', parent=styles['Normal'], fontName=FONT_NAME, alignment=TA_CENTER)),
        Spacer(1, 20)
    ]
    
    if predictions:
        data = [['Дата', 'Место', 'Опасность', 'Нест.', 'FWI']]
        for p in predictions[:100]: # Лимит 100 строк
            ts = p.get('timestamp', '')
            if isinstance(ts, str): ts = ts[:16].replace('T', ' ')
            
            data.append([
                str(ts),
                str(p.get('location_name', '-'))[:20],
                get_danger_text(p.get('danger_level', '')),
                str(p.get('nesterov_index', '-')),
                str(p.get('fwi_index', '-'))
            ])
        
        t = Table(data, colWidths=[3.5*cm, 6*cm, 4*cm, 2*cm, 2*cm])
        t.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), FONT_NAME),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        
        # Раскраска строк
        for i, row in enumerate(data[1:], 1):
            lvl_text = row[2] # Колонка опасности
            if lvl_text == 'ЧРЕЗВЫЧАЙНЫЙ': bg = colors.HexColor('#fecaca')
            elif lvl_text == 'ВЫСОКИЙ': bg = colors.HexColor('#fed7aa')
            elif lvl_text == 'СРЕДНИЙ': bg = colors.HexColor('#fef08a')
            else: bg = colors.HexColor('#bbf7d0')
            t.setStyle(TableStyle([('BACKGROUND', (0,i), (-1,i), bg)]))
            
        elements.append(t)
    else:
        elements.append(Paragraph("Нет данных за выбранный период", ParagraphStyle('ND', fontName=FONT_NAME)))
        
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()