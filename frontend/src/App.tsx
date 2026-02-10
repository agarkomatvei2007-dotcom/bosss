/**
 * Калькулятор распространения лесных пожаров
 * Департамент по чрезвычайным ситуациям города Павлодар
 */

import { useState } from "react";
import { Header } from "@/components/Header";
import { WeatherForm } from "@/components/WeatherForm";
import { PredictionResultView } from "@/components/PredictionResult";
import { RiskMap } from "@/components/RiskMap";
import { useFireSpread } from "@/hooks/useApi";
import type { FireSpreadInput } from "@/types";
import { Flame, Map } from "lucide-react";

type TabId = "calculator" | "map";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "calculator",
    label: "Калькулятор",
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: "map",
    label: "Карта",
    icon: <Map className="h-4 w-4" />,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("calculator");
  const { calculate, loading, error, result } = useFireSpread();

  const handleCalculate = async (data: FireSpreadInput) => {
    await calculate(data);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 selection:bg-slate-200">
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
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-6">
        {/* Калькулятор */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherForm onSubmit={handleCalculate} loading={loading} />
            <div>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
              {result && <PredictionResultView result={result} />}
            </div>
          </div>
        )}

        {/* Карта */}
        {activeTab === "map" && <RiskMap result={result} />}
      </main>

      {/* Футер */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p>
            Департамент по чрезвычайным ситуациям города Павлодар
          </p>
          <p className="mt-1">
            Калькулятор распространения лесных пожаров
          </p>
        </div>
      </footer>
    </div>
  );
}
