import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}: MetricsCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/30 glow-green',
    warning: 'border-orange-500/30 glow-orange',
    danger: 'border-red-500/30 glow-red',
  }

  const iconBgStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-orange-500/10 text-orange-500',
    danger: 'bg-red-500/10 text-red-500',
  }

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-300 hover:scale-[1.02]', variantStyles[variant], className)}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight font-mono">
                {value}
              </span>
              {trend && trendValue && (
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  trend === 'up' && 'bg-green-500/10 text-green-500',
                  trend === 'down' && 'bg-red-500/10 text-red-500',
                  trend === 'neutral' && 'bg-muted text-muted-foreground'
                )}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

