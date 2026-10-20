'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, MoreVertical, Edit, User, MapPin, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/dashboard/FilterBar'
import ViewToggle from '@/components/ui/ViewToggle'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import StatusBadge from '@/components/ui/StatusBadge'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchDevisAction } from '@/app/actions/devis'

export default function DevisList({ initialDevis, linkedDevisIds = [] }: { initialDevis: any[], linkedDevisIds?: string[] }) {
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-devis', 'grid')
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const router = useRouter()

    const {
        data: devisList,
        setData: setDevisList,
        hasMore,
        isLoading,
        loadMore,
        searchQuery,
        setSearchQuery
    } = useInfiniteScroll({
        fetchAction: fetchDevisAction,
        initialData: initialDevis,
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

    const linkedIdsSet = new Set(linkedDevisIds)

    const isWithinDateRange = (dateString: string, range: string) => {
        if (range === 'all') return true
        const date = new Date(dateString)
        const now = new Date()

        if (range === 'this_month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }
        if (range === 'last_month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
        }
        if (range === 'last_3_months') {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
            return date >= threeMonthsAgo
        }
        if (range === 'this_year') {
            return date.getFullYear() === now.getFullYear()
        }
        return true
    }

    const filteredDevis = devisList.filter((devis: any) => {
        // 1. Search Term (Server handled, but we can double check locally for relations)
        // 2. Status Filter
        if (statusFilter !== 'all' && devis.status !== statusFilter) return false
        // 3. Date Filter
        if (!isWithinDateRange(devis.created_at, dateFilter)) return false
        return true
    })



    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer définitivement ce devis ?")) return

        // Optimistic update
        setDevisList(prev => prev.filter(d => d.id !== id))

        const { deleteDevis } = await import('@/app/actions/devis')
        const res = await deleteDevis(id)

        if (!res?.success) {
            alert("Erreur lors de la suppression")
            // Revert ? Too complex for now, assume success
        }
    }

    const handleConvertToFacture = async (devisId: string) => {
        if (!confirm("Voulez-vous transformer ce devis en facture ?")) return

        // Import dynamique pour éviter les dépendances circulaires
        const { convertDevisToFacture } = await import('@/app/actions/factures')
        const res = await convertDevisToFacture(devisId)

        if (res?.success && res.factureId) {
            router.push(`/dashboard/factures/${res.factureId}/edit`)
        } else {
            alert("Erreur lors de la conversion")
        }
    }

    return (
        <div className="space-y-6">
            <FilterBar
                placeholder="Rechercher un devis..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                statusValue={statusFilter}
                onStatusChange={setStatusFilter}
                dateRangeValue={dateFilter}
                onDateRangeChange={setDateFilter}
                statusOptions={[
                    { label: 'Brouillon', value: 'brouillon' },
                    { label: 'En préparation', value: 'en_attente' },
                    { label: 'Approbation', value: 'en_attente_approbation' },
                    { label: 'Validé', value: 'valide' },
                    { label: 'Refusé', value: 'refuse' },
                ]}
            >
                <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </FilterBar>

            {/* Grid / List via viewMode */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-[#0E1524] text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Référence</th>
                                <th className="px-6 py-4 font-semibold">Client</th>
                                <th className="px-6 py-4 font-semibold">Chantier</th>
                                <th className="px-6 py-4 font-semibold">Date de création</th>
                                <th className="px-6 py-4 font-semibold text-right">Montant TTC</th>
                                <th className="px-6 py-4 font-semibold text-right">Statut</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {filteredDevis.map((devis) => (
                                <tr key={devis.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#162032]">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <FileText size={15} className="text-indigo-600 dark:text-indigo-400" />
                                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{devis.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        {devis.chantiers?.clients?.name || 'Inconnu'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {devis.chantiers?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                        {new Date(devis.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                        {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {linkedIdsSet.has(devis.id) && <StatusBadge status="automatise" />}
                                            <StatusBadge status={devis.status || 'brouillon'} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {devis.status !== 'brouillon' && (
                                                <button
                                                    onClick={() => handleConvertToFacture(devis.id)}
                                                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                                                    title="Transformer en facture"
                                                >
                                                    <FileText size={15} className="rotate-180" />
                                                </button>
                                            )}
                                            <Link
                                                href={`/dashboard/devis/${devis.id}/edit`}
                                                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent"
                                                title="Ouvrir"
                                            >
                                                <Edit size={15} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(devis.id)}
                                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-all border border-transparent"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // GRID VIEW
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDevis.map((devis) => (
                        <div key={devis.id} className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md">

                            {/* Header Card */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                        <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                                        {devis.name || 'Sans Titre'}
                                    </h3>
                                    {devis.reference && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                            {devis.reference}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {linkedIdsSet.has(devis.id) && <StatusBadge status="automatise" showIcon={true} />}
                                    <StatusBadge status={devis.status || 'brouillon'} />
                                </div>
                            </div>

                            {/* Info Client & Chantier */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <User size={14} className="text-slate-400 dark:text-slate-500" />
                                    <span className="truncate">{devis.chantiers?.clients?.name || 'Client inconnu'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                                    <span className="truncate">{devis.chantiers?.name || 'Chantier inconnu'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                    <span>{new Date(devis.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-'}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(devis.id)}
                                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all dark:bg-rose-500/10 dark:text-rose-400"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    {devis.status !== 'brouillon' && (
                                        <button
                                            onClick={() => handleConvertToFacture(devis.id)}
                                            title="Transformer en facture"
                                            className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all dark:bg-purple-600/10 dark:text-purple-400"
                                        >
                                            <FileText size={14} className="rotate-180" />
                                        </button>
                                    )}

                                    <Link
                                        href={`/dashboard/devis/${devis.id}/edit`}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all dark:bg-indigo-600/20 dark:text-indigo-400"
                                    >
                                        <Edit size={14} />
                                        Ouvrir
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sentinel for detecting bottom of list */}
            {(hasMore || isLoading) && (
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4 mt-6">
                    {isLoading && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    )}
                </div>
            )}
        </div>
    )
}
