/**
 * Компоненты графиков для визуализации данных
 */

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { HistoricalRecord, Statistics } from '@/types'
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

// Цвета для уровней опасности
const DANGER_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  extreme: '#ef4444'
}

interface TrendChartProps {
  data: HistoricalRecord[]
  title?: string
}

/**
 * График тренда индексов
 */
export function TrendChart({ data, title = 'Динамика индексов' }: TrendChartProps) {
  const chartData = data.slice().reverse().map((item, index) => ({
    name: new Date(item.timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    }),
    nesterov: item.nesterov_index,
    fwi: item.fwi_index,
    composite: item.composite_index || 0
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="nesterov"
                name="Нестеров"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="fwi"
                name="FWI"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="composite"
                name="Комплексный"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * График температуры и влажности
 */
export function WeatherChart({ data, title = 'Метеопараметры' }: TrendChartProps) {
  const chartData = data.slice().reverse().map((item) => ({
    name: new Date(item.timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    }),
    temp: item.temperature,
    humidity: item.humidity
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="temp"
                name="Температура (°C)"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="humidity"
                name="Влажность (%)"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface DangerDistributionChartProps {
  distribution: Record<string, number>
  title?: string
}

/**
 * Круговая диаграмма распределения по уровням опасности
 */
export function DangerDistributionChart({
  distribution,
  title = 'Распределение по уровням опасности'
}: DangerDistributionChartProps) {
  const data = Object.entries(distribution).map(([key, value]) => ({
    name: {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      extreme: 'Чрезвычайный'
    }[key] || key,
    value,
    color: DANGER_COLORS[key as keyof typeof DANGER_COLORS] || '#6b7280'
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatisticsCardsProps {
  stats: Statistics
}

/**
 * Карточки со статистикой
 */
export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const cards = [
    { label: 'Всего прогнозов', value: stats.total, color: 'text-blue-500' },
    { label: 'Ср. температура', value: `${stats.avg_temp?.toFixed(1) || 0}°C`, color: 'text-red-500' },
    { label: 'Ср. влажность', value: `${stats.avg_humidity?.toFixed(1) || 0}%`, color: 'text-cyan-500' },
    { label: 'Ср. индекс Нестерова', value: stats.avg_nesterov?.toFixed(1) || 0, color: 'text-purple-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
