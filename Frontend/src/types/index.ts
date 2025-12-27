export interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  lastAccessed?: number
  accessCount: number
  createdAt: number
  size: number // simulated memory size in bytes
}

export interface CacheMetrics {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  evictions: number
  hitRate: number
  missRate: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  company?: string
  website?: string
  joinedAt: number
  lastActive?: number
}

export type CacheEventType = 'hit' | 'miss' | 'eviction' | 'add' | 'update' | 'delete'

export interface CacheEvent {
  id: string
  type: CacheEventType
  productId: string
  productName: string
  timestamp: number
}

