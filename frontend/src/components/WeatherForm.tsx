/**
 * Форма ввода метеорологических данных
 * Система прогнозирования лесных пожаров
 */

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { WeatherData, VegetationType, WindDirection } from '@/types'
import { Thermometer, Droplets, Wind, Cloud, MapPin, Trees } from 'lucide-react'

interface WeatherFormProps {
  onSubmit: (data: WeatherData) => void
  loading?: boolean
}

const windDirections: { value: WindDirection; label: string }[] = [
  { value: 'С', label: 'Север (С)' },
  { value: 'СВ', label: 'Северо-Восток (СВ)' },
  { value: 'В', label: 'Восток (В)' },
  { value: 'ЮВ', label: 'Юго-Восток (ЮВ)' },
  { value: 'Ю', label: 'Юг (Ю)' },
  { value: 'ЮЗ', label: 'Юго-Запад (ЮЗ)' },
  { value: 'З', label: 'Запад (З)' },
  { value: 'СЗ', label: 'Северо-Запад (СЗ)' },
]

const vegetationTypes: { value: VegetationType; label: string }[] = [
  { value: 'coniferous', label: 'Хвойный лес' },
  { value: 'deciduous', label: 'Лиственный лес' },
  { value: 'mixed', label: 'Смешанный лес' },
]

const monitoringPoints = [
  { name: 'Павлодар - Центр', lat: 52.2873, lon: 76.9674 },
  { name: 'Баянаул', lat: 50.7933, lon: 75.7003 },
  { name: 'Экибастуз', lat: 51.7231, lon: 75.3239 },
  { name: 'Аксу', lat: 52.0414, lon: 76.9167 },
  { name: 'Лесная зона Север', lat: 52.4500, lon: 76.8500 },
  { name: 'Лесная зона Восток', lat: 52.3000, lon: 77.2000 },
  { name: 'Иртышский район', lat: 52.0000, lon: 76.5000 },
]

export function WeatherForm({ onSubmit, loading }: WeatherFormProps) {
  const [formData, setFormData] = useState<Partial<WeatherData>>({
    temperature: 25,
    humidity: 50,
    wind_speed: 5,
    wind_direction: 'С',
    precipitation: 0,
    soil_moisture: 50,
    vegetation_moisture: 100,
    vegetation_type: 'mixed',
    location_name: 'Павлодар - Центр',
    latitude: 52.2873,
    longitude: 76.9674,
  })

  const handleChange = (field: keyof WeatherData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (locationName: string) => {
    const location = monitoringPoints.find(p => p.name === locationName)
    if (location) {
      setFormData(prev => ({
        ...prev,
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lon
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as WeatherData)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Ввод метеорологических данных
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Локация */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Точка наблюдения
            </Label>
            <Select
              value={formData.location_name}
              onChange={(e) => handleLocationChange(e.target.value)}
              options={monitoringPoints.map(p => ({ value: p.name, label: p.name }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Температура */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                Температура воздуха (°C)
              </Label>
              <Input
                type="number"
                min="-50"
                max="60"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Влажность воздуха */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                Влажность воздуха (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.humidity}
                onChange={(e) => handleChange('humidity', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Скорость ветра */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                Скорость ветра (м/с)
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={formData.wind_speed}
                onChange={(e) => handleChange('wind_speed', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Направление ветра */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                Направление ветра
              </Label>
              <Select
                value={formData.wind_direction}
                onChange={(e) => handleChange('wind_direction', e.target.value)}
                options={windDirections}
              />
            </div>

            {/* Осадки */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-400" />
                Осадки за сутки (мм)
              </Label>
              <Input
                type="number"
                min="0"
                max="500"
                step="0.1"
                value={formData.precipitation}
                onChange={(e) => handleChange('precipitation', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Влажность почвы */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-amber-700" />
                Влажность почвы (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.soil_moisture}
                onChange={(e) => handleChange('soil_moisture', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Влажность растительности */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trees className="h-4 w-4 text-green-600" />
                Влажность растительности (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="200"
                step="1"
                value={formData.vegetation_moisture}
                onChange={(e) => handleChange('vegetation_moisture', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Тип растительности */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trees className="h-4 w-4 text-green-600" />
                Тип растительности
              </Label>
              <Select
                value={formData.vegetation_type}
                onChange={(e) => handleChange('vegetation_type', e.target.value)}
                options={vegetationTypes}
              />
            </div>
          </div>

          {/* Координаты */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Широта</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Долгота</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Расчет...' : 'Рассчитать прогноз'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
