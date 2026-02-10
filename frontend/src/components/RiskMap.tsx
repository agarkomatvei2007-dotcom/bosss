/**
 * Карта с отображением эллипса распространения пожара
 * Баянаул и Щербакты
 */

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { FireSpreadResult } from '@/types'
import { Map as MapIcon } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Фикс иконки маркера leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Центр между Баянаулом и Щербакты
const MAP_CENTER: [number, number] = [51.5, 76.8]
const DEFAULT_ZOOM = 7

// Направление ветра → угол в градусах (куда дует)
const windDirectionAngle: Record<string, number> = {
  'С': 180,   // ветер с севера → пожар идет на юг
  'СВ': 225,
  'В': 270,
  'ЮВ': 315,
  'Ю': 0,
  'ЮЗ': 45,
  'З': 90,
  'СЗ': 135,
}

interface RiskMapProps {
  result: FireSpreadResult | null
}

// Генерация точек эллипса с учетом направления ветра
function generateEllipsePoints(
  lat: number,
  lon: number,
  semiMajor: number,  // м
  semiMinor: number,  // м
  centerOffset: number, // м — смещение центра вдоль ветра
  windDir: string,
  numPoints: number = 64
): [number, number][] {
  const angle = (windDirectionAngle[windDir] ?? 0) * Math.PI / 180
  const points: [number, number][] = []

  // Смещение центра эллипса от точки возгорания (вдоль направления ветра)
  const offsetLat = centerOffset * Math.cos(angle) / 111320
  const offsetLon = centerOffset * Math.sin(angle) / (111320 * Math.cos(lat * Math.PI / 180))

  const centerLat = lat + offsetLat
  const centerLon = lon + offsetLon

  for (let i = 0; i <= numPoints; i++) {
    const t = (2 * Math.PI * i) / numPoints

    // Точка эллипса без поворота
    const x = semiMajor * Math.cos(t)
    const y = semiMinor * Math.sin(t)

    // Поворот на угол ветра
    const rotX = x * Math.cos(angle) - y * Math.sin(angle)
    const rotY = x * Math.sin(angle) + y * Math.cos(angle)

    // Перевод метров в градусы
    const dLat = rotX / 111320
    const dLon = rotY / (111320 * Math.cos(centerLat * Math.PI / 180))

    points.push([centerLat + dLat, centerLon + dLon])
  }

  return points
}

// Автозум
function MapController({ result }: { result: FireSpreadResult | null }) {
  const map = useMap()

  useEffect(() => {
    if (result?.input_data.latitude && result?.input_data.longitude) {
      const lat = result.input_data.latitude
      const lon = result.input_data.longitude

      if (result.semi_major > 0) {
        const ellipsePoints = generateEllipsePoints(
          lat, lon,
          result.semi_major, result.semi_minor,
          result.center_offset,
          result.input_data.wind_direction
        )
        const bounds = L.latLngBounds(ellipsePoints.map(p => L.latLng(p[0], p[1])))
        map.fitBounds(bounds, { padding: [60, 60] })
      } else {
        map.setView([lat, lon], 12)
      }
    }
  }, [result, map])

  return null
}

export function RiskMap({ result }: RiskMapProps) {
  const ellipsePoints = result?.input_data.latitude && result?.input_data.longitude && result.semi_major > 0
    ? generateEllipsePoints(
        result.input_data.latitude,
        result.input_data.longitude,
        result.semi_major,
        result.semi_minor,
        result.center_offset,
        result.input_data.wind_direction
      )
    : null

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5" />
          Карта распространения пожара
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] md:h-[600px] rounded-b-lg overflow-hidden">
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

            {/* Точка возгорания */}
            {result?.input_data.latitude && result?.input_data.longitude && (
              <Marker position={[result.input_data.latitude, result.input_data.longitude]}>
                <Popup>
                  <div className="min-w-[180px]">
                    <strong>{result.input_data.location_name || 'Точка возгорания'}</strong>
                    <br />
                    <span className="text-xs">
                      v₁={result.v1.toFixed(2)} м/мин | v₂={result.v2.toFixed(2)} | v₃={result.v3.toFixed(2)}
                    </span>
                    <br />
                    <span className="text-xs">
                      P={result.perimeter.toFixed(0)} м | S={result.area_ha >= 1 ? result.area_ha.toFixed(2) + ' га' : result.area.toFixed(0) + ' м²'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Эллипс пожара */}
            {ellipsePoints && (
              <Polygon
                positions={ellipsePoints}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Легенда */}
        <div className="p-4 border-t flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 opacity-40 border-2 border-red-500 border-dashed"></div>
            <span>Зона распространения пожара</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4">
              <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png" className="h-4" alt="" />
            </div>
            <span>Лесные массивы / Точка возгорания</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
