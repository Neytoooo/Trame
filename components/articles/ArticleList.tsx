'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, Filter, Package, Hammer, Truck, MoreVertical } from 'lucide-react'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import ViewToggle from '@/components/ui/ViewToggle'
import { Badge } from '@/components/ui/Badge'
import TradeBadge from '@/components/ui/TradeBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import VirtualizedList from '@/components/ui/VirtualizedList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchArticlesAction } from '@/app/actions/articles'


interface ArticleListProps {
    initialArticles: any[]
}

export default function ArticleList({ initialArticles }: ArticleListProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-articles', 'list')

    const {
        data: articles,
        setData: setArticles,
        hasMore,
        isLoading,
        loadMore,
        searchQuery,
        setSearchQuery
    } = useInfiniteScroll({
        fetchAction: fetchArticlesAction,
        initialData: initialArticles,
        limit: 10
    })

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
                    setArticles(prev => prev.map((a: any) => a.id === payload.new.id ? payload.new : a))
                } else if (payload.eventType === 'DELETE') {
                    setArticles(prev => prev.filter((a: any) => a.id !== payload.old.id))
                }
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, setArticles])

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

    const [selectedMetier, setSelectedMetier] = useState('TOUS')
    const METIERS = ['TOUS', 'RAVALEMENT', 'ÉCHAFAUDAGE', 'PRÉPARATION', 'COUVERTURE', 'MENUISERIE']

    const filteredArticles = articles.filter((a: any) => {
        if (selectedMetier === 'TOUS') return true
        const matchSupplier = a.supplier?.toUpperCase().includes(selectedMetier)
        const matchName = a.name?.toUpperCase().includes(selectedMetier)
        return matchSupplier || matchName
    })

    // LIST RENDERER
    const renderListRow = (article: any, index: number, style: any, isScrolling?: boolean) => {
        const nameParts = (article.name || '').split('\n')
        const designation = nameParts[0] || 'Sans nom'
        const complement = nameParts[1] || ''
        const priceHT = Number(article.price_ht) || 0
        const ttc10 = (priceHT * 1.10).toFixed(2)
        const ttc20 = (priceHT * 1.20).toFixed(2)

        return (
            <div style={style}>
                {isScrolling ? (
                    <div className="border-b border-gray-100 dark:border-white/5 flex items-center px-6 py-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-white/10"></div>
                    </div>
                ) : (
                    <div className="border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center px-6 h-full text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-24 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 truncate pr-2">
                            {article.reference || 'REF-N/A'}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">{designation}</div>
                            {complement && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate italic">
                                    {complement}
                                </div>
                            )}
                        </div>
                        <div className="w-80 shrink-0 pr-4 flex items-center">
                            <TradeBadge trade={article.supplier || article.category} />
                        </div>
                        <div className="w-16 text-center font-mono text-xs">{article.unit || 'u'}</div>
                        <div className="w-24 text-right font-medium text-gray-900 dark:text-white">
                            {priceHT.toFixed(2)} €
                        </div>
                        <div className="w-24 text-right font-semibold text-blue-600 dark:text-blue-400">
                            {ttc10} €
                        </div>
                        <div className="w-24 text-right text-gray-500 dark:text-gray-400 text-xs">
                            {ttc20} €
                        </div>
                        <div className="w-24 text-right text-xs font-mono text-gray-400 dark:text-gray-500">
                            {Number(article.cost_ht || 0).toFixed(2)} €
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Barre de recherche et filtres (Fixed) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#131B2A] backdrop-blur-md mb-3 shrink-0">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher référence, ouvrage, prestation (ex: RAV D2, Échafaudage...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Onglets Filtres Métier BTP (Style Batiecom) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 shrink-0 no-scrollbar">
                {METIERS.map(m => (
                    <button
                        key={m}
                        onClick={() => setSelectedMetier(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            selectedMetier === m
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#131B2A] dark:text-slate-300 dark:border dark:border-slate-800 dark:hover:bg-[#1A2438]'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-[#131B2A]">
                {viewMode === 'list' ? (
                    <div className="flex flex-col h-full overflow-x-auto">
                        <div className="min-w-[1250px] flex flex-col h-full">
                            {/* Static Header */}
                            <div className="flex items-center bg-slate-50 text-xs uppercase text-slate-500 dark:bg-[#0E1524] dark:text-slate-400 py-3.5 px-6 font-semibold border-b border-slate-200 dark:border-slate-800 shrink-0">
                                <div className="w-24 pr-2">Réf.</div>
                                <div className="flex-1">Désignation & Complément</div>
                                <div className="w-80 shrink-0 pr-4">Famille / Métier</div>
                                <div className="w-16 text-center">Unité</div>
                                <div className="w-24 text-right">P.V. HT</div>
                                <div className="w-24 text-right text-blue-600 dark:text-blue-400">TTC 10%</div>
                                <div className="w-24 text-right">TTC 20%</div>
                                <div className="w-24 text-right">Déboursé</div>
                            </div>
                        {/* Virtual List */}
                        <div className="flex-1">
                            {filteredArticles && (filteredArticles.length > 0 || isLoading) ? (
                                <VirtualizedList
                                    items={filteredArticles}
                                    renderItem={renderListRow}
                                    itemHeight={72}
                                    useIsScrolling
                                    hasMore={hasMore}
                                    isLoading={isLoading}
                                    onEndReached={loadMore}
                                />
                            ) : (
                                <div className="py-12 text-center text-gray-500 dark:text-gray-400">Aucun article trouvé pour ce métier.</div>
                            )}
                        </div>
                        </div>
                    </div>
                ) : (
                    // GRID VIEW
                    <div className="h-full p-4 bg-gray-50/50 dark:bg-transparent">
                        {articles && (articles.length > 0 || isLoading) ? (
                            <VirtualizedArticleGrid items={articles} getBadgeVariant={getBadgeVariant} getCategoryIcon={getCategoryIcon} hasMore={hasMore} isLoading={isLoading} onEndReached={loadMore} />
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Aucun article trouvé.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function VirtualizedArticleGrid({ items, getBadgeVariant, getCategoryIcon, hasMore, isLoading, onEndReached }: any) {
    const ITEMS_PER_ROW = 3
    const rows = []
    for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
        rows.push(items.slice(i, i + ITEMS_PER_ROW))
    }

    const renderRow = (chunk: any[], index: number, style: any, isScrolling?: boolean) => (
        <div style={style}>
            {isScrolling ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2 pb-4">
                    {[...Array(chunk.length)].map((_, i) => (
                        <div key={i} className="h-[220px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2 pb-4">
                    {chunk.map((article: any) => (
                        <Card key={article.id} className="group relative overflow-hidden transition-all bg-white border-gray-200 hover:border-blue-200 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:shadow-black/20 h-[220px] flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant={getBadgeVariant(article.category) as any}>
                                        {getCategoryIcon(article.category)}
                                    </Badge>
                                    <span className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-white cursor-pointer">
                                        <MoreVertical size={16} />
                                    </span>
                                </div>
                                <CardTitle className="text-lg text-gray-900 dark:text-white truncate" title={article.name}>{article.name}</CardTitle>
                                <CardDescription className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{article.category} • Par {article.unit}</CardDescription>
                            </CardHeader>

                            <CardContent className="pb-2">
                                {article.category === 'fourniture' && (
                                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 dark:bg-white/5 dark:border-white/5">
                                        <span className="text-gray-600 dark:text-gray-400">Stock : <span className={`font-bold ${article.stock <= (article.min_stock || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{article.stock || 0}</span></span>
                                        <span className="text-gray-500 truncate max-w-[100px]">{article.supplier || 'Sans fournisseur'}</span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex justify-between items-end border-t border-gray-100 pt-4 dark:border-white/5">
                                <div>
                                    <p className="text-gray-500 text-xs dark:text-gray-500">Prix Vente</p>
                                    <p className="text-emerald-600 font-bold text-lg dark:text-emerald-400">{article.price_ht} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-xs dark:text-gray-500">Déboursé</p>
                                    <p className="text-gray-600 font-medium dark:text-gray-400">{article.cost_ht} €</p>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <VirtualizedList
            items={rows}
            renderItem={renderRow}
            itemHeight={240}
            useIsScrolling
            hasMore={hasMore}
            isLoading={isLoading}
            onEndReached={onEndReached}
        />
    )
}
