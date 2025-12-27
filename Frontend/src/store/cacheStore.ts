import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CacheMetrics, CacheEvent } from '@/types'
import { delay } from '@/lib/utils'

// Maximum cache size in bytes (simulated 1MB RAM)
const MAX_CACHE_SIZE = 1024 * 1024

// Sample products to simulate database
const DATABASE_PRODUCTS: Omit<Product, 'lastAccessed' | 'accessCount' | 'createdAt'>[] = [
  { id: 'p1', name: 'MacBook Pro 16"', price: 2499, category: 'Electronics', stock: 15, size: 2048 },
  { id: 'p2', name: 'iPhone 15 Pro', price: 1199, category: 'Electronics', stock: 50, size: 1536 },
  { id: 'p3', name: 'Sony WH-1000XM5', price: 399, category: 'Audio', stock: 30, size: 1024 },
  { id: 'p4', name: 'iPad Air', price: 799, category: 'Electronics', stock: 25, size: 1792 },
  { id: 'p5', name: 'AirPods Pro', price: 249, category: 'Audio', stock: 100, size: 768 },
  { id: 'p6', name: 'Samsung Galaxy S24', price: 999, category: 'Electronics', stock: 40, size: 1536 },
  { id: 'p7', name: 'Dell XPS 15', price: 1799, category: 'Electronics', stock: 20, size: 2048 },
  { id: 'p8', name: 'Bose QC45', price: 329, category: 'Audio', stock: 35, size: 1024 },
  { id: 'p9', name: 'Apple Watch Ultra', price: 799, category: 'Wearables', stock: 18, size: 1280 },
  { id: 'p10', name: 'Nintendo Switch OLED', price: 349, category: 'Gaming', stock: 45, size: 1536 },
]

interface CacheState {
  // Cache data (simulating RAM)
  cache: Map<string, Product>
  
  // Metrics
  metrics: CacheMetrics
  
  // Event log
  events: CacheEvent[]
  
  // Loading states
  loadingProducts: Set<string>
  
  // Actions
  getProduct: (id: string) => Promise<Product | null>
  addProduct: (product: Omit<Product, 'id' | 'lastAccessed' | 'accessCount' | 'createdAt' | 'size'>) => Promise<Product>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product | null>
  deleteProduct: (id: string) => void
  clearCache: () => void
  resetMetrics: () => void
  
  // Computed
  getCacheSize: () => number
  getMemoryUsage: () => number
  getCachedProducts: () => Product[]
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      cache: new Map(),
      metrics: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        evictions: 0,
        hitRate: 0,
        missRate: 0,
      },
      events: [],
      loadingProducts: new Set(),

      getProduct: async (id: string) => {
        const state = get()
        const cache = new Map(state.cache)
        
        // Check if product is in cache
        if (cache.has(id)) {
          // CACHE HIT - instant return
          const product = cache.get(id)!
          const updatedProduct = {
            ...product,
            lastAccessed: Date.now(),
            accessCount: product.accessCount + 1,
          }
          cache.set(id, updatedProduct)
          
          const newMetrics = {
            ...state.metrics,
            totalRequests: state.metrics.totalRequests + 1,
            cacheHits: state.metrics.cacheHits + 1,
            hitRate: (state.metrics.cacheHits + 1) / (state.metrics.totalRequests + 1),
            missRate: state.metrics.cacheMisses / (state.metrics.totalRequests + 1),
          }
          
          const newEvent: CacheEvent = {
            id: crypto.randomUUID(),
            type: 'hit',
            productId: id,
            productName: product.name,
            timestamp: Date.now(),
          }
          
          set({
            cache,
            metrics: newMetrics,
            events: [newEvent, ...state.events].slice(0, 50),
          })
          
          return updatedProduct
        }
        
        // CACHE MISS - simulate database fetch with delay
        set(s => ({
          loadingProducts: new Set(s.loadingProducts).add(id),
        }))
        
        // Simulate 1 second database delay
        await delay(1000)
        
        // Find product in "database"
        const dbProduct = DATABASE_PRODUCTS.find(p => p.id === id)
        
        if (!dbProduct) {
          set(s => {
            const loading = new Set(s.loadingProducts)
            loading.delete(id)
            return { loadingProducts: loading }
          })
          return null
        }
        
        const product: Product = {
          ...dbProduct,
          lastAccessed: Date.now(),
          accessCount: 1,
          createdAt: Date.now(),
        }
        
        // Check if we need to evict items
        const currentState = get()
        let updatedCache = new Map(currentState.cache)
        let evictionCount = 0
        const evictionEvents: CacheEvent[] = []
        
        // Calculate current cache size
        let currentSize = 0
        updatedCache.forEach(p => currentSize += p.size)
        
        // Evict LRU items if needed
        while (currentSize + product.size > MAX_CACHE_SIZE && updatedCache.size > 0) {
          // Find LRU item
          let lruKey = ''
          let lruTime = Infinity
          
          updatedCache.forEach((p, key) => {
            if ((p.lastAccessed || 0) < lruTime) {
              lruTime = p.lastAccessed || 0
              lruKey = key
            }
          })
          
          if (lruKey) {
            const evictedProduct = updatedCache.get(lruKey)!
            evictionEvents.push({
              id: crypto.randomUUID(),
              type: 'eviction',
              productId: lruKey,
              productName: evictedProduct.name,
              timestamp: Date.now(),
            })
            currentSize -= evictedProduct.size
            updatedCache.delete(lruKey)
            evictionCount++
          }
        }
        
        // Add new product to cache
        updatedCache.set(id, product)
        
        const missEvent: CacheEvent = {
          id: crypto.randomUUID(),
          type: 'miss',
          productId: id,
          productName: product.name,
          timestamp: Date.now(),
        }
        
        const newMetrics = {
          totalRequests: currentState.metrics.totalRequests + 1,
          cacheHits: currentState.metrics.cacheHits,
          cacheMisses: currentState.metrics.cacheMisses + 1,
          evictions: currentState.metrics.evictions + evictionCount,
          hitRate: currentState.metrics.cacheHits / (currentState.metrics.totalRequests + 1),
          missRate: (currentState.metrics.cacheMisses + 1) / (currentState.metrics.totalRequests + 1),
        }
        
        const loading = new Set(currentState.loadingProducts)
        loading.delete(id)
        
        set({
          cache: updatedCache,
          metrics: newMetrics,
          events: [missEvent, ...evictionEvents, ...currentState.events].slice(0, 50),
          loadingProducts: loading,
        })
        
        return product
      },

      addProduct: async (productData) => {
        const state = get()
        const id = `p${Date.now()}`
        const size = Math.floor(Math.random() * 1024) + 512 // Random size between 512-1536 bytes
        
        const product: Product = {
          ...productData,
          id,
          lastAccessed: Date.now(),
          accessCount: 0,
          createdAt: Date.now(),
          size,
        }
        
        // Add to database simulation
        DATABASE_PRODUCTS.push(product)
        
        // Check if we need to evict items
        let updatedCache = new Map(state.cache)
        let evictionCount = 0
        const evictionEvents: CacheEvent[] = []
        
        let currentSize = 0
        updatedCache.forEach(p => currentSize += p.size)
        
        while (currentSize + product.size > MAX_CACHE_SIZE && updatedCache.size > 0) {
          let lruKey = ''
          let lruTime = Infinity
          
          updatedCache.forEach((p, key) => {
            if ((p.lastAccessed || 0) < lruTime) {
              lruTime = p.lastAccessed || 0
              lruKey = key
            }
          })
          
          if (lruKey) {
            const evictedProduct = updatedCache.get(lruKey)!
            evictionEvents.push({
              id: crypto.randomUUID(),
              type: 'eviction',
              productId: lruKey,
              productName: evictedProduct.name,
              timestamp: Date.now(),
            })
            currentSize -= evictedProduct.size
            updatedCache.delete(lruKey)
            evictionCount++
          }
        }
        
        updatedCache.set(id, product)
        
        const addEvent: CacheEvent = {
          id: crypto.randomUUID(),
          type: 'add',
          productId: id,
          productName: product.name,
          timestamp: Date.now(),
        }
        
        set({
          cache: updatedCache,
          metrics: {
            ...state.metrics,
            evictions: state.metrics.evictions + evictionCount,
          },
          events: [addEvent, ...evictionEvents, ...state.events].slice(0, 50),
        })
        
        return product
      },

      updateProduct: async (id, updates) => {
        const state = get()
        const cache = new Map(state.cache)
        
        if (!cache.has(id)) {
          return null
        }
        
        const product = cache.get(id)!
        const updatedProduct = {
          ...product,
          ...updates,
          lastAccessed: Date.now(),
        }
        
        cache.set(id, updatedProduct)
        
        const updateEvent: CacheEvent = {
          id: crypto.randomUUID(),
          type: 'update',
          productId: id,
          productName: updatedProduct.name,
          timestamp: Date.now(),
        }
        
        set({
          cache,
          events: [updateEvent, ...state.events].slice(0, 50),
        })
        
        return updatedProduct
      },

      deleteProduct: (id) => {
        const state = get()
        const cache = new Map(state.cache)
        const product = cache.get(id)
        
        if (product) {
          cache.delete(id)
          
          const deleteEvent: CacheEvent = {
            id: crypto.randomUUID(),
            type: 'delete',
            productId: id,
            productName: product.name,
            timestamp: Date.now(),
          }
          
          set({
            cache,
            events: [deleteEvent, ...state.events].slice(0, 50),
          })
        }
      },

      clearCache: () => {
        set({
          cache: new Map(),
          events: [],
        })
      },

      resetMetrics: () => {
        set({
          metrics: {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            evictions: 0,
            hitRate: 0,
            missRate: 0,
          },
        })
      },

      getCacheSize: () => {
        const state = get()
        let size = 0
        state.cache.forEach(p => size += p.size)
        return size
      },

      getMemoryUsage: () => {
        const state = get()
        let size = 0
        state.cache.forEach(p => size += p.size)
        return size / MAX_CACHE_SIZE
      },

      getCachedProducts: () => {
        const state = get()
        return Array.from(state.cache.values())
      },
    }),
    {
      name: 'cache-store',
      partialize: (state) => ({
        cache: Array.from(state.cache.entries()),
        metrics: state.metrics,
        events: state.events,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as {
          cache: [string, Product][]
          metrics: CacheMetrics
          events: CacheEvent[]
        }
        return {
          ...current,
          cache: new Map(persistedState?.cache || []),
          metrics: persistedState?.metrics || current.metrics,
          events: persistedState?.events || current.events,
        }
      },
    }
  )
)

// Export available database products for UI
export const getAvailableProducts = () => DATABASE_PRODUCTS.map(p => ({ id: p.id, name: p.name }))
export const MAX_MEMORY = MAX_CACHE_SIZE

