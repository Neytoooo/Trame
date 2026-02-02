'use client'

import { useState } from 'react'
import { Search, Filter, Package, Hammer, Truck, MoreVertical, Edit, Trash2 } from 'lucide-react'
import ArticleModal from '@/components/dashboard/ArticleModal'
import ViewToggle from '@/components/ui/ViewToggle'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'

interface ArticleListProps {
    initialArticles: any[]
}

export default function ArticleList({ initialArticles }: ArticleListProps) {
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-articles', 'list')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredArticles = initialArticles.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'main_doeuvre': return <Hammer size={12} />
            case 'fourniture': return <Package size={12} />
            case 'engin': return <Truck size={12} />
            default: return null
        }
    }

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'main_doeuvre': return 'bg-purple-500/10 text-purple-400'
            case 'fourniture': return 'bg-blue-500/10 text-blue-400'
            case 'engin': return 'bg-orange-500/10 text-orange-400'
            default: return 'bg-gray-500/10 text-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (ex: Placo, Peinture, Heure...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10">
                        <Filter size={18} />
                        Filtres
                    </button>

                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Désignation</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Unité</th>
                                <th className="px-6 py-4 font-medium text-right">Prix Vente HT</th>
                                <th className="px-6 py-4 font-medium text-right">Déboursé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredArticles && filteredArticles.length > 0 ? (
                                filteredArticles.map((article) => (
                                    <tr key={article.id} className="transition-colors hover:bg-white/5">
                                        <td className="px-6 py-4 font-medium text-white">{article.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getCategoryStyle(article.category)}`}>
                                                {getCategoryIcon(article.category)}
                                                {article.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{article.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-400">{article.price_ht} €</td>
                                        <td className="px-6 py-4 text-right text-gray-500">{article.cost_ht} €</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <p className="text-gray-500">Aucun article trouvé.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                // GRID VIEW
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredArticles && filteredArticles.length > 0 ? (
                        filteredArticles.map((article) => (
                            <div key={article.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${getCategoryStyle(article.category)}`}>
                                        {getCategoryIcon(article.category)}
                                    </div>
                                    <button className="text-gray-500 hover:text-white transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>

                                <h3 className="text-white font-bold text-lg mb-1">{article.name}</h3>
                                <p className="text-gray-500 text-xs mb-4 uppercase tracking-wider">{article.category} • Par {article.unit}</p>

                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                    <div>
                                        <p className="text-gray-500 text-xs">Prix Vente HT</p>
                                        <p className="text-emerald-400 font-bold text-xl">{article.price_ht} €</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs">Déboursé</p>
                                        <p className="text-gray-400 font-medium">{article.cost_ht} €</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-gray-500">Aucun article trouvé.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
