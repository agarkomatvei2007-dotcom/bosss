/**
 * Форма калькулятора распространения лесного пожара
 */

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { FireSpreadInput, WindDirection } from '@/types'
import { Flame, Wind, MapPin, Clock, Droplets } from 'lucide-react'

interface FireSpreadFormProps {
  onSubmit: (data: FireSpreadInput) => void
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

const forests = [
  { name: 'Баянаульский лес', lat: 50.7933, lon: 75.7003 },
  { name: 'Щербактинский лес', lat: 52.3800, lon: 78.0100 },
]

export function WeatherForm({ onSubmit, loading }: FireSpreadFormProps) {
  const [formData, setFormData] = useState<Partial<FireSpreadInput>>({
    E: 0.7,
    wind_speed: 3,
    wind_direction: 'С',
    rho: 40,
    W: 25,
    t: 1,
    location_name: 'Баянаульский лес',
    latitude: 50.7933,
    longitude: 75.7003,
  })

  const handleChange = (field: keyof FireSpreadInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (locationName: string) => {
    const forest = forests.find(f => f.name === locationName)
    if (forest) {
      setFormData(prev => ({
        ...prev,
        location_name: forest.name,
        latitude: forest.lat,
        longitude: forest.lon,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as FireSpreadInput)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Калькулятор распространения пожара
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Локация */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Лесной массив
            </Label>
            <Select
              value={formData.location_name}
              onChange={(e) => handleLocationChange(e.target.value)}
              options={forests.map(f => ({ value: f.name, label: f.name }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E - коэффициент черноты пламени */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Коэфф. черноты пламени (E)
              </Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.E}
                onChange={(e) => handleChange('E', parseFloat(e.target.value))}
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">от 0 до 1</p>
            </div>

            {/* Скорость ветра */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-500" />
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
              <p className="text-xs text-[hsl(var(--muted-foreground))]">на высоте 2 м под пологом леса</p>
            </div>

            {/* Направление ветра */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-500" />
                Направление ветра
              </Label>
              <Select
                value={formData.wind_direction}
                onChange={(e) => handleChange('wind_direction', e.target.value)}
                options={windDirections}
              />
            </div>

            {/* Плотность горючего материала */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                {`Плотность горючего (кг/м\u00B3)`}
              </Label>
              <Input
                type="number"
                min="1"
                max="1000"
                step="1"
                value={formData.rho}
                onChange={(e) => handleChange('rho', parseFloat(e.target.value))}
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{`\u03C1 \u2014 плотность сложения`}</p>
            </div>

            {/* Влажность горючего материала */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />
                Влажность горючего (W, %)
              </Label>
              <Input
                type="number"
                min="0"
                max="200"
                step="1"
                value={formData.W}
                onChange={(e) => handleChange('W', parseFloat(e.target.value))}
                required
              />
            </div>

            {/* Время */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Время с начала пожара (ч)
              </Label>
              <Input
                type="number"
                min="0.1"
                max="72"
                step="0.1"
                value={formData.t}
                onChange={(e) => handleChange('t', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Координаты (только для отображения) */}
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
            {loading ? 'Расчет...' : 'Рассчитать распространение'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
