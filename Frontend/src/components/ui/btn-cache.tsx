import * as React from "react"
import { memo, useMemo, useCallback, useRef } from "react"
import { Button, ButtonProps, buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * btn-cache - A smart button component with built-in caching
 * 
 * Features:
 * - Prevents unnecessary re-renders using React.memo
 * - Caches button click results
 * - Memoizes onClick handlers
 * - Optional cache key for shared caching
 * 
 * @example
 * ```tsx
 * <BtnCache 
 *   onClick={handleClick} 
 *   variant="default"
 *   cacheKey="my-button"
 * >
 *   Click Me
 * </BtnCache>
 * ```
 */

interface BtnCacheProps extends ButtonProps {
  /**
   * Cache key - if provided, buttons with the same key will share cache
   */
  cacheKey?: string
  
  /**
   * Cache the result of onClick handler
   * If true, the result of onClick will be cached and returned immediately on subsequent clicks
   */
  cacheResult?: boolean
  
  /**
   * Time to live for cached results (in milliseconds)
   * Default: 5000ms (5 seconds)
   */
  cacheTTL?: number
  
  /**
   * Disable caching for this button
   */
  disableCache?: boolean
  
  /**
   * Callback that will be memoized and optionally cached
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
}

// Internal cache for button results
interface CacheEntry {
  result: any
  timestamp: number
  ttl: number
}

const resultCache = new Map<string, CacheEntry>()

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now()
  for (const [key, entry] of resultCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      resultCache.delete(key)
    }
  }
}

/**
 * BtnCache - Cached Button Component
 */
const BtnCacheComponent = React.forwardRef<HTMLButtonElement, BtnCacheProps>(
  ({ 
    cacheKey, 
    cacheResult = false,
    cacheTTL = 5000,
    disableCache = false, 
    onClick, 
    className,
    children,
    variant,
    size,
    disabled,
    ...props 
  }, ref) => {
    
    const buttonRef = useRef<HTMLButtonElement>(null)
    
    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)
    
    // Memoize the onClick handler
    const memoizedOnClick = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!onClick) return
        
        // If caching is disabled, just call onClick
        if (disableCache || !cacheResult || !cacheKey) {
          await onClick(event)
          return
        }
        
        // Check if we have a cached result
        clearExpiredCache()
        const cached = resultCache.get(cacheKey)
        const now = Date.now()
        
        if (cached && (now - cached.timestamp) < cached.ttl) {
          // Return cached result immediately
          console.log(`[btn-cache] Using cached result for key: ${cacheKey}`)
          return cached.result
        }
        
        // Execute onClick and cache the result
        console.log(`[btn-cache] Executing and caching result for key: ${cacheKey}`)
        const result = await onClick(event)
        
        resultCache.set(cacheKey, {
          result,
          timestamp: now,
          ttl: cacheTTL,
        })
        
        return result
      },
      [onClick, disableCache, cacheResult, cacheKey, cacheTTL]
    )

    // Memoize button props to prevent re-renders
    const memoizedProps = useMemo(() => ({
      variant,
      size,
      disabled,
      className: cn(buttonVariants({ variant, size }), className),
    }), [variant, size, disabled, className])

    return (
      <Button
        ref={buttonRef}
        onClick={memoizedOnClick}
        {...memoizedProps}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

BtnCacheComponent.displayName = "BtnCache"

// Memoize the component to prevent re-renders when props haven't changed
export const BtnCache = memo(BtnCacheComponent, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  if (prevProps.disableCache !== nextProps.disableCache) return false
  if (prevProps.cacheKey !== nextProps.cacheKey) return false
  if (prevProps.cacheResult !== nextProps.cacheResult) return false
  if (prevProps.cacheTTL !== nextProps.cacheTTL) return false
  if (prevProps.variant !== nextProps.variant) return false
  if (prevProps.size !== nextProps.size) return false
  if (prevProps.disabled !== nextProps.disabled) return false
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.children !== nextProps.children) return false
  if (prevProps.onClick !== nextProps.onClick) return false
  
  return true // Props are equal, don't re-render
})

/**
 * Hook to clear the button cache
 */
export const useClearBtnCache = () => {
  return useCallback((key?: string) => {
    if (key) {
      resultCache.delete(key)
      console.log(`[btn-cache] Cleared cache for key: ${key}`)
    } else {
      resultCache.clear()
      console.log(`[btn-cache] Cleared all cache`)
    }
  }, [])
}

/**
 * Hook to get cache statistics
 */
export const useBtnCacheStats = () => {
  return useMemo(() => {
    clearExpiredCache()
    return {
      size: resultCache.size,
      keys: Array.from(resultCache.keys()),
      entries: Array.from(resultCache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: (Date.now() - entry.timestamp) > entry.ttl,
      })),
    }
  }, [])
}

export default BtnCache

