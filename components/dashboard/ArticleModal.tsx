'use client'

import { useState, useRef } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createArticle } from '@/app/actions/articles'

export default function ArticleModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        const result = await createArticle(formData)
        setIsLoading(false)

        if (result?.success) {
            setIsOpen(false)
            formRef.current?.reset() // On vide le formulaire
        } else {
            alert("Erreur lors de l'enregistrement")
        }
    }

    return (
        <>
            {/* BOUTON D'OUVERTURE */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105"
            >
                <Plus size={18} />
                Nouvel Article
            </button>

            {/* MODAL (Uniquement si isOpen est true) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                    {/* FOND SOMBRE FLOUTÉ (Backdrop) */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* LA FENÊTRE (Glassmorphism) */}
                    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gray-900/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 p-6">
                            <h2 className="text-xl font-semibold text-white">Ajouter un article</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulaire */}
                        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">

                            {/* Nom */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Désignation</label>
                                <input
                                    name="name" required autoFocus
                                    placeholder="ex: Pose Parquet Chêne"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Catégorie */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Type</label>
                                    <select name="category" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900">
                                        <option value="fourniture">📦 Fourniture</option>
                                        <option value="main_doeuvre">👷 Main d'œuvre</option>
                                        <option value="engin">🚜 Engin</option>
                                        <option value="sous_traitance">🤝 Sous-traitance</option>
                                    </select>
                                </div>

                                {/* Unité */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Unité</label>
                                    <select name="unit" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900">
                                        <option value="u">Unité (u)</option>
                                        <option value="h">Heure (h)</option>
                                        <option value="m2">Mètre carré (m²)</option>
                                        <option value="ml">Mètre linéaire (ml)</option>
                                        <option value="m3">Mètre cube (m³)</option>
                                        <option value="ens">Ensemble (ens)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Prix de Vente */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-emerald-400">Prix Vente HT (€)</label>
                                    <input
                                        name="price_ht" type="number" step="0.01" required
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Coût de Revient */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Coût / Déboursé (€)</label>
                                    <input
                                        name="cost_ht" type="number" step="0.01"
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                                    Enregistrer
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
