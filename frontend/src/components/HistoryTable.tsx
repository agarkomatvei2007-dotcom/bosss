
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DangerBadge } from './DangerIndicator'
import type { HistoricalRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import { History, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface HistoryTableProps {
  data: HistoricalRecord[]
  loading?: boolean
  onExportCsv?: () => void
  onPageChange?: (offset: number) => void
  currentOffset?: number
  pageSize?: number
  exportLoading?: boolean
}

export function HistoryTable({
  data,
  loading,
  onExportCsv,
  onPageChange,
  currentOffset = 0,
  pageSize = 20,
  exportLoading
}: HistoryTableProps) {
  const hasPrevious = currentOffset > 0
  const hasNext = data.length === pageSize

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            История прогнозов
          </CardTitle>
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={exportLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Экспорт...' : 'CSV'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Дата</th>
                <th className="text-left p-2 font-medium">Локация</th>
                <th className="text-center p-2 font-medium">Темп.</th>
                <th className="text-center p-2 font-medium">Влаж.</th>
                <th className="text-center p-2 font-medium">Ветер</th>
                <th className="text-center p-2 font-medium">Нестеров</th>
                <th className="text-center p-2 font-medium">FWI</th>
                <th className="text-center p-2 font-medium">Уровень</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-[hsl(var(--muted-foreground))]">
                    Загрузка...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-[hsl(var(--muted-foreground))]">
                    Нет данных
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-[hsl(var(--muted))]">
                    <td className="p-2 whitespace-nowrap">
                      {formatDate(record.timestamp)}
                    </td>
                    <td className="p-2">
                      {record.location_name || '—'}
                    </td>
                    <td className="p-2 text-center">
                      {record.temperature}°C
                    </td>
                    <td className="p-2 text-center">
                      {record.humidity}%
                    </td>
                    <td className="p-2 text-center">
                      {record.wind_speed} м/с
                    </td>
                    <td className="p-2 text-center font-mono">
                      {record.nesterov_index.toFixed(1)}
                    </td>
                    <td className="p-2 text-center font-mono">
                      {record.fwi_index.toFixed(1)}
                    </td>
                    <td className="p-2 text-center">
                      <DangerBadge level={record.danger_level} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {onPageChange && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Показано {data.length} записей
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(0, currentOffset - pageSize))}
                disabled={!hasPrevious || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentOffset + pageSize)}
                disabled={!hasNext || loading}
              >
                Вперед
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
