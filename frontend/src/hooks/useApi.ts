/**
 * Хуки для работы с API
 * Калькулятор распространения лесных пожаров
 */

import { useState, useCallback } from 'react'
import axios from 'axios'
import type { FireSpreadInput, FireSpreadResult } from '@/types'

const API_BASE = '/api'

export function useFireSpread() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FireSpreadResult | null>(null)

  const calculate = useCallback(async (data: FireSpreadInput) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post<FireSpreadResult>(`${API_BASE}/calculate`, data)
      setResult(response.data)
      return response.data
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Ошибка расчета'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { calculate, loading, error, result }
}
