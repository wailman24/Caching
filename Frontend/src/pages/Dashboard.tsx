import { useCacheStore, MAX_MEMORY } from '@/store/cacheStore'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { MemoryGauge } from '@/components/dashboard/MemoryGauge'
import { EventLog } from '@/components/dashboard/EventLog'
import { ProductTable } from '@/components/dashboard/ProductTable'
import { formatPercentage } from '@/lib/utils'
import { Zap, AlertCircle, Trash2, Activity, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { metrics, events, getCacheSize, getCachedProducts, clearCache, resetMetrics } = useCacheStore()
  const cacheSize = getCacheSize()
  const products = getCachedProducts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time cache performance monitoring and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Metrics
          </Button>
          <Button variant="destructive" size="sm" onClick={clearCache}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Hit Rate"
          value={formatPercentage(metrics.hitRate)}
          subtitle={`${metrics.cacheHits} hits out of ${metrics.totalRequests} requests`}
          icon={<Zap className="w-6 h-6" />}
          variant="success"
          trend={metrics.hitRate > 0.7 ? 'up' : metrics.hitRate > 0.3 ? 'neutral' : 'down'}
          trendValue={metrics.hitRate > 0.7 ? 'Good' : metrics.hitRate > 0.3 ? 'Moderate' : 'Low'}
        />
        <MetricsCard
          title="Miss Rate"
          value={formatPercentage(metrics.missRate)}
          subtitle={`${metrics.cacheMisses} misses required DB fetch`}
          icon={<AlertCircle className="w-6 h-6" />}
          variant="warning"
        />
        <MetricsCard
          title="Total Evictions"
          value={metrics.evictions}
          subtitle="Items removed due to memory limit"
          icon={<Trash2 className="w-6 h-6" />}
          variant="danger"
        />
        <MetricsCard
          title="Total Requests"
          value={metrics.totalRequests}
          subtitle="Cache lookup operations"
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      {/* Memory and Events */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MemoryGauge 
            used={cacheSize} 
            total={MAX_MEMORY} 
            itemCount={products.length}
          />
        </div>
        <div className="lg:col-span-2">
          <EventLog events={events} />
        </div>
      </div>

      {/* Cache Strategy Info */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 border border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-500/20">
            <Server className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-green-400">Cache-Aside Strategy Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              When data is requested, the system first checks the cache. On a <span className="text-green-500 font-medium">hit</span>, 
              data is returned instantly. On a <span className="text-orange-500 font-medium">miss</span>, the system fetches from the 
              database (1s delay), stores it in cache, then returns it. LRU eviction policy removes oldest items when memory is full.
            </p>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <ProductTable />
    </div>
  )
}

