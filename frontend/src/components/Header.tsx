import { Shield, Flame, Activity } from "lucide-react";

export function Header() {
  // Получаем текущую дату для отображения
  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="absolute top-0 left-0 right-0 z-[3000] w-full border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto px-6 h-16 flex items-center justify-between">
        {/* ЛЕВАЯ ЧАСТЬ: Логотип и Название */}
        <div className="flex items-center gap-4">
          {/* Логотип (Стилизованный щит ДЧС) */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-900/20">
            <Shield className="h-6 w-6" strokeWidth={2.5} />
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-white">
              <Flame size={10} className="text-red-600 fill-red-600" />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-lg leading-none text-slate-900 tracking-tight">
              Система Мониторинга Пожаров
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                ДЧС г. Павлодар
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-[10px] text-slate-500 font-medium">
                v2.0.1 (Stable)
              </span>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Статус и Информация */}
        <div className="flex items-center gap-4">
          {/* Индикатор лесов */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Баянаул
            </div>
            <div className="w-px h-3 bg-slate-300"></div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Щербакты
            </div>
          </div>

          {/* Дата и Время */}
          <div className="hidden lg:flex flex-col items-end border-l pl-4 border-slate-200">
            <span className="text-xs font-bold text-slate-700">{today}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 rounded mt-0.5">
              <Activity size={10} />
              Система активна
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
  