'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileCheck, Search, MoreVertical, Eye, User, MapPin, Calendar, Clock, Download, Mail, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateFacturePDF } from '@/utils/generatePdf'
import { sendFactureEmail } from '@/app/actions/email'
import { deleteFacture, deleteFacturePermanently, restoreFacture } from '@/app/actions/factures'
import FilterBar from '@/components/dashboard/FilterBar'
import ViewToggle from '@/components/ui/ViewToggle'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'

export default function FactureList({ initialFactures, companySettings }: { initialFactures: any[], companySettings: any }) {
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-factures', 'grid')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [facturesList, setFacturesList] = useState(initialFactures)
    const [showHistory, setShowHistory] = useState(false)
    const [isProcessing, setIsProcessing] = useState<string | null>(null) // ID being processed
    const router = useRouter()

    // Helper for date filtering
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

    const filteredFactures = facturesList.filter(facture => {
        // 1. History Mode
        if ((showHistory && !facture.deleted_at) || (!showHistory && facture.deleted_at)) return false

        // 2. Search Term
        const matchesSearch =
            facture.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            facture.chantiers?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (facture.chantiers?.clients === null && "client supprimé".includes(searchTerm.toLowerCase()))

        if (!matchesSearch) return false

        // 3. Status Filter
        if (statusFilter !== 'all' && facture.status !== statusFilter) return false

        // 4. Date Filter
        if (!isWithinDateRange(facture.date_emission, dateFilter)) return false

        return true
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'en_attente': return 'text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20'
            case 'payee': return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20'
            case 'retard': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'
            default: return 'text-gray-500 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-500/10 dark:border-gray-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'en_attente': return 'En Attente'
            case 'payee': return 'Payée'
            case 'retard': return 'En Retard'
            default: return status
        }
    }

    const handleDelete = async (id: string, permanent: boolean = false) => {
        if (!confirm(permanent ? "Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT cette facture ? Cette action est irréversible." : "Voulez-vous déplacer cette facture dans la corbeille ?")) return

        setIsProcessing(id)
        let res
        if (permanent) {
            res = await deleteFacturePermanently(id)
        } else {
            res = await deleteFacture(id)
        }

        if (res.success) {
            if (permanent) {
                setFacturesList(prev => prev.filter(f => f.id !== id))
            } else {
                setFacturesList(prev => prev.map(f => f.id === id ? { ...f, deleted_at: new Date().toISOString() } : f))
            }
        } else {
            alert("Erreur : " + res.error)
        }
        setIsProcessing(null)
    }

    const handleRestore = async (id: string) => {
        setIsProcessing(id)
        const res = await restoreFacture(id)
        if (res.success) {
            setFacturesList(prev => prev.map(f => f.id === id ? { ...f, deleted_at: null } : f))
        } else {
            alert("Erreur : " + res.error)
        }
        setIsProcessing(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <FilterBar
                    placeholder="Rechercher une facture..."
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusValue={statusFilter}
                    onStatusChange={setStatusFilter}
                    dateRangeValue={dateFilter}
                    onDateRangeChange={setDateFilter}
                    statusOptions={[
                        { label: 'En Attente', value: 'en_attente' },
                        { label: 'Payée', value: 'payee' },
                        { label: 'En Retard', value: 'retard' }
                    ]}
                >
                    <div className="flex items-center gap-2">
                        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${showHistory ? 'bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-500/20 dark:border-orange-500 dark:text-orange-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10'}`}
                        >
                            <Trash2 size={18} />
                            {showHistory ? 'Masquer' : 'Corbeille'}
                        </button>
                    </div>
                </FilterBar>
            </div>

            {/* Banner Corbeille */}
            {showHistory && (
                <div className="flex items-center gap-2 rounded-xl bg-orange-100 border border-orange-200 p-4 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400">
                    <AlertTriangle size={20} />
                    <p>Vous visualisez les factures supprimées. Elles seront effacées définitivement après 30 jours.</p>
                </div>
            )}

            {/* Grid / List via viewMode */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Référence</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Chantier</th>
                                <th className="px-6 py-4 font-medium">Date d'émission</th>
                                <th className="px-6 py-4 font-medium text-right">Montant TTC</th>
                                <th className="px-6 py-4 font-medium text-right">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredFactures.map((facture) => (
                                <tr key={facture.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${facture.deleted_at ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <FileCheck size={16} className={facture.deleted_at ? "text-gray-400 dark:text-gray-500" : "text-purple-600 dark:text-purple-400"} />
                                            {facture.reference || 'Sans Ref'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 hover:text-purple-600 transition-colors dark:text-white dark:hover:text-purple-400">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400 dark:text-gray-500" />
                                            {facture.chantiers?.clients?.name || 'Client supprimé'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {facture.chantiers?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(facture.date_emission).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                        {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(facture.status || 'en_attente')}`}>
                                            {getStatusLabel(facture.status || 'en_attente')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {facture.deleted_at ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRestore(facture.id)}
                                                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10"
                                                        title="Restaurer"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(facture.id, true)}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                                        title="Supprimer définitivement"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => generateFacturePDF(facture, companySettings)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                        title="Télécharger PDF"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const client = facture.chantiers?.clients
                                                            let email = client?.billing_email || client?.email
                                                            if (!email) {
                                                                const manualEmail = prompt("Aucun email trouvé pour ce client. Saisissez l'email :")
                                                                if (!manualEmail) return
                                                                email = manualEmail
                                                            } else {
                                                                if (!confirm(`Envoyer la facture par email à ${email} ?`)) return
                                                            }
                                                            const pdfBase64 = generateFacturePDF(facture, companySettings, true)
                                                            // @ts-ignore
                                                            const res = await sendFactureEmail(facture, email, pdfBase64)
                                                            if (res?.success) {
                                                                alert(res.simulated ? "Email simulé (voir console) !" : "Email envoyé !")
                                                            } else {
                                                                alert("Erreur : " + res?.error)
                                                            }
                                                        }}
                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg dark:text-orange-400 dark:hover:bg-orange-500/10"
                                                        title="Envoyer par email"
                                                    >
                                                        <Mail size={16} />
                                                    </button>
                                                    <Link href={`/dashboard/factures/${facture.id}/edit`} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-500/10">
                                                        <Eye size={16} />
                                                    </Link>
                                                    <button onClick={() => handleDelete(facture.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-500/10">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
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
                    {filteredFactures.map((facture) => (
                        <div key={facture.id} className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all ${facture.deleted_at ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-500/20' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 dark:bg-[#1e293b] dark:border-white/10 dark:hover:bg-[#334155] dark:hover:border-white/20 dark:hover:shadow-black/20'}`}>

                            {/* Header Card */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 dark:text-white">
                                        <FileCheck size={18} className={facture.deleted_at ? "text-gray-400 dark:text-gray-500" : "text-purple-600 dark:text-purple-400"} />
                                        {facture.reference || 'Sans Ref'}
                                    </h3>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(facture.status || 'en_attente')}`}>
                                    {getStatusLabel(facture.status || 'en_attente')}
                                </span>
                            </div>

                            {/* Info Client & Chantier */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <User size={14} className="text-gray-400 dark:text-gray-500" />
                                    <span className={facture.chantiers?.clients ? "" : "text-red-500 italic dark:text-red-400"}>
                                        {facture.chantiers?.clients?.name || 'Client supprimé'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin size={14} className="text-gray-400 dark:text-gray-500" />
                                    <span className="truncate">{facture.chantiers?.name || 'Chantier inconnu'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} />
                                    <span>Émise le : {new Date(facture.date_emission).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                <span className="font-bold text-gray-900 text-xl dark:text-white">
                                    {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-'}
                                </span>

                                <div className="flex items-center gap-2">
                                    {facture.deleted_at ? (
                                        <>
                                            <button
                                                onClick={() => handleRestore(facture.id)}
                                                disabled={isProcessing === facture.id}
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500"
                                                title="Restaurer"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(facture.id, true)}
                                                disabled={isProcessing === facture.id}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500"
                                                title="Supprimer définitivement"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => generateFacturePDF(facture, companySettings)}
                                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500 hover:text-white"
                                                title="Télécharger PDF"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const client = facture.chantiers?.clients
                                                    let email = client?.billing_email || client?.email
                                                    if (!email) {
                                                        const manualEmail = prompt("Aucun email trouvé pour ce client. Saisissez l'email :")
                                                        if (!manualEmail) return
                                                        email = manualEmail
                                                    } else {
                                                        if (!confirm(`Envoyer la facture par email à ${email} ?`)) return
                                                    }
                                                    const pdfBase64 = generateFacturePDF(facture, companySettings, true)
                                                    // @ts-ignore
                                                    const res = await sendFactureEmail(facture, email, pdfBase64)
                                                    if (res?.success) {
                                                        alert(res.simulated ? "Email simulé (voir console) !" : "Email envoyé !")
                                                    } else {
                                                        alert("Erreur : " + res?.error)
                                                    }
                                                }}
                                                className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500 hover:text-white"
                                                title="Envoyer par email"
                                            >
                                                <Mail size={14} />
                                            </button>
                                            <Link
                                                href={`/dashboard/factures/${facture.id}/edit`}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-600 text-xs font-semibold hover:bg-purple-200 transition-all dark:bg-purple-600/10 dark:text-purple-400 dark:hover:bg-purple-600 hover:text-white"
                                            >
                                                <Eye size={14} />
                                                Voir
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(facture.id)}
                                                disabled={isProcessing === facture.id}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 hover:text-white"
                                                title="Mettre à la corbeille"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}      {filteredFactures.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                    {showHistory ? "La corbeille est vide." : "Aucune facture trouvée avec ces filtres."}
                </div>
            )}
        </div>

    )
}
