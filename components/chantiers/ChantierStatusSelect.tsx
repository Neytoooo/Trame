'use client'

import { useState } from 'react'
import { updateChantierStatus } from '@/app/actions/chantiers'
import { ChevronDown, Loader2 } from 'lucide-react'

export default function ChantierStatusSelect({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [isUpdating, setIsUpdating] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setIsUpdating(true)
        await updateChantierStatus(id, newStatus)
        setIsUpdating(false)
    }

    // Styles dynamiques selon le statut (un peu hacky pour un select natif, mais fonctionnel)
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'en_cours': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'etude': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'termine': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            case 'annule': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-white/5 text-gray-400 border-white/10'
        }
    }

    return (
        <div className="relative inline-block">
            <select
                disabled={isUpdating}
                value={currentStatus}
                onChange={handleChange}
                className={`appearance-none rounded-full border px-4 py-1.5 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 transition-colors cursor-pointer ${getStatusStyle(currentStatus)}`}
            >
                <option value="etude" className="bg-[#1A1A1A] text-blue-400">En étude</option>
                <option value="en_cours" className="bg-[#1A1A1A] text-green-400">En cours</option>
                <option value="termine" className="bg-[#1A1A1A] text-gray-400">Terminé</option>
                <option value="annule" className="bg-[#1A1A1A] text-red-400">Annulé</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70">
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={14} />}
            </div>
        </div>
    )
}
