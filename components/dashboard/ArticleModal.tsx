'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Loader2, Search, Trash2, Box, Layers } from 'lucide-react'
import { createArticle, searchArticles } from '@/app/actions/articles'

export default function ArticleModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [type, setType] = useState<'simple' | 'ouvrage'>('simple')

    // Ouvrage state
    const [composants, setComposants] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [calculatedCost, setCalculatedCost] = useState(0)

    // Controlled cost input to avoid React error
    const [cost, setCost] = useState('')

    const formRef = useRef<HTMLFormElement>(null)

    // Calcul du coût automatique
    useEffect(() => {
        if (type === 'ouvrage') {
            const total = composants.reduce((acc, item) => acc + (item.quantity * item.cost_ht), 0)
            setCalculatedCost(total)
            setCost(total.toFixed(2))
        } else {
            // Reset cost when switching to simple if needed, or keep it.
            // Better to clear if switching FROM ouvrage, but user might want to keep manual entry.
            // We'll leave it as is, user can edit.
        }
    }, [composants, type])

    // Recherche d'articles
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                const results = await searchArticles(searchTerm)
                setSearchResults(results)
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)

        if (type === 'ouvrage') {
            const composantsData = composants.map(c => ({
                child_article_id: c.id,
                quantity: c.quantity
            }))
            formData.append('composants', JSON.stringify(composantsData))
            formData.set('cost_ht', calculatedCost.toFixed(2))
        }

        const result = await createArticle(formData)
        setIsLoading(false)

        if (result?.success) {
            setIsOpen(false)
            setComposants([])
            setSearchTerm('')
            formRef.current?.reset()
        } else {
            alert("Erreur lors de l'enregistrement")
        }
    }

    const addComposant = (article: any) => {
        if (composants.some(c => c.id === article.id)) return
        setComposants([...composants, { ...article, quantity: 1 }])
        setSearchTerm('')
        setSearchResults([])
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105"
            >
                <Plus size={18} />
                Nouvel Article
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 p-6">
                            <h2 className="text-xl font-semibold text-white">Ajouter un article</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-white/10">
                            <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
                                <button
                                    onClick={() => setType('simple')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'simple' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Box size={16} /> Article Simple
                                </button>
                                <button
                                    onClick={() => setType('ouvrage')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'ouvrage' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Layers size={16} /> Ouvrage Composé
                                </button>
                            </div>
                        </div>

                        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Référence</label>
                                    <input
                                        name="reference"
                                        placeholder="ex: REF-001"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Désignation</label>
                                    <input
                                        name="name" required autoFocus
                                        placeholder="ex: Pose Parquet Chêne"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Type</label>
                                    <select name="category" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900">
                                        <option value="fourniture">📦 Fourniture</option>
                                        <option value="main_doeuvre">👷 Main d'œuvre</option>
                                        <option value="engin">🚜 Engin</option>
                                        <option value="sous_traitance">🤝 Sous-traitance</option>
                                        <option value="ouvrage">🏗️ Ouvrage</option>
                                    </select>
                                </div>

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

                            {/* SECTION OUVRAGE */}
                            {type === 'ouvrage' && (
                                <div className="space-y-4 border border-blue-500/20 bg-blue-500/5 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-blue-300">Composition de l'ouvrage</h3>

                                    <div className="relative">
                                        <div className="flex items-center gap-2 border border-white/10 bg-black/20 rounded-xl px-3 py-2">
                                            <Search size={16} className="text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher un composant..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                                            />
                                        </div>

                                        {/* Resultats recherche */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                                                {searchResults.map(result => (
                                                    <button
                                                        key={result.id}
                                                        type="button"
                                                        onClick={() => addComposant(result)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
                                                    >
                                                        {result.name} ({result.cost_ht} €)
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Liste composants ajoutés */}
                                    <div className="space-y-2">
                                        {composants.map((comp, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                <span className="flex-1 text-sm text-white truncate">{comp.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={comp.quantity}
                                                        onChange={(e) => {
                                                            const newComps = [...composants]
                                                            newComps[idx].quantity = parseFloat(e.target.value) || 0
                                                            setComposants(newComps)
                                                        }}
                                                        className="w-16 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right"
                                                    />
                                                    <span className="text-xs text-gray-400">{comp.unit}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newComps = [...composants]
                                                        newComps.splice(idx, 1)
                                                        setComposants(newComps)
                                                    }}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-right text-sm text-gray-400">
                                        Coût estimé : <span className="text-blue-300 font-bold">{calculatedCost.toFixed(2)} €</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-emerald-400">Prix Vente HT (€)</label>
                                    <input
                                        name="price_ht" type="number" step="0.01" required
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">TVA (%)</label>
                                    <select name="tva" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900">
                                        <option value="20">20%</option>
                                        <option value="10">10%</option>
                                        <option value="5.5">5.5%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-400">Coût / Déboursé (€)</label>
                                    <input
                                        name="cost_ht" type="number" step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        readOnly={type === 'ouvrage'}
                                        placeholder="0.00"
                                        className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none ${type === 'ouvrage' ? 'cursor-not-allowed opacity-70' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                                    />
                                </div>
                            </div>

                            {/* SECTION STOCK (Uniquement pour fournitures) */}
                            {type === 'simple' && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <h3 className="text-sm font-semibold text-gray-300">Gestion de Stock (Optionnel)</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-400">Stock Actuel</label>
                                            <input
                                                name="stock" type="number" step="1"
                                                placeholder="0"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-400">Seuil Alerte</label>
                                            <input
                                                name="min_stock" type="number" step="1"
                                                placeholder="0"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-400">Fournisseur</label>
                                            <input
                                                name="supplier" type="text"
                                                placeholder="Nom fournisseur"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

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
