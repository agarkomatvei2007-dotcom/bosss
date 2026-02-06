import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, BarChart3 } from "lucide-react";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* ЛЕВАЯ ЧАСТЬ: Название без иконки */}
        <div className="flex flex-col justify-center">
          <h1 className="font-bold text-base sm:text-lg leading-none tracking-tight text-foreground">
            Система Прогнозирования
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ДЧС г. Павлодар
            </p>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Управление */}
        <div className="flex items-center gap-2">
          {/* Декоративный элемент для больших экранов */}
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mr-2">
            <BarChart3 className="w-3.5 h-3.5 mr-2" />
            Мониторинг 24/7
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-muted"
            title={
              theme === "light"
                ? "Включить темную тему"
                : "Включить светлую тему"
            }
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 transition-all" />
            ) : (
              <Sun className="h-5 w-5 transition-all" />
            )}
            <span className="sr-only">Переключить тему</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
