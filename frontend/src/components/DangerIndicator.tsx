/**
 * Компонент индикатора уровня пожарной опасности
 */

import { cn, getDangerGradient, getDangerText } from '@/lib/utils'
import type { DangerLevel } from '@/types'
import { AlertTriangle, Shield, AlertCircle, Flame } from 'lucide-react'

interface DangerIndicatorProps {
  level: DangerLevel
  index?: number
  showIndex?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const icons = {
  low: Shield,
  medium: AlertCircle,
  high: AlertTriangle,
  extreme: Flame
}

const sizeClasses = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-xl'
}

const iconSizes = {
  sm: 20,
  md: 28,
  lg: 40
}

export function DangerIndicator({
  level,
  index,
  showIndex = true,
  size = 'md',
  className
}: DangerIndicatorProps) {
  const Icon = icons[level]
  const gradient = getDangerGradient(level)
  const text = getDangerText(level)

  return (
    <div
      className={cn(
        'rounded-lg text-white flex items-center gap-3',
        gradient,
        sizeClasses[size],
        level === 'extreme' && 'animate-pulse-danger',
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <div className="flex flex-col">
        <span className="font-bold uppercase tracking-wide">{text}</span>
        {showIndex && index !== undefined && (
          <span className="text-white/80 text-sm">
            Индекс: {index.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Компактная версия индикатора для таблиц
 */
export function DangerBadge({ level }: { level: DangerLevel }) {
  const gradient = getDangerGradient(level)
  const text = getDangerText(level)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
        gradient
      )}
    >
      {text}
    </span>
  )
}
