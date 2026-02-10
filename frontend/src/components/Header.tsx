import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Shield, Flame } from "lucide-react";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Shield className="h-6 w-6" />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-base sm:text-lg leading-none tracking-tight text-foreground">
              Калькулятор Лесных Пожаров
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ДЧС г. Павлодар
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mr-2">
            <Flame className="w-3.5 h-3.5 mr-2" />
            Баянаул / Щербакты
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
