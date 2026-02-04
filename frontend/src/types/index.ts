/**
 * Типы данных для системы прогнозирования лесных пожаров
 * Департамент по чрезвычайным ситуациям города Павлодар
 */

// Тип растительности
export type VegetationType = 'coniferous' | 'deciduous' | 'mixed'

// Уровень опасности
export type DangerLevel = 'low' | 'medium' | 'high' | 'extreme'

// Направления ветра
export type WindDirection = 'С' | 'СВ' | 'В' | 'ЮВ' | 'Ю' | 'ЮЗ' | 'З' | 'СЗ'

// Входные данные о погоде
export interface WeatherData {
  wind_speed: number
  wind_direction: WindDirection
  temperature: number
  humidity: number
  soil_moisture: number
  vegetation_moisture: number
  precipitation: number
  vegetation_type: VegetationType
  location_name?: string
  latitude?: number
  longitude?: number
}

// Результат прогноза
export interface PredictionResult {
  id: number
  timestamp: string
  input_data: WeatherData
  nesterov_index: number
  fwi_index: number
  composite_index: number
  danger_level: DangerLevel
  danger_level_text: string
  danger_level_color: string
  recommendations: string[]
}

// Историческая запись
export interface HistoricalRecord {
  id: number
  timestamp: string
  location_name?: string
  latitude?: number
  longitude?: number
  temperature: number
  humidity: number
  wind_speed: number
  wind_direction?: string
  precipitation: number
  soil_moisture?: number
  vegetation_moisture?: number
  vegetation_type?: string
  nesterov_index: number
  fwi_index: number
  composite_index?: number
  danger_level: DangerLevel
  danger_level_text: string
}

// Зона риска для карты
export interface RiskZone {
  id: number
  name: string
  latitude: number
  longitude: number
  danger_level: DangerLevel
  danger_level_text: string
  nesterov_index: number
  fwi_index: number
  composite_index: number
  temperature?: number
  humidity?: number
  last_updated: string
}

// Статистика
export interface Statistics {
  total: number
  avg_temp: number
  avg_humidity: number
  avg_nesterov: number
  avg_fwi: number
  avg_composite: number
  danger_distribution: Record<string, number>
}

// Ответ API с историей
export interface HistoryResponse {
  status: string
  data: HistoricalRecord[]
  count: number
}

// Ответ API с зонами
export interface ZonesResponse {
  status: string
  zones: RiskZone[]
}

// Ответ API со статистикой
export interface StatisticsResponse {
  status: string
  data: Statistics
}

// Результат загрузки файла
export interface UploadResult {
  status: string
  message: string
  results: {
    id: number
    location_name?: string
    nesterov_index: number
    fwi_index: number
    composite_index: number
    danger_level: string
    danger_level_text: string
  }[]
}
