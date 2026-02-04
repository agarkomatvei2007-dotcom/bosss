/**
 * Компонент отображения результатов прогноза
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DangerIndicator } from './DangerIndicator'
import type { PredictionResult as PredictionResultType } from '@/types'
import { formatDate, getVegetationText, getWindDirectionText } from '@/lib/utils'
import {
  FileText,
  Download,
  AlertCircle,
  Gauge,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react'

interface PredictionResultProps {
  result: PredictionResultType
  onExportPdf?: () => void
  exportLoading?: boolean
}

export function PredictionResultView({
  result,
  onExportPdf,
  exportLoading
}: PredictionResultProps) {
  const { input_data } = result

  return (
    <div className="space-y-4">
      {/* Карточка уровня опасности */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Уровень пожарной опасности</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerIndicator
            level={result.danger_level}
            index={result.composite_index}
            size="lg"
            className="w-full justify-center"
          />
          <p className="text-sm text-center mt-2 text-[hsl(var(--muted-foreground))]">
            {input_data.location_name || 'Точка наблюдения'} • {formatDate(result.timestamp)}
          </p>
        </CardContent>
      </Card>

      {/* Расчетные индексы */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Расчетные индексы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-2xl font-bold">{result.nesterov_index.toFixed(1)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Индекс Нестерова</p>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-2xl font-bold">{result.fwi_index.toFixed(1)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Индекс FWI</p>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-2xl font-bold">{result.composite_index.toFixed(1)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Комплексный</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Входные данные */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Метеоданные</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <span>Температура:</span>
              <span className="font-medium">{input_data.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>Влажность:</span>
              <span className="font-medium">{input_data.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <span>Ветер:</span>
              <span className="font-medium">
                {input_data.wind_speed} м/с, {getWindDirectionText(input_data.wind_direction)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span>Осадки:</span>
              <span className="font-medium">{input_data.precipitation} мм</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Влажность почвы:</span>
              <span className="font-medium">{input_data.soil_moisture}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Растительность:</span>
              <span className="font-medium">{getVegetationText(input_data.vegetation_type)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-[hsl(var(--primary))]">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Кнопка экспорта */}
      {onExportPdf && (
        <Button
          onClick={onExportPdf}
          disabled={exportLoading}
          variant="outline"
          className="w-full"
        >
          {exportLoading ? (
            'Генерация PDF...'
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Экспорт в PDF
            </>
          )}
        </Button>
      )}
    </div>
  )
}
