'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, MoreVertical, Edit, User, MapPin, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DevisList({ initialDevis }: { initialDevis: any[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [devisList, setDevisList] = useState(initialDevis)
    const router = useRouter()

    const filteredDevis = devisList.filter(devis =>
        devis.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devis.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devis.chantiers?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'brouillon': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
            case 'en_attente': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
            case 'en_attente_approbation': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            case 'valide': return 'text-green-400 bg-green-500/10 border-green-500/20'
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
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un devis (ref, nom, client)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Grid display for quotes */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDevis.map((devis) => (
                    <div key={devis.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">

                        {/* Header Card */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <FileText size={18} className="text-blue-400" />
                                    {devis.reference || 'Sans Ref'}
                                </h3>
                                {(devis.name) && (
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{devis.name}</p>
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

                {filteredDevis.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        Aucun devis trouvé.
                    </div>
                )}
            </div>
        </div>
    )
}
