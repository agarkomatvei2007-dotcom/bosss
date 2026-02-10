/**
 * Компонент отображения результатов расчета распространения пожара
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { FireSpreadResult } from '@/types'
import {
  Flame,
  Wind,
  ArrowRight,
  ArrowLeftRight,
  ArrowLeft,
  Ruler,
  Square
} from 'lucide-react'

interface ResultProps {
  result: FireSpreadResult
}

const windDirectionLabels: Record<string, string> = {
  'С': 'Север',
  'СВ': 'Северо-Восток',
  'В': 'Восток',
  'ЮВ': 'Юго-Восток',
  'Ю': 'Юг',
  'ЮЗ': 'Юго-Запад',
  'З': 'Запад',
  'СЗ': 'Северо-Запад',
}

export function PredictionResultView({ result }: ResultProps) {
  const { input_data } = result

  return (
    <div className="space-y-4">
      {/* Скорости распространения */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Скорости распространения огня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <ArrowRight className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{result.v1.toFixed(2)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">v₁ — фронт (м/мин)</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <ArrowLeftRight className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold text-orange-600">{result.v2.toFixed(2)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">v₂ — фланг (м/мин)</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <ArrowLeft className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{result.v3.toFixed(2)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">v₃ — тыл (м/мин)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Периметр и площадь */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Параметры пожара за {input_data.t} ч
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-2xl font-bold">{result.perimeter.toFixed(1)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Периметр кромки (м)</p>
            </div>
            <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-2xl font-bold">
                {result.area_ha >= 1 ? result.area_ha.toFixed(2) + ' га' : result.area.toFixed(1) + ' м²'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Площадь пожара</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Расстояния */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Square className="h-5 w-5" />
            Расстояния от точки возгорания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 rounded bg-[hsl(var(--muted))]">
              <span>По фронту (по ветру)</span>
              <span className="font-bold text-red-600">{result.d_front.toFixed(1)} м</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-[hsl(var(--muted))]">
              <span>По флангу (перпендикулярно)</span>
              <span className="font-bold text-orange-600">{result.d_flank.toFixed(1)} м</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-[hsl(var(--muted))]">
              <span>По тылу (против ветра)</span>
              <span className="font-bold text-yellow-600">{result.d_rear.toFixed(1)} м</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Входные параметры */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Входные параметры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>E (черн. пламени):</span>
              <span className="font-medium">{input_data.E}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-blue-500" />
              <span>Ветер:</span>
              <span className="font-medium">
                {input_data.wind_speed} м/с, {windDirectionLabels[input_data.wind_direction] || input_data.wind_direction}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{`\u03C1 (плотность):`}</span>
              <span className="font-medium">{`${input_data.rho} кг/м\u00B3`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>W (влажность):</span>
              <span className="font-medium">{input_data.W}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Локация:</span>
              <span className="font-medium">{input_data.location_name || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Время:</span>
              <span className="font-medium">{input_data.t} ч</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Формулы */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Используемые формулы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 font-mono">
            <p>{`v\u2081 = 26\u00B7E\u00B7(1+2.7\u00B7v)\u00B7(2+W) / (\u03C1\u00B7(16+W))`}</p>
            <p>{`v\u2082 = 0.35\u00B7v\u2081 + 0.17`}</p>
            <p>{`v\u2083 = 0.10\u00B7v\u2081 + 0.20`}</p>
            <p>{`P = 2\u00B7\u03C0\u00B7\u221A(((v\u2081+v\u2083)\u00B2 + v\u2082\u00B2) / 8) \u00B7 t`}</p>
            <p>{`S = 4\u00B710\u207B\u2076\u00B7P\u00B2`}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
