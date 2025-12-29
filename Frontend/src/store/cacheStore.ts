import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CacheMetrics, CacheEvent } from '@/types'
import { productAPI } from '@/lib/api'

// Maximum cache size in bytes (simulated 1MB RAM)
const MAX_CACHE_SIZE = 1024 * 1024

// Backend Product type (simplified)
interface BackendProduct {
  id: number
  name: string
  price: string
}

// Categories for random assignment when fetching from backend
const CATEGORIES = ['Electronics', 'Audio', 'Wearables', 'Gaming', 'Accessories']

// Convert backend product to frontend product
const convertBackendProduct = (backendProduct: BackendProduct, cachedData?: Partial<Product>): Product => {
  const price = parseFloat(backendProduct.price) || 0
  const size = cachedData?.size || Math.floor(Math.random() * 1024) + 512 // Random size if not cached
  
  // Generate random stock (10-100) and category if not in cache or if default values
  // This simulates real data since backend doesn't store stock/category
  // If stock is 0 or category is 'General' (default values), regenerate them
  const hasValidStock = cachedData?.stock !== undefined && cachedData.stock > 0
  const hasValidCategory = cachedData?.category !== undefined && cachedData.category !== 'General'
  
  const stock = hasValidStock 
    ? (cachedData.stock as number)
    : Math.floor(Math.random() * 91) + 10 // Random between 10-100
  
  const category = hasValidCategory
    ? (cachedData.category as string)
    : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  
  return {
    id: backendProduct.id.toString(),
    name: backendProduct.name,
    price,
    category,
    stock,
    size,
    lastAccessed: cachedData?.lastAccessed || Date.now(),
    accessCount: cachedData?.accessCount || 0,
    createdAt: cachedData?.createdAt || Date.now(),
  }
}

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
  clearCache: () => Promise<void>
  resetMetrics: () => void
  
  // Computed
  getCacheSize: () => number
  getMemoryUsage: () => number
  getCachedProducts: () => Product[]
  
  // Test function to fill memory and trigger evictions
  fillMemoryForTesting: () => Promise<void>
  
  // Control for stopping the fill process
  isFillingMemory: boolean
  stopFillingMemory: () => void
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
      isFillingMemory: false,
      
      stopFillingMemory: () => {
        set({ isFillingMemory: false })
      },

      getProduct: async (id: string) => {
        const state = get()
        const cache = new Map(state.cache)
        
        // Check if product is in cache
        if (cache.has(id)) {
          // CACHE HIT - instant return
          const product = cache.get(id)!
          
          // If product has invalid stock/category (default values), update them
          let productToUpdate = product
          if (product.stock === 0 || product.category === 'General') {
            productToUpdate = {
              ...product,
              stock: Math.floor(Math.random() * 91) + 10, // Random between 10-100
              category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
            }
          }
          
          const updatedProduct = {
            ...productToUpdate,
            lastAccessed: Date.now(),
            accessCount: productToUpdate.accessCount + 1,
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
        
        // CACHE MISS - fetch from backend API
        set(s => ({
          loadingProducts: new Set(s.loadingProducts).add(id),
        }))
        
        try {
          const productId = parseInt(id)
          if (isNaN(productId)) {
            throw new Error('Invalid product ID')
          }
          
          const response = await productAPI.getById(productId)
          
          if (!response.data) {
            set(s => {
              const loading = new Set(s.loadingProducts)
              loading.delete(id)
              return { loadingProducts: loading }
            })
            return null
          }
          
          const backendProduct = response.data as BackendProduct
          const cachedData = cache.get(id)
          
          // If product exists in cache but has invalid stock/category (default values),
          // update it with new random values to simulate real data
          let productToUse = cachedData
          if (cachedData && (cachedData.stock === 0 || cachedData.category === 'General')) {
            // Product exists but has default values, update it
            productToUse = {
              ...cachedData,
              stock: Math.floor(Math.random() * 91) + 10, // Random between 10-100
              category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
            }
          }
          
          const product = convertBackendProduct(backendProduct, productToUse)
          
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
        } catch (error) {
          console.error('Error fetching product:', error)
          set(s => {
            const loading = new Set(s.loadingProducts)
            loading.delete(id)
            return { loadingProducts: loading }
          })
          return null
        }
      },

      addProduct: async (productData) => {
        try {
          const response = await productAPI.create({
            name: productData.name,
            price: productData.price.toString(),
          })
          
          if (!response.data) {
            throw new Error('Failed to create product')
          }
          
          const backendProduct = response.data as BackendProduct
          const state = get()
          const id = backendProduct.id.toString()
          const size = Math.floor(Math.random() * 1024) + 512 // Random size between 512-1536 bytes
          
          const product: Product = {
            id,
            name: backendProduct.name,
            price: parseFloat(backendProduct.price) || productData.price,
            category: productData.category || 'General',
            stock: productData.stock || 0,
            lastAccessed: Date.now(),
            accessCount: 0,
            createdAt: Date.now(),
            size,
          }
          
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
        } catch (error) {
          console.error('Error adding product:', error)
          throw error
        }
      },

      updateProduct: async (id, updates) => {
        const state = get()
        const cache = new Map(state.cache)
        
        if (!cache.has(id)) {
          return null
        }
        
        const product = cache.get(id)!
        
        try {
          const productId = parseInt(id)
          if (isNaN(productId)) {
            throw new Error('Invalid product ID')
          }
          
          const response = await productAPI.update({
            id: productId,
            name: updates.name || product.name,
            price: (updates.price || product.price).toString(),
          })
          
          if (!response.data) {
            throw new Error('Failed to update product')
          }
          
          const backendProduct = response.data as BackendProduct
          const updatedProduct = {
            ...product,
            name: backendProduct.name,
            price: parseFloat(backendProduct.price) || product.price,
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
        } catch (error) {
          console.error('Error updating product:', error)
          // Still update locally even if API fails
          const updatedProduct = {
            ...product,
            ...updates,
            lastAccessed: Date.now(),
          }
          cache.set(id, updatedProduct)
          set({ cache })
          return updatedProduct
        }
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

      clearCache: async () => {
        const currentState = get()
        // Clear cache, events, AND reset metrics
        // This makes sense because if cache is empty, metrics should be reset too
        set({
          ...currentState,
          cache: new Map(),
          events: [],
          metrics: {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            evictions: 0,
            hitRate: 0,
            missRate: 0,
          },
        })
        // Reload available products from backend after clearing cache
        // This ensures "Fetch from Backend" section shows products
        await loadAllProducts()
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

      fillMemoryForTesting: async () => {
        // Set flag to start filling
        set({ isFillingMemory: true })
        
        const state = get()
        const currentSize = state.getCacheSize()
        const availableSpace = MAX_CACHE_SIZE - currentSize
        
        console.log(`[Test] Starting memory fill: Current size: ${currentSize} bytes, Available: ${availableSpace} bytes`)
        
        const evictionsBefore = state.metrics.evictions
        let productsAdded = 0
        let iterations = 0
        const maxIterations = 2000 // Safety limit
        
        // Fill memory until we reach ~99.5% (leave small margin) or stop flag is set
        while (get().isFillingMemory && iterations < maxIterations) {
          iterations++
          
          // Check current state
          const currentState = get()
          const currentCacheSize = currentState.getCacheSize()
          const usagePercent = (currentCacheSize / MAX_CACHE_SIZE) * 100
          
          // Stop if we're at 99.5% or more (leave small margin to avoid going over)
          if (usagePercent >= 99.5) {
            console.log(`[Test] Memory reached ${usagePercent.toFixed(1)}% - stopping`)
            break
          }
          
          // Check if stop was requested
          if (!currentState.isFillingMemory) {
            console.log(`[Test] Stop requested - stopping at ${usagePercent.toFixed(1)}%`)
            break
          }
          
          try {
            // Create product with random size
            const productSize = Math.floor(Math.random() * 600) + 600 // 600-1200 bytes
            const testId = `test-${Date.now()}-${iterations}`
            
            const simulatedProduct: Product = {
              id: testId,
              name: `Test Product ${iterations}`,
              price: Math.floor(Math.random() * 1000) + 10,
              category: ['Electronics', 'Audio', 'Wearables', 'Gaming', 'Accessories'][Math.floor(Math.random() * 5)],
              stock: Math.floor(Math.random() * 100) + 1,
              lastAccessed: Date.now(),
              accessCount: 0,
              createdAt: Date.now(),
              size: productSize,
            }
            
            // Add to cache with eviction logic
            let updatedCache = new Map(currentState.cache)
            let evictionCount = 0
            const evictionEvents: CacheEvent[] = []
            
            let cacheSizeBeforeAdd = 0
            updatedCache.forEach(p => cacheSizeBeforeAdd += p.size)
            
            // Evict LRU items if needed (only if adding would exceed limit)
            while (cacheSizeBeforeAdd + simulatedProduct.size > MAX_CACHE_SIZE && updatedCache.size > 0) {
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
                cacheSizeBeforeAdd -= evictedProduct.size
                updatedCache.delete(lruKey)
                evictionCount++
              } else {
                break // Safety break
              }
            }
            
            // Add new product only if we have space
            if (cacheSizeBeforeAdd + simulatedProduct.size <= MAX_CACHE_SIZE) {
              updatedCache.set(testId, simulatedProduct)
              productsAdded++
              
              const addEvent: CacheEvent = {
                id: crypto.randomUUID(),
                type: 'add',
                productId: testId,
                productName: simulatedProduct.name,
                timestamp: Date.now(),
              }
              
              set({
                cache: updatedCache,
                metrics: {
                  ...currentState.metrics,
                  evictions: currentState.metrics.evictions + evictionCount,
                },
                events: [addEvent, ...evictionEvents, ...currentState.events].slice(0, 50),
              })
            } else {
              // No space, stop
              console.log(`[Test] No space to add product - stopping`)
              break
            }
            
            // Small delay every 10 products to allow UI updates
            if (productsAdded % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          } catch (error) {
            console.error(`[Test] Error adding product:`, error)
            // Continue with next iteration
          }
        }
        
        // Stop the process
        set({ isFillingMemory: false })
        
        const finalState = get()
        const evictionsAfter = finalState.metrics.evictions
        const evictionsTriggered = evictionsAfter - evictionsBefore
        const finalSize = finalState.getCacheSize()
        const finalUsage = (finalSize / MAX_CACHE_SIZE) * 100
        
        console.log(`[Test] Memory fill complete!`)
        console.log(`[Test] Products added: ${productsAdded}`)
        console.log(`[Test] Evictions triggered: ${evictionsTriggered}`)
        console.log(`[Test] Final cache size: ${finalSize} bytes (${finalUsage.toFixed(1)}%)`)
        console.log(`[Test] Total evictions now: ${evictionsAfter}`)
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
// This will be populated from the backend when getAllProducts is called
let availableProductsCache: Array<{ id: string; name: string }> = []

export const getAvailableProducts = () => availableProductsCache
export const MAX_MEMORY = MAX_CACHE_SIZE

// Function to load all products from backend
// This uses the backend's cache-aside strategy - if cache is empty, it fetches from DB
export const loadAllProducts = async () => {
  try {
    console.log('Loading products from backend...')
    const response = await productAPI.getAll()
    console.log('Backend response:', response)
    
    // Backend returns { code: 200, message: "success", data: [...] }
    if (response && response.code === 200) {
      // Handle both direct array and nested data structure
      let backendProducts: BackendProduct[] = []
      
      if (Array.isArray(response.data)) {
        backendProducts = response.data as BackendProduct[]
      } else if (response.data && typeof response.data === 'object') {
        // Sometimes data might be wrapped
        const data = response.data as any
        if (Array.isArray(data)) {
          backendProducts = data
        }
      }
      
      console.log(`Loaded ${backendProducts.length} products from backend`)
      
      availableProductsCache = backendProducts.map((p) => ({
        id: p.id.toString(),
        name: p.name,
      }))
      
      // Dispatch a custom event to notify components that availableProductsCache has changed
      // This allows ProductTable to update and show "Fetch from Backend" section
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('availableProductsUpdated'))
      }
      
      // DO NOT automatically populate local cache
      // This allows "Fetch from Backend" section to show products
      // Products will be loaded into cache only when explicitly fetched via getProduct()
      // This demonstrates Cache-Aside pattern: load on demand, not pre-load
      
      // If no products, log it
      if (backendProducts.length === 0) {
        console.log('No products found in database. Create some products using the "Add Product" button.')
      }
      
      return backendProducts.length
    } else {
      console.warn('Invalid response from backend:', response)
      return 0
    }
  } catch (error) {
    console.error('Error loading products from backend:', error)
    return 0
  }
}

