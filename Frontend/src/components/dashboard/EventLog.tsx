import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CacheEvent } from '@/types'
import { Activity, Zap, AlertCircle, Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventLogProps {
  events: CacheEvent[]
}

const eventConfig = {
  hit: { icon: Zap, color: 'text-green-500', bg: 'bg-green-500/10', label: 'CACHE HIT' },
  miss: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'CACHE MISS' },
  eviction: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10', label: 'EVICTION' },
  add: { icon: Plus, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'ADDED' },
  update: { icon: Pencil, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'UPDATED' },
  delete: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10', label: 'DELETED' },
}

export function EventLog({ events }: EventLogProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Event Log
          <span className="ml-auto text-xs font-normal text-muted-foreground font-mono">
            {events.length} events
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events yet</p>
              <p className="text-xs">Start interacting with products to see cache events</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((event) => {
                const config = eventConfig[event.type]
                const Icon = config.icon
                
                return (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn('p-2 rounded-lg', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-mono font-medium', config.color)}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {event.productName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

