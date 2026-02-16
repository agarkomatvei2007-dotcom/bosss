import { Header } from "@/components/Header";
import { RiskMap } from "@/components/RiskMap";
import { useFireSpread } from "@/hooks/useApi";
// import { Toaster } from "@/components/ui/toaster"; <--- УБРАЛИ ЭТО

export default function App() {
  const { calculate, loading, error, result } = useFireSpread();

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfdfe] overflow-hidden">
      <Header />

      <main className="flex-1 relative w-full h-full">
        <RiskMap result={result} onCalculate={calculate} loading={loading} />

        {/* Вместо Тостера выведем ошибку просто текстом поверх карты, если она есть */}
        {error && (
          <div className="absolute top-20 right-4 z-[2000] max-w-sm bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
            <div className="bg-red-100 p-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}
      </main>

      {/* <Toaster /> <--- И ЭТО ТОЖЕ УБРАЛИ */}
    </div>
  );
}
