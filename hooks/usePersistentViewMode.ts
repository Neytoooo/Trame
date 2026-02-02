'use client'

import { useState, useEffect } from 'react'

type ViewMode = 'list' | 'grid'

export function usePersistentViewMode(key: string, defaultMode: ViewMode = 'grid') {
    // Initialize with defaultMode to ensure server-side matches client-side initial render
    const [viewMode, setViewMode] = useState<ViewMode>(defaultMode)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        // Only run on client
        const savedMode = localStorage.getItem(key) as ViewMode
        if (savedMode && (savedMode === 'list' || savedMode === 'grid')) {
            setViewMode(savedMode)
        }
        setIsHydrated(true)
    }, [key])

    const setMode = (mode: ViewMode) => {
        setViewMode(mode)
        localStorage.setItem(key, mode)
    }

    // Optional: Return isHydrated if components need to wait for hydration to avoid flicker
    // For now, defaulting to defaultMode is fine, it might just flip after mount.
    return [viewMode, setMode] as const
}
