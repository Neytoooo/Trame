'use client'

import { LayoutGrid, List } from 'lucide-react'

interface ViewToggleProps {
    viewMode: 'list' | 'grid'
    onChange: (mode: 'list' | 'grid') => void
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
    return (
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
                onClick={() => onChange('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Vue Liste"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => onChange('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Vue Grille"
            >
                <LayoutGrid size={16} />
            </button>
        </div>
    )
}
