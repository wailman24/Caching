import { useEffect } from 'react'
import { useCacheStore, MAX_MEMORY, loadAllProducts } from '@/store/cacheStore'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { MemoryGauge } from '@/components/dashboard/MemoryGauge'
import { EventLog } from '@/components/dashboard/EventLog'
import { ProductTable } from '@/components/dashboard/ProductTable'
import { formatPercentage } from '@/lib/utils'
import { Zap, AlertCircle, Trash2, Activity, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  // Use Zustand selectors to ensure real-time updates
  const metrics = useCacheStore((state) => state.metrics)
  const events = useCacheStore((state) => state.events)
  const cache = useCacheStore((state) => state.cache)
  const getCacheSize = useCacheStore((state) => state.getCacheSize)
  const clearCache = useCacheStore((state) => state.clearCache)
  const resetMetrics = useCacheStore((state) => state.resetMetrics)
  
  const cacheSize = getCacheSize()
  const products = Array.from(cache.values())

  useEffect(() => {
    // Load all products from backend on mount
    // This populates availableProductsCache but does NOT add them to cache
    // Products will be loaded into cache only when explicitly fetched (Cache-Aside pattern)
    console.log('Dashboard mounted, loading products from backend...')
    loadAllProducts().then((count) => {
      console.log(`Loaded ${count} products from backend (available for fetching)`)
    }).catch((error) => {
      console.error('Failed to load products:', error)
    })
  }, [])

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
          <Button variant="destructive" size="sm" onClick={() => clearCache()}>
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
            <h3 className="font-semibold text-green-400">Backend Cache Strategies Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Cache-Aside (Reads):</strong> Backend checks Redis cache first. On a <span className="text-green-500 font-medium">hit</span>, 
              data returns instantly. On a <span className="text-orange-500 font-medium">miss</span>, backend fetches from MySQL database, 
              stores in Redis cache, then returns it.
              <br />
              <strong>Write-Through (Writes):</strong> Create/Update operations write to MySQL database first, then immediately update Redis cache. 
              Updates use Redis locks to prevent race conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <ProductTable />
    </div>
  )
}

