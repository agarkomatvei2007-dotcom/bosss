import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Wind,
  MapPin,
  X,
  Flame,
  Calendar,
  Droplets,
  Thermometer,
  Trees,
  Clock,
  ArrowRight,
  ExternalLink,
  Globe,
  Search,
  Crosshair,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

// --- ИКОНКИ ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const fireIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,#ef4444 0%,#b91c1c 70%);box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); animation:pulse 2s infinite;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const clickedIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,0.2);border:3px solid #2563eb;box-shadow: 0 0 10px rgba(37,99,235,0.4);"><div style="width:10px;height:10px;border-radius:50%;background:#2563eb;"></div></div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// --- КОНСТАНТЫ ---
const MAP_CENTER: [number, number] = [51.5, 76.8];
const windLabels: Record<string, string> = {
  С: "Север (С)",
  СВ: "Северо-Восток (СВ)",
  В: "Восток (В)",
  ЮВ: "Юго-Восток (ЮВ)",
  Ю: "Юг (Ю)",
  ЮЗ: "Юго-Запад (ЮЗ)",
  З: "Запад (З)",
  СЗ: "Северо-Запад (СЗ)",
};
const windAngle: Record<string, number> = {
  С: 180, СВ: 225, В: 270, ЮВ: 315,
  Ю: 0, ЮЗ: 45, З: 90, СЗ: 135,
};

// --- УТИЛИТЫ ---
function generateEllipse(
  lat: number, lon: number,
  a: number, b: number, offset: number, dir: string,
) {
  const angle = ((windAngle[dir] ?? 0) * Math.PI) / 180;
  const points: [number, number][] = [];
  const cLat = lat + (offset * Math.cos(angle)) / 111320;
  const cLon = lon + (offset * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i++) {
    const t = (2 * Math.PI * i) / 64;
    const x = a * Math.cos(t), y = b * Math.sin(t);
    const rotX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotY = x * Math.sin(angle) + y * Math.cos(angle);
    points.push([
      cLat + rotX / 111320,
      cLon + rotY / (111320 * Math.cos((cLat * Math.PI) / 180)),
    ]);
  }
  return points;
}

function offsetPoint(lat: number, lon: number, dist: number, angleDeg: number): [number, number] {
  const r = (angleDeg * Math.PI) / 180;
  return [
    lat + (dist * Math.cos(r)) / 111320,
    lon + (dist * Math.sin(r)) / (111320 * Math.cos((lat * Math.PI) / 180)),
  ];
}

function fmt(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(2) + " км" : m.toFixed(0) + " м";
}

function fmtArea(m2: number, ha: number): string {
  return ha >= 1 ? ha.toFixed(2) + " га" : m2.toFixed(0) + " м²";
}

// --- КОМПОНЕНТЫ КАРТЫ ---
function MapLogic({
  result, onMapClick,
}: {
  result: any;
  onMapClick: (lat: number, lon: number) => void;
}) {
  const map = useMap();
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  useEffect(() => {
    if (result?.input_data)
      map.flyTo([result.input_data.latitude, result.input_data.longitude], 12);
  }, [result]);
  return null;
}

// Масштабная линейка
function ScaleControl() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ imperial: false, position: "bottomright", maxWidth: 200 });
    scale.addTo(map);
    return () => { scale.remove(); };
  }, [map]);
  return null;
}

// Zoom контролы
function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const zoom = L.control.zoom({ position: "bottomright" });
    zoom.addTo(map);
    return () => { zoom.remove(); };
  }, [map]);
  return null;
}

// Перелёт к координатам (внутри MapContainer)
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 12);
  }, [target, map]);
  return null;
}

// Стрелка ветра на карте
function WindArrow({ lat, lon, dir, dist }: { lat: number; lon: number; dir: string; dist: number }) {
  const deg = windAngle[dir] ?? 0;
  const len = dist * 1.3;
  const end = offsetPoint(lat, lon, len, deg);
  const headLen = len * 0.12;
  const left = offsetPoint(end[0], end[1], headLen, deg + 150);
  const right = offsetPoint(end[0], end[1], headLen, deg - 150);
  return (
    <>
      <Polyline positions={[[lat, lon], end]} pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "8,6", opacity: 0.7 }} />
      <Polyline positions={[left, end, right]} pathOptions={{ color: "#3b82f6", weight: 2.5, opacity: 0.8 }} />
    </>
  );
}

// Линии расстояний от точки возгорания с подписями
function DistanceLabels({ result }: { result: any }) {
  const lat = result.input_data.latitude;
  const lon = result.input_data.longitude;
  const dir = result.input_data.wind_direction;
  const deg = windAngle[dir] ?? 0;

  const frontEnd = offsetPoint(lat, lon, result.d_front, deg);
  const rearEnd = offsetPoint(lat, lon, result.d_rear, deg + 180);
  const flankEnd1 = offsetPoint(lat, lon, result.d_flank, deg + 90);
  const flankEnd2 = offsetPoint(lat, lon, result.d_flank, deg - 90);

  return (
    <>
      {/* Фронт */}
      <Polyline positions={[[lat, lon], frontEnd]} pathOptions={{ color: "#ef4444", weight: 1.5, dashArray: "4,4", opacity: 0.8 }}>
        <Tooltip permanent direction="right" className="fire-label">
          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 11 }}>{fmt(result.d_front)}</span>
          <span style={{ color: "#888", fontSize: 9, marginLeft: 4 }}>фронт</span>
        </Tooltip>
      </Polyline>
      {/* Тыл */}
      <Polyline positions={[[lat, lon], rearEnd]} pathOptions={{ color: "#eab308", weight: 1.5, dashArray: "4,4", opacity: 0.8 }}>
        <Tooltip permanent direction="left" className="fire-label">
          <span style={{ color: "#ca8a04", fontWeight: 700, fontSize: 11 }}>{fmt(result.d_rear)}</span>
          <span style={{ color: "#888", fontSize: 9, marginLeft: 4 }}>тыл</span>
        </Tooltip>
      </Polyline>
      {/* Фланг */}
      <Polyline positions={[flankEnd1, flankEnd2]} pathOptions={{ color: "#f97316", weight: 1.5, dashArray: "4,4", opacity: 0.6 }}>
        <Tooltip permanent direction="top" className="fire-label">
          <span style={{ color: "#ea580c", fontWeight: 700, fontSize: 11 }}>{fmt(result.d_flank)}</span>
          <span style={{ color: "#888", fontSize: 9, marginLeft: 4 }}>фланг</span>
        </Tooltip>
      </Polyline>
    </>
  );
}

// --- КОМПАС ---
function Compass() {
  return (
    <div className="absolute top-20 right-4 z-[1000]">
      <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center select-none">
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
          <polygon points="50,8 44,50 56,50" fill="#dc2626" opacity="0.9" />
          <polygon points="50,92 44,50 56,50" fill="#94a3b8" opacity="0.6" />
          <circle cx="50" cy="50" r="3" fill="#1e293b" />
          <text x="50" y="6" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">С</text>
          <text x="50" y="99" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">Ю</text>
          <text x="96" y="53" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">В</text>
          <text x="4" y="53" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">З</text>
        </svg>
      </div>
    </div>
  );
}

// --- ВВОД КООРДИНАТ ---
function CoordinateInput({ onGo }: { onGo: (lat: number, lon: number) => void }) {
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const handleGo = () => {
    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    if (!isNaN(la) && !isNaN(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) {
      onGo(la, lo);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <div className="absolute top-20 left-4 z-[1000]">
        <button
          onClick={() => setOpen(true)}
          className="bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 hover:bg-white transition-colors text-sm font-medium text-slate-700"
          title="Перейти по координатам"
        >
          <Crosshair size={16} className="text-blue-600" />
          Координаты
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-20 left-4 z-[1000] bg-white/95 backdrop-blur shadow-xl border border-slate-200 rounded-xl p-4 w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <Crosshair size={14} className="text-blue-600" />
          Перейти по координатам
        </span>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase">Широта (N)</label>
          <input
            type="number" step="0.0001" placeholder="50.7933"
            value={lat} onChange={e => setLat(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 ring-blue-500 outline-none"
            onKeyDown={e => e.key === "Enter" && handleGo()}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase">Долгота (E)</label>
          <input
            type="number" step="0.0001" placeholder="75.7003"
            value={lon} onChange={e => setLon(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 ring-blue-500 outline-none"
            onKeyDown={e => e.key === "Enter" && handleGo()}
          />
        </div>
        <button
          onClick={handleGo}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Search size={14} />
          Найти и поставить метку
        </button>
      </div>
    </div>
  );
}

// --- БОЛЬШОЙ КАЛЬКУЛЯТОР (САЙДБАР) ---
function BigCalculator({ lat, lon, onSubmit, onCancel, loading }: any) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    wind_speed: 3,
    wind_direction: "С",
    temp: 25,
    humidity: 30,
    rho: 40,
    E: 0.7,
    W: 25,
    t: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, latitude: lat, longitude: lon });
  };

  const windyUrl = `https://www.windy.com/?${lat},${lon},11`;

  return (
    <div className="absolute top-16 left-0 h-[calc(100%-4rem)] w-[450px] bg-white shadow-2xl z-[2000] flex flex-col border-r border-slate-200 overflow-hidden animate-in slide-in-from-left duration-300">
      {/* Шапка */}
      <div className="bg-slate-900 text-white p-5 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-red-500 fill-red-500" />
            Калькулятор пожара
          </h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1 opacity-80">
            <MapPin size={14} /> {lat.toFixed(4)}, {lon.toFixed(4)}
          </p>
        </div>
        <button onClick={onCancel} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors text-white">
          <X size={20} />
        </button>
      </div>

      {/* Тело */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {/* 1. Дата/Время */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Время обнаружения
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Дата</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Время</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 ring-blue-500 outline-none text-sm" />
            </div>
          </div>
        </section>

        {/* 2. Метео */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Wind size={16} className="text-blue-600" /> Метеоусловия
            </h3>
            <a href={windyUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors font-semibold">
              <Globe size={12} /> Windy <ExternalLink size={10} />
            </a>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ветер (м/с)</label>
                <div className="relative">
                  <input type="number" step="0.1" value={form.wind_speed}
                    onChange={e => setForm({ ...form, wind_speed: +e.target.value })}
                    className="w-full p-2 pl-3 border border-slate-200 rounded-lg focus:ring-2 ring-blue-500 outline-none text-sm font-bold text-slate-700 bg-white" />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">м/с</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Температура</label>
                <div className="relative">
                  <input type="number" value={form.temp} onChange={e => setForm({ ...form, temp: +e.target.value })}
                    className="w-full p-2 pl-8 border border-slate-200 rounded-lg focus:ring-2 ring-blue-500 outline-none text-sm bg-white text-slate-900" />
                  <Thermometer size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">°C</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Направление ветра</label>
              <select value={form.wind_direction} onChange={e => setForm({ ...form, wind_direction: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 ring-blue-500 outline-none text-sm">
                {Object.entries(windLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* 3. Лес */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trees size={16} className="text-green-600" /> Параметры ЛПМ
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Влажность ЛГМ (%)</label>
                <div className="relative">
                  <input type="number" value={form.W} onChange={e => setForm({ ...form, W: +e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 ring-green-500 outline-none text-sm bg-white text-slate-900" />
                  <Droplets size={14} className="absolute right-3 top-2.5 text-blue-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Запас (т/га)</label>
                <input type="number" value={form.rho} onChange={e => setForm({ ...form, rho: +e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 ring-green-500 outline-none text-sm bg-white text-slate-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Коэф. черноты (E)</label>
              <input type="range" min="0" max="1" step="0.05" value={form.E}
                onChange={e => setForm({ ...form, E: +e.target.value })}
                className="w-full accent-green-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0</span>
                <span className="font-bold text-slate-600">{form.E}</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Прогноз */}
        <section className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" /> Длительность
          </h3>
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">Время прогноза (часов)</label>
            <input type="number" min="0.5" step="0.5" value={form.t}
              onChange={e => setForm({ ...form, t: +e.target.value })}
              className="w-full p-3 border border-amber-200 rounded-lg bg-white text-lg font-bold text-amber-900 focus:ring-2 ring-amber-500 outline-none" />
          </div>
        </section>
      </div>

      {/* Футер */}
      <div className="p-5 border-t border-slate-200 bg-white shrink-0">
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? <span className="animate-pulse">Расчет...</span> : <>Рассчитать <ArrowRight size={20} /></>}
        </button>
      </div>
    </div>
  );
}

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export function RiskMap({
  result, onCalculate, loading,
}: {
  result: any;
  onCalculate?: (d: any) => void;
  loading?: boolean;
}) {
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const handleCoordGo = (lat: number, lon: number) => {
    setPoint([lat, lon]);
    setFlyTarget([lat, lon]);
  };

  const geom = result?.semi_major
    ? {
        outer: generateEllipse(result.input_data.latitude, result.input_data.longitude, result.semi_major * 1.3, result.semi_minor * 1.3, result.center_offset * 1.3, result.input_data.wind_direction),
        main: generateEllipse(result.input_data.latitude, result.input_data.longitude, result.semi_major, result.semi_minor, result.center_offset, result.input_data.wind_direction),
        inner: generateEllipse(result.input_data.latitude, result.input_data.longitude, result.semi_major * 0.5, result.semi_minor * 0.5, result.center_offset * 0.5, result.input_data.wind_direction),
      }
    : null;

  return (
    <div className="relative w-full h-full bg-slate-100 font-sans text-slate-900">
      {/* КАРТА */}
      <MapContainer center={MAP_CENTER} zoom={8} className="h-full w-full z-0" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapLogic result={result} onMapClick={(lat, lon) => { setPoint([lat, lon]); setFlyTarget(null); }} />
        <ScaleControl />
        <ZoomControl />
        {flyTarget && <FlyTo target={flyTarget} />}

        {/* Лесные маркеры */}
        <Marker position={[50.7933, 75.7003]}>
          <Popup><div className="text-center text-slate-900"><strong className="block text-green-700">Баянаульский лес</strong><span className="text-xs text-slate-500">ГНПП Баянаул</span></div></Popup>
        </Marker>
        <Marker position={[52.38, 78.01]}>
          <Popup><div className="text-center text-slate-900"><strong className="block text-green-700">Щербактинский лес</strong><span className="text-xs text-slate-500">РГУ "ЕРМАК"</span></div></Popup>
        </Marker>

        {/* Выбранная точка */}
        {point && <Marker position={point} icon={clickedIcon} />}

        {/* Визуализация пожара */}
        {geom && result && (
          <>
            <Polygon positions={geom.outer} pathOptions={{ color: "#f59e0b", fillColor: "#fbbf24", fillOpacity: 0.1, dashArray: "5,5" }}>
              <Tooltip permanent direction="top" className="fire-label" offset={[0, -10]}>
                <span style={{ color: "#d97706", fontWeight: 600, fontSize: 10 }}>Зона угрозы (+30%)</span>
              </Tooltip>
            </Polygon>
            <Polygon positions={geom.main} pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.3, weight: 2 }}>
              <Tooltip permanent direction="bottom" className="fire-label-main" offset={[0, 10]}>
                <div style={{ textAlign: "center", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#dc2626" }}>
                    S = {fmtArea(result.area, result.area_ha)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#1e293b" }}>
                    P = {fmt(result.perimeter)}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
            <Polygon positions={geom.inner} pathOptions={{ color: "#991b1b", fillColor: "#991b1b", fillOpacity: 0.5, weight: 0 }} />

            {/* Точка возгорания */}
            <Marker position={[result.input_data.latitude, result.input_data.longitude]} icon={fireIcon} />

            {/* Стрелка ветра */}
            <WindArrow lat={result.input_data.latitude} lon={result.input_data.longitude} dir={result.input_data.wind_direction} dist={result.d_front} />

            {/* Линии расстояний с подписями */}
            <DistanceLabels result={result} />
          </>
        )}
      </MapContainer>

      {/* КОМПАС */}
      <Compass />

      {/* ВВОД КООРДИНАТ */}
      <CoordinateInput onGo={handleCoordGo} />

      {/* САЙДБАР */}
      {point && onCalculate && (
        <BigCalculator lat={point[0]} lon={point[1]} onSubmit={onCalculate} onCancel={() => setPoint(null)} loading={loading} />
      )}

      {/* РЕЗУЛЬТАТ (СПРАВА) */}
      {result && !point && (
        <div className="absolute top-20 right-24 z-[1000] w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-right">
          <div className="bg-slate-900 text-white p-4">
            <h4 className="font-bold flex justify-between items-center">
              Результат прогноза
              <span className="bg-red-500 text-xs px-2 py-1 rounded">ПОЖАР</span>
            </h4>
          </div>
          <div className="p-5">
            {/* Площадь */}
            <div className="text-center mb-4">
              <span className="text-4xl font-extrabold text-slate-900">{fmtArea(result.area, result.area_ha)}</span>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Площадь поражения</p>
            </div>
            {/* Детали */}
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-600">Площадь (м²)</span>
                <span className="font-bold text-slate-900">{result.area.toFixed(0)} м²</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-600">Периметр</span>
                <span className="font-bold text-slate-900">{fmt(result.perimeter)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-sm text-slate-600">Фронт</span>
                <span className="font-bold text-red-600">{result.v1.toFixed(2)} м/мин &middot; {fmt(result.d_front)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                <span className="text-sm text-slate-600">Фланг</span>
                <span className="font-bold text-orange-600">{result.v2.toFixed(2)} м/мин &middot; {fmt(result.d_flank)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <span className="text-sm text-slate-600">Тыл</span>
                <span className="font-bold text-yellow-600">{result.v3.toFixed(2)} м/мин &middot; {fmt(result.d_rear)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-sm text-slate-600">Ветер</span>
                <span className="font-bold text-blue-600">{windLabels[result.input_data.wind_direction]}, {result.input_data.wind_speed} м/с</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button onClick={() => setPoint([result.input_data.latitude, result.input_data.longitude])}
              className="text-xs text-blue-600 font-bold hover:underline">
              ИЗМЕНИТЬ ПАРАМЕТРЫ
            </button>
          </div>
        </div>
      )}

      {/* ПОДСКАЗКА */}
      {!point && !result && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <MapPin className="text-blue-400" />
            <span className="font-medium">Кликните на карту или введите координаты</span>
          </div>
        </div>
      )}
    </div>
  );
}
