import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Утилита для объединения классов Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирование даты на русском языке
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Получение цвета по уровню опасности
 */
export function getDangerColor(level: string): string {
  const colors: Record<string, string> = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    extreme: '#ef4444'
  }
  return colors[level] || '#6b7280'
}

/**
 * Получение текста уровня опасности на русском
 */
export function getDangerText(level: string): string {
  const texts: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    extreme: 'Чрезвычайный'
  }
  return texts[level] || 'Неизвестно'
}

/**
 * Получение CSS класса градиента по уровню опасности
 */
export function getDangerGradient(level: string): string {
  const gradients: Record<string, string> = {
    low: 'gradient-low',
    medium: 'gradient-medium',
    high: 'gradient-high',
    extreme: 'gradient-extreme'
  }
  return gradients[level] || ''
}

/**
 * Конвертация типа растительности на русский
 */
export function getVegetationText(type: string): string {
  const texts: Record<string, string> = {
    coniferous: 'Хвойный',
    deciduous: 'Лиственный',
    mixed: 'Смешанный'
  }
  return texts[type] || type
}

/**
 * Конвертация направления ветра на русский
 */
export function getWindDirectionText(direction: string): string {
  const texts: Record<string, string> = {
    'N': 'С', 'NE': 'СВ', 'E': 'В', 'SE': 'ЮВ',
    'S': 'Ю', 'SW': 'ЮЗ', 'W': 'З', 'NW': 'СЗ',
    'С': 'С', 'СВ': 'СВ', 'В': 'В', 'ЮВ': 'ЮВ',
    'Ю': 'Ю', 'ЮЗ': 'ЮЗ', 'З': 'З', 'СЗ': 'СЗ'
  }
  return texts[direction] || direction
}
