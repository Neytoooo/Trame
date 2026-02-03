'use client'

import { LayoutGrid, List } from 'lucide-react'

interface ViewToggleProps {
    viewMode: 'list' | 'grid'
    onChange: (mode: 'list' | 'grid') => void
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 dark:bg-white/5 dark:border-white/10">
            <button
                onClick={() => onChange('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
                title="Vue Liste"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => onChange('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
                title="Vue Grille"
            >
                <LayoutGrid size={16} />
            </button>
        </div>
    )
}
