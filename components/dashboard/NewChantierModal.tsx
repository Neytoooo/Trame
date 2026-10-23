'use client'

import { useState } from 'react'
import { Plus, X, Loader2, MapPin, User, Calendar, HardHat, CheckCircle2 } from 'lucide-react'
import { createChantier } from '@/app/actions/chantiers'
import PillButton from '@/components/ui/PillButton'

type ClientLight = { id: string, name: string }

export default function NewChantierModal({ clients }: { clients: ClientLight[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        const res = await createChantier(formData)
        setIsLoading(false)
        if (res?.success) setIsOpen(false)
    }

    return (
        <>
            <PillButton
                onClick={() => setIsOpen(true)}
                icon={<Plus size={14} />}
            >
                Nouveau Chantier
            </PillButton>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0B101B]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                                    <HardHat size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Démarrer un chantier</h2>
                                    <p className="text-xs text-slate-400">Création d&apos;un dossier et planification des travaux</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-4">

                            {/* Nom du chantier */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Nom du projet
                                </label>
                                <input
                                    name="name"
                                    required
                                    placeholder="ex: Rénovation SDB & Cuisine - Mr Dupont"
                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-medium"
                                />
                            </div>

                            {/* Sélection du Client */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    <User size={13} className="text-violet-400" />
                                    Client associé
                                </label>
                                <select
                                    name="client_id"
                                    required
                                    className="w-full rounded-2xl border border-white/10 bg-[#0E1526] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Adresse et Statut */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        <MapPin size={13} className="text-violet-400" />
                                        Lieu / Adresse
                                    </label>
                                    <input
                                        name="address"
                                        placeholder="Ville ou adresse"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Statut initial
                                    </label>
                                    <select
                                        name="status"
                                        className="w-full rounded-2xl border border-white/10 bg-[#0E1526] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
                                    >
                                        <option value="etude">En étude</option>
                                        <option value="en_cours">En cours</option>
                                        <option value="livre">Livré / Terminé</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    <Calendar size={13} className="text-violet-400" />
                                    Date de début prévisionnelle
                                </label>
                                <input
                                    name="date_debut"
                                    type="date"
                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark] font-medium"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                                    <span>Créer le dossier</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
