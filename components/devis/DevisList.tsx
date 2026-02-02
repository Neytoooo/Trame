'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, MoreVertical, Edit, User, MapPin, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/dashboard/FilterBar'
import ViewToggle from '@/components/ui/ViewToggle'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'

export default function DevisList({ initialDevis }: { initialDevis: any[] }) {
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-devis', 'grid')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [devisList, setDevisList] = useState(initialDevis)
    const router = useRouter()

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

    const filteredDevis = devisList.filter(devis => {
        // 1. Search Term
        const matchesSearch =
            devis.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            devis.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            devis.chantiers?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // 2. Status Filter
        if (statusFilter !== 'all' && devis.status !== statusFilter) return false

        // 3. Date Filter
        if (!isWithinDateRange(devis.created_at, dateFilter)) return false

        return true
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'brouillon': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
            case 'en_attente': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            case 'en_attente_approbation': return 'text-green-400 bg-green-500/10 border-green-500/20'
            case 'valide': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            case 'refuse': return 'text-red-400 bg-red-500/10 border-red-500/20'
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'brouillon': return 'Brouillon'
            case 'en_attente': return 'En préparation'
            case 'en_attente_approbation': return 'Approbation'
            case 'valide': return 'Validé'
            case 'refuse': return 'Refusé'
            default: return status
        }
    }

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
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
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
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Référence & Nom</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Chantier</th>
                                <th className="px-6 py-4 font-medium">Date de création</th>
                                <th className="px-6 py-4 font-medium text-right">Montant TTC</th>
                                <th className="px-6 py-4 font-medium text-right">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredDevis.map((devis) => (
                                <tr key={devis.id} className="transition-colors hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-blue-400" />
                                            <div>
                                                <p className="font-semibold">{devis.name || 'Sans Titre'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{devis.reference}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white hover:text-blue-400 transition-colors">
                                        {devis.chantiers?.clients?.name || 'Inconnu'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {devis.chantiers?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(devis.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white">
                                        {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(devis.status || 'brouillon')}`}>
                                            {getStatusLabel(devis.status || 'brouillon')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {devis.status !== 'brouillon' && (
                                                <button
                                                    onClick={() => handleConvertToFacture(devis.id)}
                                                    className="p-2 rounded-lg text-pink-400 hover:bg-pink-600/10 transition-all border border-transparent hover:border-pink-600/20"
                                                    title="Transformer en facture"
                                                >
                                                    <FileText size={16} className="rotate-180" />
                                                </button>
                                            )}
                                            <Link
                                                href={`/dashboard/devis/${devis.id}/edit`}
                                                className="p-2 rounded-lg text-blue-400 hover:bg-blue-600/10 transition-all border border-transparent hover:border-blue-600/20"
                                                title="Ouvrir"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(devis.id)}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
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
                        <div key={devis.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">

                            {/* Header Card */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <FileText size={18} className="text-blue-400" />
                                        {devis.name || 'Sans Titre'}
                                    </h3>
                                    {devis.reference && (
                                        <p className="text-xs text-gray-500 mt-1 font-mono">
                                            {devis.reference}
                                        </p>
                                    )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(devis.status || 'brouillon')}`}>
                                    {getStatusLabel(devis.status || 'brouillon')}
                                </span>
                            </div>

                            {/* Info Client & Chantier */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <User size={14} className="text-gray-500" />
                                    <span className="truncate">{devis.chantiers?.clients?.name || 'Client inconnu'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <MapPin size={14} className="text-gray-500" />
                                    <span className="truncate">{devis.chantiers?.name || 'Chantier inconnu'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} />
                                    <span>{new Date(devis.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="font-bold text-white">
                                    {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-'}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(devis.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    {devis.status !== 'brouillon' && (
                                        <button
                                            onClick={() => handleConvertToFacture(devis.id)}
                                            title="Transformer en facture"
                                            className="p-2 rounded-lg bg-pink-600/10 text-pink-400 hover:bg-pink-600 hover:text-white transition-all"
                                        >
                                            <FileText size={14} className="rotate-180" />
                                        </button>
                                    )}

                                    <Link
                                        href={`/dashboard/devis/${devis.id}/edit`}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all"
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
        </div>
    )
}
