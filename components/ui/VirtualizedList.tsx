'use client'

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react'

interface VirtualizedListProps {
    items: any[]
    renderItem: (item: any, index: number, style: any, isScrolling?: boolean) => ReactNode
    itemHeight?: number | ((index: number) => number)
    className?: string
    overscanCount?: number
    onEndReached?: () => void
    hasMore?: boolean
    isLoading?: boolean
    useIsScrolling?: boolean
}

const ITEMS_PER_BATCH = 20

export default function VirtualizedList({
    items,
    renderItem,
    className = "",
    onEndReached,
    hasMore = false,
    isLoading = false
}: VirtualizedListProps) {
    // If onEndReached is provided, we assume external pagination
    // Otherwise we fallback to the local batching logic
    const isExternalPagination = !!onEndReached

    const [visibleCount, setVisibleCount] = useState(isExternalPagination ? items.length : ITEMS_PER_BATCH)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isExternalPagination) {
            setVisibleCount(ITEMS_PER_BATCH)
        }
    }, [items, isExternalPagination])

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0]
        if (target.isIntersecting) {
            if (isExternalPagination) {
                if (hasMore && !isLoading && onEndReached) {
                    onEndReached()
                }
            } else {
                setVisibleCount((prev) => Math.min(prev + ITEMS_PER_BATCH, items.length))
            }
        }
    }, [isExternalPagination, hasMore, isLoading, onEndReached, items.length])

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "100px", // Preload a bit before reaching bottom
            threshold: 0.1
        }

        observerRef.current = new IntersectionObserver(handleObserver, option)

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect()
        }
    }, [handleObserver])

    const visibleItems = isExternalPagination ? items : items.slice(0, visibleCount)

    return (
        <div className={`h-full w-full overflow-y-auto ${className}`}>
            {visibleItems.map((item, index) => (
                <div key={index}>
                    {renderItem(item, index, {})}
                </div>
            ))}

            {/* Sentinel for detecting bottom of list */}
            {(hasMore || (!isExternalPagination && visibleCount < items.length)) && (
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4">
                    {isLoading && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    )}
                </div>
            )}
        </div>
    )
}
