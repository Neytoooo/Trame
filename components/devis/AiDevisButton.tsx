'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AiDevisModal from './AiDevisModal'

export default function AiDevisButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
                <Sparkles size={18} />
                Générer via IA
            </button>

            {isOpen && <AiDevisModal onClose={() => setIsOpen(false)} />}
        </>
    )
}
