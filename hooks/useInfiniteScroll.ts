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

  const isLoadingRef = useRef(false)
  const hasMoreRef = useRef(initialData.length >= limit)
  const offsetRef = useRef(initialData.length)

  // Keep refs in sync with state
  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  // Sync initialData if server revalidates
  useEffect(() => {
    setData(initialData)
    setOffset(initialData.length)
    offsetRef.current = initialData.length
    const more = initialData.length >= limit
    setHasMore(more)
    hasMoreRef.current = more
  }, [initialData, limit])

  // Reload data from server when search query changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const loadSearch = async () => {
      isLoadingRef.current = true
      setIsLoading(true)
      try {
        const results = await fetchAction(0, searchQuery)
        setData(results)
        setOffset(results.length)
        offsetRef.current = results.length
        const more = results.length >= limit
        setHasMore(more)
        hasMoreRef.current = more
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        isLoadingRef.current = false
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
    if (isLoadingRef.current || !hasMoreRef.current) return

    isLoadingRef.current = true
    setIsLoading(true)
    try {
      const currentOffset = offsetRef.current
      const newItems = await fetchAction(currentOffset, searchQuery)
      if (newItems.length > 0) {
        setData(prev => {
           // Prevent duplicates if React Strict Mode double invokes or network race conditions
           const existingIds = new Set(prev.map((item: any) => item.id))
           const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item.id))
           return [...prev, ...uniqueNewItems]
        })
        const nextOffset = currentOffset + newItems.length
        offsetRef.current = nextOffset
        setOffset(nextOffset)
      }
      if (newItems.length < limit) {
        hasMoreRef.current = false
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more items", error)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [fetchAction, searchQuery, limit])

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
