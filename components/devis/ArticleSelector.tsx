'use client'

import { useState } from 'react'
import { X, Search, Package, Hammer, Plus } from 'lucide-react'
import VirtualizedList from '@/components/ui/VirtualizedList'

import { BTP_PRESTATIONS_CATALOG } from '@/lib/btpCatalog'

// On définit le type Article pour TypeScript
type Article = {
    id: string
    name: string
    category: string
    price_ht: number
    unit: string
    reference?: string
    tva?: number
    cost_ht?: number
}

export default function ArticleSelector({
    isOpen,
    onClose,
    articles,
    onSelect
}: {
    isOpen: boolean
    onClose: () => void
    articles: Article[]
    onSelect: (article: Article) => void
}) {
    const [search, setSearch] = useState('')

    // Si articles est vide, utiliser le catalogue BTP pro par défaut
    const pool = (articles && articles.length > 0)
        ? articles
        : BTP_PRESTATIONS_CATALOG.map((a, idx) => ({
            id: `btp_cat_${idx}`,
            name: `${a.name}\n${a.complement}`,
            category: a.category,
            unit: a.unit,
            price_ht: a.price_ht,
            reference: a.reference,
            tva: a.tva,
            cost_ht: a.cost_ht
        }))

    // Filtrer les articles en temps réel
    const filteredArticles = pool.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.reference && a.reference.toLowerCase().includes(search.toLowerCase()))
    )

    const handleSelect = (article: Article) => {
        onSelect(article)
        onClose()
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
                <div className="flex-1 min-h-0 bg-gray-900">
                    {filteredArticles.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">Aucun article trouvé.</p>
                    ) : (
                        <VirtualizedList
                            items={filteredArticles}
                            renderItem={(article: Article, index: number) => (
                                <div className="px-2 py-1" key={article.id}>
                                    <button
                                        onClick={() => handleSelect(article)}
                                        className="group flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-blue-600/10 hover:border-blue-500/20 border border-transparent transition-all h-full"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${article.category === 'main_doeuvre' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {article.category === 'main_doeuvre' ? <Hammer size={16} /> : <Package size={16} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {article.reference && (
                                                        <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                            {article.reference}
                                                        </span>
                                                    )}
                                                    <p className="font-medium text-gray-200 group-hover:text-blue-100 truncate">
                                                        {article.name.split('\n')[0]}
                                                    </p>
                                                </div>
                                                {article.name.includes('\n') && (
                                                    <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate italic">
                                                        {article.name.split('\n')[1]}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 group-hover:text-blue-200/50">Unité : {article.unit}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="font-bold text-emerald-400">{article.price_ht} €</span>
                                            <Plus className="text-gray-600 group-hover:text-blue-400" size={18} />
                                        </div>
                                    </button>
                                </div>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>

    )
}
