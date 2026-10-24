'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Search,
    Package,
    Hammer,
    Truck,
    Layers,
    Box,
    Tag,
    Wallet,
    Trash2,
    Edit
} from 'lucide-react'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import ViewToggle from '@/components/ui/ViewToggle'
import TradeBadge from '@/components/ui/TradeBadge'
import { useRouter } from 'next/navigation'
import VirtualizedList from '@/components/ui/VirtualizedList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchArticlesAction, deleteArticleAction } from '@/app/actions/articles'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import ArticleModal from '@/components/dashboard/ArticleModal'

interface ArticleListProps {
    initialArticles: any[]
}

export default function ArticleList({ initialArticles }: ArticleListProps) {
    const router = useRouter()
    const confirm = useConfirm()
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-articles', 'grid')
    const [selectedMetier, setSelectedMetier] = useState('TOUS')
    const [editingArticle, setEditingArticle] = useState<any | null>(null)

    const METIERS = ['TOUS', 'RAVALEMENT', 'ÉCHAFAUDAGE', 'PRÉPARATION', 'COUVERTURE', 'MENUISERIE', 'ÉLECTRICITÉ', 'PLOMBERIE', 'PEINTURE']

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
        limit: 15
    })

    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore()
                }
            },
            { rootMargin: '100px' }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => observer.disconnect()
    }, [hasMore, isLoading, loadMore])

    // REALTIME SUBSCRIPTION
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-articles-library')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
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
            case 'main_doeuvre': return <Hammer size={16} />
            case 'fourniture': return <Package size={16} />
            case 'engin': return <Truck size={16} />
            case 'ouvrage': return <Layers size={16} />
            default: return <Box size={16} />
        }
    }

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'main_doeuvre': return "Main d'œuvre"
            case 'fourniture': return 'Fourniture'
            case 'engin': return 'Engin'
            case 'ouvrage': return 'Ouvrage'
            case 'sous_traitance': return 'Sous-traitance'
            default: return 'Article'
        }
    }

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Supprimer cet article ?",
            message: "Cette action est irréversible. L'article sera retiré de la bibliothèque.",
            confirmText: "Oui, supprimer",
            cancelText: "Annuler",
            variant: "danger"
        })
        if (!isConfirmed) return

        const res = await deleteArticleAction(id)
        if (res?.success) {
            setArticles(prev => prev.filter(a => a.id !== id))
        } else {
            alert(res?.error || "Erreur lors de la suppression.")
        }
    }

    const filteredArticles = articles.filter((a: any) => {
        if (selectedMetier === 'TOUS') return true
        const matchSupplier = a.supplier?.toUpperCase().includes(selectedMetier)
        const matchName = a.name?.toUpperCase().includes(selectedMetier)
        return matchSupplier || matchName
    })

    // TABLE LIST RENDERER
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
                    <div className="border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#162032] flex items-center px-6 h-full text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-24 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate pr-2">
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
                        <div className="w-16 text-center font-mono text-xs text-slate-600 dark:text-slate-300">{article.unit || 'u'}</div>
                        <div className="w-24 text-right font-bold text-gray-900 dark:text-white">
                            {priceHT.toFixed(2)} €
                        </div>
                        <div className="w-24 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                            {ttc10} €
                        </div>
                        <div className="w-24 text-right text-gray-500 dark:text-gray-400 text-xs">
                            {ttc20} €
                        </div>
                        <div className="w-24 text-right text-xs font-mono text-gray-400 dark:text-gray-500">
                            {Number(article.cost_ht || 0).toFixed(2)} €
                        </div>
                        <div className="w-20 text-right pl-3 flex items-center justify-end gap-1.5">
                            <button
                                onClick={() => setEditingArticle(article)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Modifier"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(article.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={14} />
                            </button>
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
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                    <input
                        type="text"
                        placeholder="Rechercher référence, ouvrage, prestation (ex: RAV D2, Échafaudage...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Onglets Filtres Métier BTP */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 shrink-0 no-scrollbar">
                {METIERS.map(m => (
                    <button
                        key={m}
                        onClick={() => setSelectedMetier(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                            selectedMetier === m
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#131B2A] dark:text-slate-300 dark:border dark:border-slate-800 dark:hover:bg-[#1A2438]'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Conteneur de Défilement (Exactement comme Devis) */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6 space-y-4">
                {viewMode === 'list' ? (
                    // TABLE VIEW (Harmonisée comme Devis)
                    <div className="overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
                        <div className="flex flex-col h-[650px] overflow-x-auto">
                            <div className="min-w-[1300px] flex flex-col h-full">
                                {/* Header Statique */}
                                <div className="flex items-center bg-slate-50 text-xs uppercase text-slate-500 dark:bg-[#0E1524] dark:text-slate-400 py-3.5 px-6 font-semibold border-b border-slate-200 dark:border-slate-800 shrink-0">
                                    <div className="w-24 pr-2">Réf.</div>
                                    <div className="flex-1">Désignation & Complément</div>
                                    <div className="w-80 shrink-0 pr-4">Famille / Métier</div>
                                    <div className="w-16 text-center">Unité</div>
                                    <div className="w-24 text-right">P.V. HT</div>
                                    <div className="w-24 text-right text-indigo-600 dark:text-indigo-400">TTC 10%</div>
                                    <div className="w-24 text-right">TTC 20%</div>
                                    <div className="w-24 text-right">Déboursé</div>
                                    <div className="w-20 text-right pl-3">Actions</div>
                                </div>
                                {/* Liste Virtualisée */}
                                <div className="flex-1">
                                    {filteredArticles && (filteredArticles.length > 0 || isLoading) ? (
                                        <VirtualizedList
                                            items={filteredArticles}
                                            renderItem={renderListRow}
                                            itemHeight={68}
                                            useIsScrolling
                                            hasMore={hasMore}
                                            isLoading={isLoading}
                                            onEndReached={loadMore}
                                        />
                                    ) : (
                                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                                            Aucun article trouvé pour ce métier.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // GRID VIEW (Exactement les mêmes cards que Devis)
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredArticles.map((article: any) => {
                            const nameParts = (article.name || '').split('\n')
                            const designation = nameParts[0] || 'Sans nom'
                            const complement = nameParts[1] || ''

                            return (
                                <div
                                    key={article.id}
                                    className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md flex flex-col justify-between"
                                >
                                    {/* Header Card */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="min-w-0 pr-3">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 truncate" title={designation}>
                                                <span className="text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    {getCategoryIcon(article.category)}
                                                </span>
                                                <span className="truncate">{designation}</span>
                                            </h3>
                                            {article.reference && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                                    {article.reference}
                                                </p>
                                            )}
                                            {complement && (
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
                                                    {complement}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <TradeBadge trade={article.supplier || article.category} />
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#0E1524] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
                                                {getCategoryLabel(article.category)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Rows (Aligné avec les cards Devis) */}
                                    <div className="space-y-3 mb-6">
                                        {/* Ligne 1 : Famille / Métier / Fournisseur */}
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Tag size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                            <span className="truncate">{article.supplier || 'Prestation générale'}</span>
                                        </div>

                                        {/* Ligne 2 : Unité & TVA */}
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Layers size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                            <span className="truncate">
                                                Unité : <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{article.unit || 'u'}</span>
                                                {' '}• TVA : <span className="font-mono">{article.tva || 20}%</span>
                                            </span>
                                        </div>

                                        {/* Ligne 3 : Déboursé & Stock */}
                                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Wallet size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span>
                                                    Déboursé : <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{Number(article.cost_ht || 0).toFixed(2)} €</span>
                                                </span>
                                            </div>
                                            {article.category === 'fourniture' && (
                                                <span className={`text-xs font-mono font-semibold ${article.stock <= (article.min_stock || 0) ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-400'}`}>
                                                    Stock : {article.stock || 0}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                Prix Vente HT
                                            </span>
                                            <span className="font-black text-slate-900 dark:text-white text-base">
                                                {Number(article.price_ht || 0).toFixed(2)} €
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all dark:bg-rose-500/10 dark:text-rose-400 cursor-pointer"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <button
                                                onClick={() => setEditingArticle(article)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all dark:bg-indigo-600/20 dark:text-indigo-400 cursor-pointer"
                                                title="Modifier l'article"
                                            >
                                                <Edit size={14} />
                                                <span>Modifier</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Sentinel pour scroll infini */}
                {(hasMore || isLoading) && (
                    <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4 mt-4">
                        {isLoading && (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Modification d'Article */}
            {editingArticle && (
                <ArticleModal
                    isOpen={Boolean(editingArticle)}
                    onClose={() => setEditingArticle(null)}
                    articleToEdit={editingArticle}
                />
            )}
        </div>
    )
}
