/**
 * Карта с отображением масштаба распространения пожара
 * Клик по карте — поставить точку возгорания и рассчитать
 */

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { FireSpreadResult, FireSpreadInput, WindDirection } from '@/types'
import { Map as MapIcon, Wind, Ruler, TriangleAlert, MapPin, X, MousePointerClick } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Фикс иконки маркера leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Кастомная иконка пожара (SVG)
const fireIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle,#ef4444 0%,#dc2626 60%,transparent 100%);animation:pulse 2s ease-in-out infinite;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

// Иконка для кликнутой точки
const clickedIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(59,130,246,0.2);border:3px solid #3b82f6;">
    <div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;"></div>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Центр между Баянаулом и Щербакты
const MAP_CENTER: [number, number] = [51.5, 76.8]
const DEFAULT_ZOOM = 7

// Направление ветра → угол (куда распространяется пожар)
const windDirectionAngle: Record<string, number> = {
  'С': 180, 'СВ': 225, 'В': 270, 'ЮВ': 315,
  'Ю': 0, 'ЮЗ': 45, 'З': 90, 'СЗ': 135,
}

const windDirectionLabels: Record<string, string> = {
  'С': 'Север', 'СВ': 'Северо-Восток', 'В': 'Восток', 'ЮВ': 'Юго-Восток',
  'Ю': 'Юг', 'ЮЗ': 'Юго-Запад', 'З': 'Запад', 'СЗ': 'Северо-Запад',
}

const windDirectionOptions = [
  { value: 'С', label: 'Север (С)' },
  { value: 'СВ', label: 'Северо-Восток (СВ)' },
  { value: 'В', label: 'Восток (В)' },
  { value: 'ЮВ', label: 'Юго-Восток (ЮВ)' },
  { value: 'Ю', label: 'Юг (Ю)' },
  { value: 'ЮЗ', label: 'Юго-Запад (ЮЗ)' },
  { value: 'З', label: 'Запад (З)' },
  { value: 'СЗ', label: 'Северо-Запад (СЗ)' },
]

interface RiskMapProps {
  result: FireSpreadResult | null
  onCalculate?: (data: FireSpreadInput) => void
  loading?: boolean
}

// Генерация точек эллипса с учётом направления ветра
function generateEllipsePoints(
  lat: number, lon: number,
  semiMajor: number, semiMinor: number,
  centerOffset: number, windDir: string,
  numPoints: number = 64
): [number, number][] {
  const angle = (windDirectionAngle[windDir] ?? 0) * Math.PI / 180
  const points: [number, number][] = []

  const offsetLat = centerOffset * Math.cos(angle) / 111320
  const offsetLon = centerOffset * Math.sin(angle) / (111320 * Math.cos(lat * Math.PI / 180))
  const centerLat = lat + offsetLat
  const centerLon = lon + offsetLon

  for (let i = 0; i <= numPoints; i++) {
    const t = (2 * Math.PI * i) / numPoints
    const x = semiMajor * Math.cos(t)
    const y = semiMinor * Math.sin(t)
    const rotX = x * Math.cos(angle) - y * Math.sin(angle)
    const rotY = x * Math.sin(angle) + y * Math.cos(angle)
    const dLat = rotX / 111320
    const dLon = rotY / (111320 * Math.cos(centerLat * Math.PI / 180))
    points.push([centerLat + dLat, centerLon + dLon])
  }
  return points
}

function offsetPoint(lat: number, lon: number, distMeters: number, angleDeg: number): [number, number] {
  const angleRad = angleDeg * Math.PI / 180
  const dLat = distMeters * Math.cos(angleRad) / 111320
  const dLon = distMeters * Math.sin(angleRad) / (111320 * Math.cos(lat * Math.PI / 180))
  return [lat + dLat, lon + dLon]
}

// Автозум к эллипсу
function MapController({ result }: { result: FireSpreadResult | null }) {
  const map = useMap()

  useEffect(() => {
    if (result?.input_data.latitude && result?.input_data.longitude) {
      const lat = result.input_data.latitude
      const lon = result.input_data.longitude
      if (result.semi_major > 0) {
        const ellipsePoints = generateEllipsePoints(
          lat, lon, result.semi_major, result.semi_minor,
          result.center_offset, result.input_data.wind_direction
        )
        const bounds = L.latLngBounds(ellipsePoints.map(p => L.latLng(p[0], p[1])))
        map.fitBounds(bounds, { padding: [80, 80] })
      } else {
        map.setView([lat, lon], 12)
      }
    }
  }, [result, map])

  return null
}

// Обработчик кликов по карте
function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Стрелка направления ветра
function WindArrow({ lat, lon, windDir, distance }: { lat: number; lon: number; windDir: string; distance: number }) {
  const angleDeg = windDirectionAngle[windDir] ?? 0
  const arrowLen = distance * 1.3
  const endPoint = offsetPoint(lat, lon, arrowLen, angleDeg)
  const arrowHeadLen = arrowLen * 0.12
  const leftPoint = offsetPoint(endPoint[0], endPoint[1], arrowHeadLen, angleDeg + 150)
  const rightPoint = offsetPoint(endPoint[0], endPoint[1], arrowHeadLen, angleDeg - 150)

  return (
    <>
      <Polyline
        positions={[[lat, lon], endPoint]}
        pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '8, 6', opacity: 0.7 }}
      />
      <Polyline
        positions={[leftPoint, endPoint, rightPoint]}
        pathOptions={{ color: '#3b82f6', weight: 2.5, opacity: 0.8 }}
      />
    </>
  )
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + ' км'
  return meters.toFixed(0) + ' м'
}

function formatArea(areaSqm: number, areaHa: number): string {
  if (areaHa >= 1) return areaHa.toFixed(2) + ' га'
  return areaSqm.toFixed(0) + ' м²'
}

function getDangerLevel(areaHa: number): { label: string; color: string; bg: string } {
  if (areaHa >= 10) return { label: 'Критический', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950' }
  if (areaHa >= 1) return { label: 'Высокий', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950' }
  if (areaHa >= 0.1) return { label: 'Средний', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' }
  return { label: 'Низкий', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' }
}

// Мини-форма для расчёта прямо с карты
function QuickCalcForm({ lat, lon, onSubmit, onClose, loading }: {
  lat: number
  lon: number
  onSubmit: (data: FireSpreadInput) => void
  onClose: () => void
  loading?: boolean
}) {
  const [params, setParams] = useState({
    E: 0.7,
    wind_speed: 3,
    wind_direction: 'С' as WindDirection,
    rho: 40,
    W: 25,
    t: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...params,
      latitude: lat,
      longitude: lon,
      location_name: `Точка (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    })
  }

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg border w-[300px] max-h-[calc(100%-24px)] overflow-y-auto">
      <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 p-3 pb-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="font-bold text-sm">Расчёт в точке</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
        <div className="text-xs text-[hsl(var(--muted-foreground))] bg-blue-50 dark:bg-blue-950 rounded px-2 py-1.5 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
          {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Черн. пламени (E)</Label>
            <Input type="number" min="0" max="1" step="0.01" value={params.E}
              onChange={e => setParams(p => ({ ...p, E: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-xs" required />
          </div>
          <div>
            <Label className="text-xs">Ветер (м/с)</Label>
            <Input type="number" min="0" max="50" step="0.1" value={params.wind_speed}
              onChange={e => setParams(p => ({ ...p, wind_speed: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-xs" required />
          </div>
        </div>

        <div>
          <Label className="text-xs">Направление ветра</Label>
          <Select value={params.wind_direction} options={windDirectionOptions}
            onChange={e => setParams(p => ({ ...p, wind_direction: e.target.value as WindDirection }))}
            className="h-8 text-xs" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Плотность (кг/м³)</Label>
            <Input type="number" min="1" max="1000" step="1" value={params.rho}
              onChange={e => setParams(p => ({ ...p, rho: parseFloat(e.target.value) || 1 }))}
              className="h-8 text-xs" required />
          </div>
          <div>
            <Label className="text-xs">Влажность (%)</Label>
            <Input type="number" min="0" max="200" step="1" value={params.W}
              onChange={e => setParams(p => ({ ...p, W: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-xs" required />
          </div>
        </div>

        <div>
          <Label className="text-xs">Время с начала пожара (ч)</Label>
          <Input type="number" min="0.1" max="72" step="0.1" value={params.t}
            onChange={e => setParams(p => ({ ...p, t: parseFloat(e.target.value) || 0.1 }))}
            className="h-8 text-xs" required />
        </div>

        <Button type="submit" className="w-full h-8 text-xs" disabled={loading}>
          {loading ? 'Расчёт...' : 'Рассчитать пожар'}
        </Button>
      </form>
    </div>
  )
}

export function RiskMap({ result, onCalculate, loading }: RiskMapProps) {
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null)

  const hasResult = result?.input_data.latitude && result?.input_data.longitude && result.semi_major > 0

  const handleMapClick = (lat: number, lon: number) => {
    setClickedPoint([lat, lon])
  }

  const handleQuickCalc = (data: FireSpreadInput) => {
    onCalculate?.(data)
    setClickedPoint(null)
  }

  // Эллипс основной зоны пожара
  const ellipsePoints = hasResult
    ? generateEllipsePoints(
        result.input_data.latitude!, result.input_data.longitude!,
        result.semi_major, result.semi_minor,
        result.center_offset, result.input_data.wind_direction
      )
    : null

  // Внутренняя зона — эпицентр (50%)
  const innerEllipsePoints = hasResult
    ? generateEllipsePoints(
        result.input_data.latitude!, result.input_data.longitude!,
        result.semi_major * 0.5, result.semi_minor * 0.5,
        result.center_offset * 0.5, result.input_data.wind_direction
      )
    : null

  // Зона угрозы (+30%)
  const outerEllipsePoints = hasResult
    ? generateEllipsePoints(
        result.input_data.latitude!, result.input_data.longitude!,
        result.semi_major * 1.3, result.semi_minor * 1.3,
        result.center_offset * 1.3, result.input_data.wind_direction
      )
    : null

  const danger = result ? getDangerLevel(result.area_ha) : null

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Карта распространения пожара
          </CardTitle>
          <div className="flex items-center gap-2">
            {result && danger && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${danger.bg} ${danger.color}`}>
                {danger.label}
              </span>
            )}
          </div>
        </div>
        {onCalculate && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-1">
            <MousePointerClick className="h-3 w-3" />
            Кликните по карте, чтобы поставить точку возгорания и рассчитать масштаб пожара
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-[500px] md:h-[600px] overflow-hidden">
            <MapContainer
              center={MAP_CENTER}
              zoom={DEFAULT_ZOOM}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController result={result} />
              {onCalculate && <MapClickHandler onClick={handleMapClick} />}

              {/* Маркеры лесов */}
              <Marker position={[50.7933, 75.7003]}>
                <Popup>
                  <strong>Баянаульский лес</strong>
                  <br />Баянаульский национальный парк
                </Popup>
              </Marker>
              <Marker position={[52.3800, 78.0100]}>
                <Popup>
                  <strong>Щербактинский лес</strong>
                  <br />Щербактинский лесной массив
                </Popup>
              </Marker>

              {/* Кликнутая точка */}
              {clickedPoint && (
                <Marker position={clickedPoint} icon={clickedIcon}>
                  <Popup>
                    <span className="text-xs">
                      {clickedPoint[0].toFixed(4)}°N, {clickedPoint[1].toFixed(4)}°E
                    </span>
                  </Popup>
                </Marker>
              )}

              {/* --- Визуализация пожара --- */}
              {hasResult && (
                <>
                  {outerEllipsePoints && (
                    <Polygon
                      positions={outerEllipsePoints}
                      pathOptions={{
                        color: '#f59e0b', fillColor: '#fbbf24',
                        fillOpacity: 0.08, weight: 1, dashArray: '4, 8',
                      }}
                    />
                  )}

                  {ellipsePoints && (
                    <Polygon
                      positions={ellipsePoints}
                      pathOptions={{
                        color: '#ef4444', fillColor: '#ef4444',
                        fillOpacity: 0.15, weight: 2, dashArray: '6, 4',
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px] text-sm">
                          <strong className="text-red-600">Зона пожара</strong>
                          <br />
                          Площадь: <b>{formatArea(result!.area, result!.area_ha)}</b>
                          <br />
                          Периметр: <b>{formatDistance(result!.perimeter)}</b>
                          <br />
                          Время: <b>{result!.input_data.t} ч</b>
                        </div>
                      </Popup>
                    </Polygon>
                  )}

                  {innerEllipsePoints && (
                    <Polygon
                      positions={innerEllipsePoints}
                      pathOptions={{
                        color: '#dc2626', fillColor: '#dc2626',
                        fillOpacity: 0.3, weight: 1.5,
                      }}
                    >
                      <Popup>
                        <strong className="text-red-700">Эпицентр пожара</strong>
                        <br />
                        <span className="text-xs">Зона максимальной интенсивности горения</span>
                      </Popup>
                    </Polygon>
                  )}

                  <Marker
                    position={[result!.input_data.latitude!, result!.input_data.longitude!]}
                    icon={fireIcon}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <strong className="text-red-600">{result!.input_data.location_name || 'Точка возгорания'}</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          {result!.input_data.latitude!.toFixed(4)}°N, {result!.input_data.longitude!.toFixed(4)}°E
                        </span>
                        <hr className="my-1" />
                        <div className="text-xs space-y-0.5">
                          <div>Фронт: <b className="text-red-600">{result!.v1.toFixed(2)} м/мин</b> ({formatDistance(result!.d_front)})</div>
                          <div>Фланг: <b className="text-orange-600">{result!.v2.toFixed(2)} м/мин</b> ({formatDistance(result!.d_flank)})</div>
                          <div>Тыл: <b className="text-yellow-600">{result!.v3.toFixed(2)} м/мин</b> ({formatDistance(result!.d_rear)})</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  <Circle
                    center={[result!.input_data.latitude!, result!.input_data.longitude!]}
                    radius={Math.max(result!.d_front, result!.d_flank) * 0.05}
                    pathOptions={{
                      color: '#dc2626', fillColor: '#ef4444',
                      fillOpacity: 0.6, weight: 0,
                    }}
                  />

                  <WindArrow
                    lat={result!.input_data.latitude!}
                    lon={result!.input_data.longitude!}
                    windDir={result!.input_data.wind_direction}
                    distance={result!.d_front}
                  />
                </>
              )}
            </MapContainer>
          </div>

          {/* Мини-форма расчёта при клике */}
          {clickedPoint && onCalculate && (
            <QuickCalcForm
              lat={clickedPoint[0]}
              lon={clickedPoint[1]}
              onSubmit={handleQuickCalc}
              onClose={() => setClickedPoint(null)}
              loading={loading}
            />
          )}

          {/* Оверлей: нет данных и нет клика */}
          {!hasResult && !clickedPoint && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] z-[1000] pointer-events-none">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 text-center max-w-xs pointer-events-auto border">
                <MousePointerClick className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <p className="font-semibold text-sm">Кликните по карте</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Поставьте точку в любом месте карты, заполните параметры и рассчитайте масштаб пожара
                </p>
              </div>
            </div>
          )}

          {/* Инфо-панель с масштабом */}
          {hasResult && result && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 max-w-[220px] text-xs">
              <div className="font-bold text-sm mb-2 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Масштаб пожара
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Площадь:</span>
                  <span className="font-bold">{formatArea(result.area, result.area_ha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Периметр:</span>
                  <span className="font-bold">{formatDistance(result.perimeter)}</span>
                </div>

                <hr className="border-[hsl(var(--border))]" />

                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">По фронту:</span>
                  <span className="font-bold text-red-600">{formatDistance(result.d_front)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">По флангу:</span>
                  <span className="font-bold text-orange-600">{formatDistance(result.d_flank)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">По тылу:</span>
                  <span className="font-bold text-yellow-600">{formatDistance(result.d_rear)}</span>
                </div>

                <hr className="border-[hsl(var(--border))]" />

                <div className="flex items-center gap-1.5">
                  <Wind className="h-3 w-3 text-blue-500" />
                  <span className="text-[hsl(var(--muted-foreground))]">Ветер:</span>
                  <span className="font-bold">
                    {windDirectionLabels[result.input_data.wind_direction] || result.input_data.wind_direction}, {result.input_data.wind_speed} м/с
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <TriangleAlert className={`h-3 w-3 ${danger!.color}`} />
                  <span className="text-[hsl(var(--muted-foreground))]">Уровень:</span>
                  <span className={`font-bold ${danger!.color}`}>{danger!.label}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Легенда */}
        <div className="p-3 border-t flex flex-wrap gap-x-5 gap-y-2 justify-center text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-red-600 opacity-30 border border-red-600"></div>
            <span>Эпицентр</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-red-500 opacity-20 border border-red-500 border-dashed"></div>
            <span>Зона пожара</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-amber-400 opacity-15 border border-amber-500 border-dashed"></div>
            <span>Зона угрозы</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500 border-dashed"></div>
            <span>Направление ветра</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle, #ef4444, transparent)' }}></div>
            <span>Точка возгорания</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '2px solid #3b82f6' }}></div>
            <span>Выбранная точка</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
