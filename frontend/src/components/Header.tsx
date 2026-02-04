/**
 * Компонент заголовка приложения
 */

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { Flame, Sun, Moon, Shield } from 'lucide-react'

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Логотип и название */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-600 text-white">
            <Flame className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">
              Прогнозирование пожаров
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              ДЧС города Павлодар
            </p>
          </div>
        </div>

        {/* Мобильный заголовок */}
        <div className="sm:hidden text-center">
          <h1 className="font-bold text-sm">ДЧС Павлодар</h1>
        </div>

        {/* Действия */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-4 text-sm text-[hsl(var(--muted-foreground))]">
            <Shield className="h-4 w-4" />
            <span>Департамент по ЧС</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
