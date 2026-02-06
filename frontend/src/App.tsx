/**
 * Главный компонент приложения
 * Система мониторинга — ДЧС Павлодар
 */

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { WeatherForm } from "@/components/WeatherForm";
import { PredictionResultView } from "@/components/PredictionResult";
import { RiskMap } from "@/components/RiskMap";
import {
  TrendChart,
  WeatherChart,
  DangerDistributionChart,
  StatisticsCards,
} from "@/components/Charts";
import { HistoryTable } from "@/components/HistoryTable";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePrediction,
  useHistory,
  useZones,
  useStatistics,
  useFileUpload,
  useExport,
} from "@/hooks/useApi";
import type { WeatherData, RiskZone, DangerLevel } from "@/types";
import {
  Home, // Изменено: Новый значок
  ClipboardEdit,
  Map as MapIcon,
  LineChart,
  History as HistoryIcon,
  CloudUpload,
  FileDown,
  ShieldCheck,
  MapPin,
} from "lucide-react";

type TabId = "dashboard" | "input" | "map" | "charts" | "history" | "upload";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Главная", // Изменено: Название
    icon: <Home className="h-4 w-4" />, // Изменено: Иконка
  },
  {
    id: "input",
    label: "Прогноз",
    icon: <ClipboardEdit className="h-4 w-4" />,
  },
  { id: "map", label: "Карта рисков", icon: <MapIcon className="h-4 w-4" /> },
  { id: "charts", label: "Аналитика", icon: <LineChart className="h-4 w-4" /> },
  { id: "history", label: "Журнал", icon: <HistoryIcon className="h-4 w-4" /> },
  { id: "upload", label: "Данные", icon: <CloudUpload className="h-4 w-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const {
    predict,
    loading: predictLoading,
    result: predictionResult,
  } = usePrediction();
  const {
    fetchHistory,
    loading: historyLoading,
    data: historyData,
  } = useHistory();
  const { fetchZones, loading: zonesLoading, zones: zonesData } = useZones();
  const { fetchStats, stats: statsData } = useStatistics();
  const { uploadFile, loading: uploadLoading } = useFileUpload();
  const { exportPdf, exportCsv, loading: exportLoading } = useExport();

  const [historyOffset, setHistoryOffset] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    fetchZones();
    fetchStats(30);
    fetchHistory({ limit: pageSize, offset: 0 });
  }, []);

  const handlePredict = async (data: WeatherData) => {
    await predict(data);
    fetchZones();
    fetchHistory({ limit: pageSize, offset: historyOffset });
  };

  const handlePageChange = (offset: number) => {
    setHistoryOffset(offset);
    fetchHistory({ limit: pageSize, offset });
  };

  const getMaxDangerLevel = (): {
    level: DangerLevel;
    zone: RiskZone | null;
  } => {
    if (!zonesData?.zones?.length) return { level: "low", zone: null };
    const dangerOrder: DangerLevel[] = ["low", "medium", "high", "extreme"];
    let maxLevel: DangerLevel = "low";
    let maxZone: RiskZone | null = null;
    for (const zone of zonesData.zones) {
      if (
        dangerOrder.indexOf(zone.danger_level) > dangerOrder.indexOf(maxLevel)
      ) {
        maxLevel = zone.danger_level;
        maxZone = zone;
      }
    }
    return { level: maxLevel, zone: maxZone };
  };

  const { level: maxDangerLevel, zone: maxDangerZone } = getMaxDangerLevel();

  const dangerConfig = {
    low: {
      label: "Стабильно",
      border: "border-emerald-200",
      bg: "bg-emerald-50/50",
      iconColor: "text-emerald-500",
    },
    medium: {
      label: "Внимание",
      border: "border-amber-200",
      bg: "bg-amber-50/50",
      iconColor: "text-amber-500",
    },
    high: {
      label: "Высокий риск",
      border: "border-orange-200",
      bg: "bg-orange-50/50",
      iconColor: "text-orange-500",
    },
    extreme: {
      label: "Критическая угроза",
      border: "border-red-200",
      bg: "bg-red-50/50",
      iconColor: "text-red-500",
    },
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 selection:bg-slate-200">
      <Header />

      {/* Навигация на всю ширину (w-full вместо container) */}
      <nav className="border-b bg-white sticky top-0 z-30 w-full px-6">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 
                ${
                  activeTab === tab.id
                    ? "border-slate-800 text-slate-900 bg-slate-50" // Убран фиолетовый
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Основной контент на всю ширину (px-6 вместо container) */}
      <main className="w-full px-6 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card
              className={`overflow-hidden border shadow-sm ${dangerConfig[maxDangerLevel].border} bg-white rounded-none sm:rounded-xl`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div
                    className={`p-8 flex flex-1 items-center gap-5 ${dangerConfig[maxDangerLevel].bg}`}
                  >
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                      <ShieldCheck
                        className={`h-8 w-8 ${dangerConfig[maxDangerLevel].iconColor}`}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
                        Текущий статус
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                        {dangerConfig[maxDangerLevel].label}
                      </h2>
                    </div>
                  </div>
                  <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 divide-x border-t md:border-t-0 border-slate-100">
                    <div className="p-8 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Уязвимый район
                      </p>
                      <span className="text-lg font-bold text-slate-700">
                        {maxDangerZone?.name || "Контроль в норме"}
                      </span>
                    </div>
                    <div className="p-8 flex flex-col justify-center bg-slate-50/20">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                        Комплексный индекс
                      </p>
                      <div className="text-5xl font-extralight tracking-tighter text-slate-900">
                        {maxDangerZone?.composite_index?.toFixed(1) || "0.0"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {statsData?.data && <StatisticsCards stats={statsData.data} />}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <RiskMap
                  zones={zonesData?.zones || []}
                  loading={zonesLoading}
                  onRefresh={fetchZones}
                />
              </div>
              <div className="space-y-6">
                {statsData?.data?.danger_distribution && (
                  <DangerDistributionChart
                    distribution={statsData.data.danger_distribution}
                  />
                )}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase text-slate-400">
                      Действия
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full text-xs hover:bg-slate-100 transition-colors"
                      onClick={() => exportCsv()}
                    >
                      <FileDown className="h-4 w-4 mr-2" /> Сформировать отчет
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "input" && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherForm onSubmit={handlePredict} loading={predictLoading} />
            {predictionResult && (
              <PredictionResultView
                result={predictionResult}
                onExportPdf={() => exportPdf(predictionResult.id)}
                exportLoading={exportLoading}
              />
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="w-full h-[80vh] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <RiskMap
              zones={zonesData?.zones || []}
              loading={zonesLoading}
              onRefresh={fetchZones}
            />
          </div>
        )}

        {activeTab === "charts" && (
          <div className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart data={historyData?.data || []} />
              <WeatherChart data={historyData?.data || []} />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <Card className="w-full border-slate-200 shadow-sm border-t-4 border-t-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-slate-500" /> Журнал
                записей
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-slate-100"
                onClick={() => exportCsv()}
                disabled={exportLoading}
              >
                {exportLoading ? "Синхронизация..." : "Экспорт CSV"}
              </Button>
            </CardHeader>
            <CardContent>
              <HistoryTable
                data={historyData?.data || []}
                loading={historyLoading}
                onPageChange={handlePageChange}
                currentOffset={historyOffset}
                pageSize={pageSize}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === "upload" && (
          <div className="w-full flex justify-center pt-12">
            <Card className="w-full max-w-2xl border-dashed border-2 border-slate-200 bg-white">
              <CardContent className="p-16 text-center text-slate-500">
                <FileUpload onUpload={() => {}} loading={uploadLoading} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t bg-slate-50 py-10 w-full px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Департамент по чрезвычайным ситуациям Павлодарской области
          </p>
          <div className="h-px w-20 bg-slate-200"></div>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em]">
            © 2026 Служба мониторинга
          </p>
        </div>
      </footer>
    </div>
  );
}
