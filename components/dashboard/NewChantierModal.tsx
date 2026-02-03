'use client'

import { useState } from 'react'
import { Plus, X, Loader2, MapPin, User, Calendar } from 'lucide-react'
import { createChantier } from '@/app/actions/chantiers'

// On définit à quoi ressemble un client pour TypeScript
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
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all"
            >
                <Plus size={18} />
                Nouveau Chantier
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-gray-900/95">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-white/10">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Démarrer un chantier</h2>
                            <button onClick={() => setIsOpen(false)}><X className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-5">

                            {/* Nom du chantier */}
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom du projet</label>
                                <input name="name" required placeholder="ex: Rénovation SDB - Mr Dupont"
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                            </div>

                            {/* Sélection du Client (Crucial) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <User size={14} /> Client
                                </label>
                                <select name="client_id" required className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none [&>option]:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:[&>option]:bg-gray-900">
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Adresse et Statut */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <MapPin size={14} /> Lieu
                                    </label>
                                    <input name="address" placeholder="Ville ou adresse"
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">État</label>
                                    <select name="status" className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none [&>option]:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:[&>option]:bg-gray-900">
                                        <option value="etude">En étude</option>
                                        <option value="en_cours">En cours</option>
                                        <option value="livre">Livré / Terminé</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Calendar size={14} /> Date de début
                                </label>
                                <input name="date_debut" type="date"
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none [color-scheme:light] dark:[color-scheme:dark] dark:border-white/10 dark:bg-white/5 dark:text-white" />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                                    {isLoading && <Loader2 className="animate-spin" size={16} />} Créer le dossier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}