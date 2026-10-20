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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'en_cours':
                return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            case 'etude':
                return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
            case 'termine':
                return 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            case 'annule':
                return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        }
    }

    return (
        <div className="relative inline-block">
            <select
                disabled={isUpdating}
                value={currentStatus}
                onChange={handleChange}
                className={`appearance-none rounded-full border px-3.5 py-1 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-colors cursor-pointer select-none ${getStatusStyle(currentStatus)}`}
            >
                <option value="etude" className="bg-white dark:bg-[#131B2A] text-slate-900 dark:text-white">En étude</option>
                <option value="en_cours" className="bg-white dark:bg-[#131B2A] text-slate-900 dark:text-white">En cours</option>
                <option value="termine" className="bg-white dark:bg-[#131B2A] text-slate-900 dark:text-white">Terminé</option>
                <option value="annule" className="bg-white dark:bg-[#131B2A] text-slate-900 dark:text-white">Annulé</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70">
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={13} />}
            </div>
        </div>
    )
}
