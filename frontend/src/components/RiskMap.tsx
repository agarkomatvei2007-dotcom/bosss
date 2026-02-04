/**
 * Интерактивная карта зон риска
 * Павлодарская область
 */

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DangerBadge } from './DangerIndicator'
import type { RiskZone } from '@/types'
import { getDangerColor, formatDate } from '@/lib/utils'
import { Map as MapIcon, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import 'leaflet/dist/leaflet.css'

// Центр Павлодарской области
const PAVLODAR_CENTER: [number, number] = [52.3, 76.9]
const DEFAULT_ZOOM = 8

interface RiskMapProps {
  zones: RiskZone[]
  loading?: boolean
  onRefresh?: () => void
}

// Компонент для управления масштабом
function MapController({ zones }: { zones: RiskZone[] }) {
  const map = useMap()

  useEffect(() => {
    if (zones.length > 0) {
      const bounds = zones.map(z => [z.latitude, z.longitude] as [number, number])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [zones, map])

  return null
}

// Радиус маркера в зависимости от уровня опасности
function getMarkerRadius(level: string): number {
  const sizes: Record<string, number> = {
    low: 12,
    medium: 15,
    high: 18,
    extreme: 22
  }
  return sizes[level] || 12
}

export function RiskMap({ zones, loading, onRefresh }: RiskMapProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Карта зон риска
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] md:h-[500px] rounded-b-lg overflow-hidden">
          <MapContainer
            center={PAVLODAR_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {zones.length > 0 && <MapController zones={zones} />}

            {zones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={getMarkerRadius(zone.danger_level)}
                pathOptions={{
                  color: getDangerColor(zone.danger_level),
                  fillColor: getDangerColor(zone.danger_level),
                  fillOpacity: 0.6,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-base mb-2">{zone.name}</h3>
                    <div className="mb-2">
                      <DangerBadge level={zone.danger_level} />
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-500">Индекс Нестерова:</span>{' '}
                        <strong>{zone.nesterov_index.toFixed(1)}</strong>
                      </p>
                      <p>
                        <span className="text-gray-500">Индекс FWI:</span>{' '}
                        <strong>{zone.fwi_index.toFixed(1)}</strong>
                      </p>
                      {zone.temperature !== undefined && (
                        <p>
                          <span className="text-gray-500">Температура:</span>{' '}
                          <strong>{zone.temperature}°C</strong>
                        </p>
                      )}
                      {zone.humidity !== undefined && (
                        <p>
                          <span className="text-gray-500">Влажность:</span>{' '}
                          <strong>{zone.humidity}%</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Обновлено: {formatDate(zone.last_updated)}
                      </p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Легенда */}
        <div className="p-4 border-t flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Низкий</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Средний</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Высокий</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Чрезвычайный</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
