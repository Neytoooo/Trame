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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                    type="text"
                    placeholder="Rechercher un chantier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-xs transition-all"
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
                            className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:border-indigo-400 hover:shadow-md flex flex-col justify-between"
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
                                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                                        <ArrowRight size={15} />
                                    </div>
                                </div>

                                {/* Titre et Client */}
                                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors leading-snug">{chantier.name}</h3>
                                <p className="text-xs text-slate-400 mb-6 font-medium">Client : <span className="text-slate-700 font-semibold">{chantier.clients?.name}</span></p>
                            </div>

                            <div>
                                {/* Automation Progress */}
                                {hasAutomation && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-500">Automatisation</span>
                                            <span className={`font-bold ${progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Footer Infos */}
                                <div className="flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-slate-400" />
                                        <span className="truncate max-w-[140px] text-slate-600">{chantier.address_line1 || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={13} className="text-slate-400" />
                                        <span className="text-slate-600">{chantier.date_debut || '--/--/----'}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Carte vide si aucun chantier */}
            {(!chantiers || chantiers.length === 0) && !isLoading && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-slate-400 text-sm">
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
    )
}
