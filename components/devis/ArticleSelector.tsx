'use client'

import { useState } from 'react'
import { X, Search, Package, Hammer, Plus, Loader2 } from 'lucide-react'
import { addLineFromArticle } from '@/app/actions/devis'

// On définit le type Article pour TypeScript
type Article = {
    id: string
    name: string
    category: string
    price_ht: number
    unit: string
}

export default function ArticleSelector({
    isOpen,
    onClose,
    articles,
    devisId
}: {
    isOpen: boolean
    onClose: () => void
    articles: Article[]
    devisId: string
}) {
    const [search, setSearch] = useState('')
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // Filtrer les articles en temps réel (Côté client pour la rapidité)
    const filteredArticles = articles.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleSelect = async (articleId: string) => {
        setLoadingId(articleId) // Affiche le petit loader sur la ligne cliquée
        await addLineFromArticle(devisId, articleId)
        setLoadingId(null)
        onClose() // Ferme le modal une fois ajouté
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Fenêtre */}
            <div className="relative flex h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header avec Recherche */}
                <div className="border-b border-white/10 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Sélectionner un ouvrage</h3>
                        <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (ex: Placo, Peinture...)"
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Liste des articles */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredArticles.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">Aucun article trouvé.</p>
                    ) : (
                        <div className="space-y-1">
                            {filteredArticles.map((article) => (
                                <button
                                    key={article.id}
                                    onClick={() => handleSelect(article.id)}
                                    disabled={!!loadingId}
                                    className="group flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-blue-600/10 hover:border-blue-500/20 border border-transparent transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${article.category === 'main_doeuvre' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {article.category === 'main_doeuvre' ? <Hammer size={16} /> : <Package size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-200 group-hover:text-blue-100">{article.name}</p>
                                            <p className="text-xs text-gray-500 group-hover:text-blue-200/50">Unité : {article.unit}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-emerald-400">{article.price_ht} €</span>
                                        {loadingId === article.id ? (
                                            <Loader2 className="animate-spin text-blue-500" size={18} />
                                        ) : (
                                            <Plus className="text-gray-600 group-hover:text-blue-400" size={18} />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
