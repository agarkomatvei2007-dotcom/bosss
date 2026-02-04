/**
 * Главный компонент приложения
 * Система прогнозирования лесных пожаров
 * Департамент по чрезвычайным ситуациям города Павлодар
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
import { DangerIndicator } from "@/components/DangerIndicator";
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
import type {
  WeatherData,
  PredictionResult,
  RiskZone,
  HistoricalRecord,
  DangerLevel,
} from "@/types";
import {
  LayoutDashboard,
  FormInput,
  Map,
  BarChart3,
  History,
  Upload,
  FileText,
} from "lucide-react";

// Вкладки навигации
type TabId = "dashboard" | "input" | "map" | "charts" | "history" | "upload";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Дашборд",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "input",
    label: "Ввод данных",
    icon: <FormInput className="h-4 w-4" />,
  },
  { id: "map", label: "Карта", icon: <Map className="h-4 w-4" /> },
  { id: "charts", label: "Графики", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "history", label: "История", icon: <History className="h-4 w-4" /> },
  { id: "upload", label: "Загрузка", icon: <Upload className="h-4 w-4" /> },
];

export default function App() {
  // Состояние вкладок
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Хуки API
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
  const {
    fetchStats,
    loading: statsLoading,
    stats: statsData,
  } = useStatistics();
  const { uploadFile, loading: uploadLoading } = useFileUpload();
  const { exportPdf, exportCsv, loading: exportLoading } = useExport();

  // Состояние пагинации
  const [historyOffset, setHistoryOffset] = useState(0);
  const pageSize = 20;

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchZones();
    fetchStats(30);
    fetchHistory({ limit: pageSize, offset: 0 });
  }, []);

  // Обработчик отправки формы
  const handlePredict = async (data: WeatherData) => {
    await predict(data);
    // Обновляем данные после прогноза
    fetchZones();
    fetchHistory({ limit: pageSize, offset: historyOffset });
    fetchStats(30);
  };

  // Обработчик загрузки файла
  const handleUpload = async (file: File) => {
    const result = await uploadFile(file);
    // Обновляем данные после загрузки
    fetchZones();
    fetchHistory({ limit: pageSize, offset: 0 });
    fetchStats(30);
    return result;
  };

  // Обработчик смены страницы истории
  const handlePageChange = (offset: number) => {
    setHistoryOffset(offset);
    fetchHistory({ limit: pageSize, offset });
  };

  // Получение текущего максимального уровня опасности
  const getMaxDangerLevel = (): {
    level: DangerLevel;
    zone: RiskZone | null;
  } => {
    if (!zonesData?.zones?.length) {
      return { level: "low", zone: null };
    }

    const dangerOrder: DangerLevel[] = ["low", "medium", "high", "extreme"];
    let maxLevel: DangerLevel = "low";
    let maxZone: RiskZone | null = null;

    for (const zone of zonesData.zones) {
      const zoneIndex = dangerOrder.indexOf(zone.danger_level);
      const maxIndex = dangerOrder.indexOf(maxLevel);
      if (zoneIndex > maxIndex) {
        maxLevel = zone.danger_level;
        maxZone = zone;
      }
    }

    return { level: maxLevel, zone: maxZone };
  };

  const { level: maxDangerLevel, zone: maxDangerZone } = getMaxDangerLevel();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Header />

      {/* Навигация */}
      <nav className="border-b bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                      : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-6">
        {/* Дашборд */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Текущий уровень опасности */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Текущая пожарная обстановка</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <DangerIndicator
                    level={maxDangerLevel}
                    index={maxDangerZone?.composite_index}
                    size="lg"
                    className="flex-1"
                  />
                  {maxDangerZone && (
                    <div className="text-center md:text-left">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Максимальный уровень в зоне:
                      </p>
                      <p className="font-medium">{maxDangerZone.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Статистика */}
            {statsData?.data && <StatisticsCards stats={statsData.data} />}

            {/* Карта и распределение */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskMap
                zones={zonesData?.zones || []}
                loading={zonesLoading}
                onRefresh={fetchZones}
              />
              {statsData?.data?.danger_distribution && (
                <DangerDistributionChart
                  distribution={statsData.data.danger_distribution}
                />
              )}
            </div>

            {/* Последние записи */}
            <HistoryTable
              data={(historyData?.data || []).slice(0, 5)}
              loading={historyLoading}
            />
          </div>
        )}

        {/* Ввод данных */}
        {activeTab === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Карта */}
        {activeTab === "map" && (
          <RiskMap
            zones={zonesData?.zones || []}
            loading={zonesLoading}
            onRefresh={fetchZones}
          />
        )}

        {/* Графики */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            {statsData?.data && <StatisticsCards stats={statsData.data} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart data={historyData?.data || []} />
              <WeatherChart data={historyData?.data || []} />
            </div>
            {statsData?.data?.danger_distribution && (
              <DangerDistributionChart
                distribution={statsData.data.danger_distribution}
              />
            )}
          </div>
        )}

        {/* История */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => exportCsv()}
                disabled={exportLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                {exportLoading ? "Экспорт..." : "Экспорт всей истории в CSV"}
              </Button>
            </div>
            <HistoryTable
              data={historyData?.data || []}
              loading={historyLoading}
              onPageChange={handlePageChange}
              currentOffset={historyOffset}
              pageSize={pageSize}
              onExportCsv={() => exportCsv()}
              exportLoading={exportLoading}
            />
          </div>
        )}

        {/* Загрузка файлов */}
        {activeTab === "upload" && (
          <div className="max-w-2xl mx-auto">
            <FileUpload onUpload={handleUpload} loading={uploadLoading} />
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p>© 2026 Департамент по чрезвычайным ситуациям города Павлодар</p>
          <p className="mt-1">Система прогнозирования лесных пожаров</p>
        </div>
      </footer>
    </div>
  );
}
