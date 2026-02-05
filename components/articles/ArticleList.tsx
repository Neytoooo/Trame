'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, Filter, Package, Hammer, Truck, MoreVertical } from 'lucide-react'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import ViewToggle from '@/components/ui/ViewToggle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'


interface ArticleListProps {
    initialArticles: any[]
}

export default function ArticleList({ initialArticles }: ArticleListProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-articles', 'list')
    const [articles, setArticles] = useState(initialArticles)
    const [searchTerm, setSearchTerm] = useState('')

    // REALTIME SUBSCRIPTION
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-articles-library')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
                console.log('📚 [LIBRARY REALTIME]', payload)
                if (payload.eventType === 'INSERT') {
                    setArticles(prev => [payload.new, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setArticles(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
                } else if (payload.eventType === 'DELETE') {
                    setArticles(prev => prev.filter(a => a.id !== payload.old.id))
                }
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    const filteredArticles = articles.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.reference && article.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.supplier && article.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'main_doeuvre': return <Hammer size={12} />
            case 'fourniture': return <Package size={12} />
            case 'engin': return <Truck size={12} />
            default: return null
        }
    }

    const getBadgeVariant = (category: string) => {
        switch (category) {
            case 'main_doeuvre': return 'purple'
            case 'fourniture': return 'info'
            case 'engin': return 'orange'
            default: return 'gray'
        }
    }

    return (
        <div className="space-y-6">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (ex: Placo, Peinture, Heure...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-blue-500/50 dark:focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10">
                        <Filter size={18} />
                        Filtres
                    </Button>

                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Réf</th>
                                <th className="px-6 py-4 font-medium">Désignation</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Unité</th>
                                <th className="px-6 py-4 font-medium text-right">Stock</th>
                                <th className="px-6 py-4 font-medium text-right">Prix Vente HT</th>
                                <th className="px-6 py-4 font-medium text-right">Déboursé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredArticles && filteredArticles.length > 0 ? (
                                filteredArticles.map((article) => (
                                    <tr key={article.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                                            {article.reference || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {article.name}
                                            {article.supplier && <div className="text-xs text-gray-500">{article.supplier}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getBadgeVariant(article.category) as any}>
                                                {getCategoryIcon(article.category)}
                                                {article.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">{article.unit}</td>
                                        <td className="px-6 py-4 text-right">
                                            {article.category === 'fourniture' ? (
                                                <span className={`font-bold ${article.stock <= (article.min_stock || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {article.stock || 0}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                            {article.price_ht} €
                                            <span className="ml-1 text-[10px] text-gray-500 font-normal">({article.tva || 20}%)</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">{article.cost_ht} €</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Aucun article trouvé.</p>
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
                            <Card key={article.id} className="group relative overflow-hidden transition-all bg-white border-gray-200 hover:border-blue-200 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:shadow-black/20">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={getBadgeVariant(article.category) as any}>
                                            {getCategoryIcon(article.category)}
                                        </Badge>
                                        <span className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-white cursor-pointer">
                                            <MoreVertical size={16} />
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg text-gray-900 dark:text-white">{article.name}</CardTitle>
                                    <CardDescription className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{article.category} • Par {article.unit}</CardDescription>
                                </CardHeader>

                                <CardContent className="pb-2">
                                    {article.category === 'fourniture' && (
                                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 dark:bg-white/5 dark:border-white/5">
                                            <span className="text-gray-600 dark:text-gray-400">Stock : <span className={`font-bold ${article.stock <= (article.min_stock || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{article.stock || 0}</span></span>
                                            <span className="text-gray-500">{article.supplier || 'Sans fournisseur'}</span>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="flex justify-between items-end border-t border-gray-100 pt-4 dark:border-white/5">
                                    <div>
                                        <p className="text-gray-500 text-xs dark:text-gray-500">Prix Vente HT</p>
                                        <p className="text-emerald-600 font-bold text-xl dark:text-emerald-400">{article.price_ht} €</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs dark:text-gray-500">Déboursé</p>
                                        <p className="text-gray-600 font-medium dark:text-gray-400">{article.cost_ht} €</p>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Aucun article trouvé.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
