'use client'

import { MapPin, Calendar, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchChantiersAction } from '@/app/actions/chantiers'
import { useEffect, useRef } from 'react'

export default function ChantiersListClient({ initialChantiers }: { initialChantiers: any[] }) {
    const {
        data: chantiers,
        hasMore,
        isLoading,
        loadMore,
        searchQuery,
        setSearchQuery
    } = useInfiniteScroll({
        fetchAction: fetchChantiersAction,
        initialData: initialChantiers,
        limit: 10
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

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Search Input (Fixed) */}
            <div className="shrink-0 pb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                    <input
                        type="text"
                        placeholder="Rechercher un chantier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none shadow-xs transition-all"
                    />
                </div>
            </div>

            {/* Grille des chantiers (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chantiers?.map((chantier: any) => {
                    // Calcul de l'avancement
                    const nodes = chantier.chantier_nodes || []
                    const relevantNodes = nodes.filter((n: any) => n.type !== 'start') // On ignore le nœud de départ
                    const totalNodes = relevantNodes.length
                    const doneNodes = relevantNodes.filter((n: any) => n.status === 'done').length
                    const progress = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0
                    const hasAutomation = totalNodes > 0

                    return (
                        <Link
                            key={chantier.id}
                            href={`/dashboard/chantiers/${chantier.id}`} // Lien vers le détail
                            className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md flex flex-col justify-between"
                        >
                            <div>
                                {/* Badge Status */}
                                <div className="mb-4 flex justify-between items-start">
                                    <StatusBadge status={chantier.status || 'etude'} />
                                    <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                                        <ArrowRight size={15} />
                                    </div>
                                </div>

                                {/* Titre et Client */}
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">{chantier.name}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Client : <span className="text-slate-700 dark:text-slate-300 font-semibold">{chantier.clients?.name}</span></p>
                            </div>

                            <div>
                                {/* Automation Progress */}
                                {hasAutomation && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-500 dark:text-slate-400">Automatisation</span>
                                            <span className={`font-bold ${progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Footer Infos */}
                                <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-slate-400 dark:text-slate-500" />
                                        <span className="truncate max-w-[140px] text-slate-600 dark:text-slate-300">{chantier.address_line1 || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                                        <span className="text-slate-600 dark:text-slate-300">{chantier.date_debut || '--/--/----'}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Carte vide si aucun chantier */}
            {(!chantiers || chantiers.length === 0) && !isLoading && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] py-12 text-slate-400 dark:text-slate-500 text-sm">
                    <p>Aucun chantier trouvé.</p>
                </div>
            )}

            {/* Sentinel for detecting bottom of list */}
            {(hasMore || isLoading) && (
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4">
                    {isLoading && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    )}
                </div>
            )}
            </div>
        </div>
    )
}
