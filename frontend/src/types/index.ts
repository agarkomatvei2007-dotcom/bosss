/**
 * Типы данных для калькулятора распространения лесных пожаров
 * Департамент по чрезвычайным ситуациям города Павлодар
 */

export type WindDirection = 'С' | 'СВ' | 'В' | 'ЮВ' | 'Ю' | 'ЮЗ' | 'З' | 'СЗ'

// Входные данные калькулятора
export interface FireSpreadInput {
  E: number                    // Коэффициент черноты пламени (0-1)
  wind_speed: number           // Скорость ветра (м/с)
  wind_direction: WindDirection // Направление ветра
  rho: number                  // Плотность горючего материала (кг/м³)
  W: number                    // Влажность горючего материала (%)
  t: number                    // Время с начала пожара (часы)
  location_name?: string
  latitude?: number
  longitude?: number
}

// Результат расчета
export interface FireSpreadResult {
  timestamp: string
  input_data: FireSpreadInput

  // Скорости (м/мин)
  v1: number
  v2: number
  v3: number

  // Периметр и площадь
  perimeter: number
  area: number
  area_ha: number

  // Расстояния (м)
  d_front: number
  d_flank: number
  d_rear: number

  // Параметры эллипса для карты
  semi_major: number
  semi_minor: number
  center_offset: number
}

// Лес для мониторинга
export interface Forest {
  name: string
  latitude: number
  longitude: number
  description: string
}
