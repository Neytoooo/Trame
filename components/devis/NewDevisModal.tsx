'use client'

import { useState } from 'react'
import { X, Building2, Plus, ArrowRight, Loader2, Search } from 'lucide-react'
import { createEmptyDevis, createQuickChantierAndDevis } from '@/app/actions/devis'

interface ChantierOption {
    id: string
    name: string
    clientName?: string
}

interface ClientOption {
    id: string
    name: string
}

interface Props {
    isOpen: boolean
    onClose: () => void
    chantiers: ChantierOption[]
    clients?: ClientOption[]
}

export default function NewDevisModal({ isOpen, onClose, chantiers, clients = [] }: Props) {
    const [mode, setMode] = useState<'existing' | 'new'>(chantiers.length > 0 ? 'existing' : 'new')
    const [selectedChantierId, setSelectedChantierId] = useState<string>(chantiers[0]?.id || '')
    const [searchChantier, setSearchChantier] = useState('')
    const [newChantierName, setNewChantierName] = useState('')
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const filteredChantiers = chantiers.filter(c =>
        c.name.toLowerCase().includes(searchChantier.toLowerCase()) ||
        (c.clientName && c.clientName.toLowerCase().includes(searchChantier.toLowerCase()))
    )

    const handleCreate = async () => {
        setLoading(true)
        setError(null)
        try {
            if (mode === 'existing') {
                if (!selectedChantierId) {
                    setError("Veuillez sélectionner un chantier existant.")
                    setLoading(false)
                    return
                }
                const res = await createEmptyDevis(selectedChantierId)
                if (res?.error) {
                    setError(res.error)
                    setLoading(false)
                }
            } else {
                if (!newChantierName.trim()) {
                    setError("Veuillez renseigner le nom du nouveau chantier.")
                    setLoading(false)
                    return
                }
                const res = await createQuickChantierAndDevis(newChantierName, selectedClientId || null)
                if (res?.error) {
                    setError(res.error)
                    setLoading(false)
                }
            }
        } catch (e: any) {
            // redirect() throws an internal NEXT_REDIRECT error in Server Actions which Next handles
            if (e?.message?.includes('NEXT_REDIRECT')) {
                return
            }
            console.error("Erreur création devis:", e)
            setError(e?.message || "Une erreur est survenue.")
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Plus size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                Créer un nouveau devis
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Associez votre chiffrage à un chantier BTP
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Toggle Existing / New Chantier */}
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900/60 p-1 border border-slate-200/60 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setMode('existing')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${mode === 'existing' ? 'bg-white dark:bg-[#162032] text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Chantier existant ({chantiers.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('new')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${mode === 'new' ? 'bg-white dark:bg-[#162032] text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            + Nouveau chantier
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                            {error}
                        </div>
                    )}

                    {mode === 'existing' ? (
                        <div className="space-y-3">
                            {chantiers.length > 5 && (
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un chantier..."
                                        value={searchChantier}
                                        onChange={(e) => setSearchChantier(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {filteredChantiers.length > 0 ? (
                                    filteredChantiers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedChantierId(c.id)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedChantierId === c.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500' : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Building2 size={16} className={selectedChantierId === c.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</p>
                                                    {c.clientName && (
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Client : {c.clientName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedChantierId === c.id && (
                                                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-xs text-slate-400">
                                        Aucun chantier trouvé. Créez-en un nouveau ci-dessus.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Nom du chantier *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Rénovation Façade Copropriété Lamy"
                                    value={newChantierName}
                                    onChange={(e) => setNewChantierName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>

                            {clients.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Client associé (optionnel)
                                    </label>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1524] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            <>
                                Créer & Ouvrir le devis
                                <ArrowRight size={13} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
