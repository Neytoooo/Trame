import { useState, useCallback, useEffect, useRef } from 'react'

interface UseInfiniteScrollProps<T> {
  fetchAction: (offset: number, search: string) => Promise<T[]>
  initialData: T[]
  limit?: number
}

export function useInfiniteScroll<T>({ fetchAction, initialData, limit = 10 }: UseInfiniteScrollProps<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [hasMore, setHasMore] = useState(initialData.length >= limit)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(initialData.length)
  const [searchQuery, setSearchQuery] = useState('')
  const isFirstRender = useRef(true)

  // Reload data from server when search query changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const loadSearch = async () => {
      setIsLoading(true)
      try {
        const results = await fetchAction(0, searchQuery)
        setData(results)
        setOffset(results.length)
        setHasMore(results.length >= limit)
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      loadSearch()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchAction, limit])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const newItems = await fetchAction(offset, searchQuery)
      if (newItems.length > 0) {
        setData(prev => {
           // Prevent duplicates if React Strict Mode double invokes or network race conditions
           const existingIds = new Set(prev.map((item: any) => item.id))
           const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item.id))
           return [...prev, ...uniqueNewItems]
        })
        setOffset(prev => prev + newItems.length)
      }
      if (newItems.length < limit) {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more items", error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, fetchAction, offset, searchQuery, limit])

  return {
    data,
    setData, // In case of local deletion/updates
    hasMore,
    isLoading,
    loadMore,
    searchQuery,
    setSearchQuery
  }
}
