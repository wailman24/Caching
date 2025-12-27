import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'
import { HardDrive, Cpu } from 'lucide-react'

interface MemoryGaugeProps {
  used: number
  total: number
  itemCount: number
}

export function MemoryGauge({ used, total, itemCount }: MemoryGaugeProps) {
  const percentage = (used / total) * 100
  
  const getStatusColor = () => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 75) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (percentage < 50) return 'Healthy'
    if (percentage < 75) return 'Moderate'
    return 'Critical'
  }

  return (
    <Card className="border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] to-transparent pointer-events-none" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-green-500" />
            Memory Usage
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            percentage < 50 ? 'bg-green-500/10 text-green-500' :
            percentage < 75 ? 'bg-orange-500/10 text-orange-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main gauge */}
        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-4xl font-bold font-mono">{percentage.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground font-mono">
              {formatBytes(used)} / {formatBytes(total)}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-3 bg-secondary"
            indicatorClassName={getStatusColor()}
          />
          
          {/* Threshold markers */}
          <div className="relative h-4 mt-1">
            <div className="absolute left-[50%] w-px h-2 bg-orange-500/50" />
            <div className="absolute left-[75%] w-px h-2 bg-red-500/50" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cached Items</p>
              <p className="text-lg font-semibold font-mono">{itemCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-semibold font-mono">{formatBytes(total - used)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

