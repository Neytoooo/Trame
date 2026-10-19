'use client'

import { MapPin, Calendar, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
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
        <div className="space-y-6">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un chantier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
            </div>

            {/* Grille des chantiers */}
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
                            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500/50 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 flex flex-col justify-between"
                        >
                            <div>
                                {/* Badge Status */}
                                <div className="mb-4 flex justify-between items-start">
                                    <Badge variant={
                                        (chantier.status === 'en_cours' ? 'success' :
                                            chantier.status === 'etude' ? 'info' :
                                                chantier.status === 'annule' ? 'error' : 'gray') as any
                                    }>
                                        {chantier.status === 'en_cours' ? 'En cours' :
                                            chantier.status === 'etude' ? 'En étude' :
                                                chantier.status === 'annule' ? 'Annulé' : 'Terminé'}
                                    </Badge>
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-white/10 dark:text-gray-400">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>

                                {/* Titre et Client */}
                                <h3 className="text-xl font-bold text-gray-900 mb-1 dark:text-white">{chantier.name}</h3>
                                <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Client : <span className="text-gray-700 font-medium dark:text-gray-300">{chantier.clients?.name}</span></p>
                            </div>

                            <div>
                                {/* Automation Progress */}
                                {hasAutomation && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500 dark:text-gray-400">Automatisation</span>
                                            <span className={`font-semibold ${progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden dark:bg-white/10">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Footer Infos */}
                                <div className="flex items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        <span className="truncate max-w-[120px]">{chantier.address_line1 || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {chantier.date_debut || '--/--/----'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Carte vide si aucun chantier */}
            {(!chantiers || chantiers.length === 0) && !isLoading && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-gray-500 dark:border-white/10 dark:text-gray-400">
                    <p>Aucun chantier trouvé.</p>
                </div>
            )}

            {/* Sentinel for detecting bottom of list */}
            {(hasMore || isLoading) && (
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4">
                    {isLoading && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    )}
                </div>
            )}
        </div>
    )
}
