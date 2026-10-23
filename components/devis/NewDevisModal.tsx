'use client'

import { useState } from 'react'
import { X, Building2, Plus, ArrowRight, Loader2, Search, FileText } from 'lucide-react'
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
            if (e?.message?.includes('NEXT_REDIRECT')) {
                return
            }
            console.error("Erreur création devis:", e)
            setError(e?.message || "Une erreur est survenue.")
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0B101B]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">
                                Nouveau Devis
                            </h3>
                            <p className="text-xs text-slate-400">
                                Associez votre chiffrage à un chantier BTP
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Toggle Existing / New Chantier */}
                    <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('existing')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                                mode === 'existing'
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_2px_14px_rgba(124,58,237,0.4)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            Chantier existant ({chantiers.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('new')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                                mode === 'new'
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_2px_14px_rgba(124,58,237,0.4)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            + Nouveau chantier
                        </button>
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {error}
                        </div>
                    )}

                    {mode === 'existing' ? (
                        <div className="space-y-3">
                            {chantiers.length > 5 && (
                                <div className="relative">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un chantier..."
                                        value={searchChantier}
                                        onChange={(e) => setSearchChantier(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                {filteredChantiers.length > 0 ? (
                                    filteredChantiers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedChantierId(c.id)}
                                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                                                selectedChantierId === c.id
                                                    ? 'border-violet-500/80 bg-violet-600/15 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${selectedChantierId === c.id ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400'}`}>
                                                    <Building2 size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{c.name}</p>
                                                    {c.clientName && (
                                                        <p className="text-[11px] text-slate-400 font-medium">Client : {c.clientName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedChantierId === c.id && (
                                                <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]"></span>
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
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                    Nom du chantier *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Rénovation Façade Copropriété Lamy"
                                    value={newChantierName}
                                    onChange={(e) => setNewChantierName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all font-medium"
                                />
                            </div>

                            {clients.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Client associé (optionnel)
                                    </label>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#0E1526] text-sm text-white outline-none focus:border-violet-500/60 transition-all [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
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
                <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Création en cours...</span>
                            </>
                        ) : (
                            <>
                                <span>Créer & Ouvrir le devis</span>
                                <ArrowRight size={15} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
