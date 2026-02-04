/**
 * Хуки для работы с API
 * Система прогнозирования лесных пожаров
 */

import { useState, useCallback } from 'react'
import axios from 'axios'
import type {
  WeatherData,
  PredictionResult,
  HistoryResponse,
  ZonesResponse,
  StatisticsResponse,
  UploadResult
} from '@/types'

// Базовый URL API
const API_BASE = '/api'

/**
 * Хук для выполнения прогноза
 */
export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResult | null>(null)

  const predict = useCallback(async (data: WeatherData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post<PredictionResult>(`${API_BASE}/predict`, data)
      setResult(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при выполнении прогноза'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { predict, loading, error, result }
}

/**
 * Хук для получения истории
 */
export function useHistory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<HistoryResponse | null>(null)

  const fetchHistory = useCallback(async (params?: {
    limit?: number
    offset?: number
    location?: string
    start_date?: string
    end_date?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<HistoryResponse>(`${API_BASE}/history`, { params })
      setData(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при получении истории'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchHistory, loading, error, data }
}

/**
 * Хук для получения зон риска
 */
export function useZones() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zones, setZones] = useState<ZonesResponse | null>(null)

  const fetchZones = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<ZonesResponse>(`${API_BASE}/zones`)
      setZones(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при получении зон'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchZones, loading, error, zones }
}

/**
 * Хук для получения статистики
 */
export function useStatistics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatisticsResponse | null>(null)

  const fetchStats = useCallback(async (days: number = 30) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<StatisticsResponse>(`${API_BASE}/statistics`, {
        params: { days }
      })
      setStats(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при получении статистики'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchStats, loading, error, stats }
}

/**
 * Хук для загрузки файлов
 */
export function useFileUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post<UploadResult>(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при загрузке файла'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { uploadFile, loading, error, result }
}

/**
 * Хук для экспорта данных
 */
export function useExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportPdf = useCallback(async (predictionId?: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = predictionId ? { prediction_id: predictionId } : {}
      const response = await axios.get(`${API_BASE}/export/pdf`, {
        params,
        responseType: 'blob'
      })
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fire_forecast_${Date.now()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при экспорте PDF'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const exportCsv = useCallback(async (params?: {
    start_date?: string
    end_date?: string
    location?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE}/export/csv`, {
        params,
        responseType: 'blob'
      })
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fire_forecast_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при экспорте CSV'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { exportPdf, exportCsv, loading, error }
}
