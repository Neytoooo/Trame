'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileCheck, Search, MoreVertical, Eye, User, MapPin, Calendar, Clock, Download, Mail, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateFacturePDF } from '@/utils/generatePdf'
import { sendFactureEmail } from '@/app/actions/email'
import { deleteFacture, deleteFacturePermanently, restoreFacture } from '@/app/actions/factures'

export default function FactureList({ initialFactures, companySettings }: { initialFactures: any[], companySettings: any }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [facturesList, setFacturesList] = useState(initialFactures)
    const [showHistory, setShowHistory] = useState(false)
    const [isProcessing, setIsProcessing] = useState<string | null>(null) // ID being processed
    const router = useRouter()

    const filteredFactures = facturesList.filter(facture =>
        // 1. Filter by History Mode (Deleted vs Active)
        (showHistory ? !!facture.deleted_at : !facture.deleted_at) &&
        // 2. Filter by Search Term
        (
            facture.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            facture.chantiers?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (facture.chantiers?.clients === null && "client supprimé".includes(searchTerm.toLowerCase()))
        )
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'en_attente': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
            case 'payee': return 'text-green-400 bg-green-500/10 border-green-500/20'
            case 'retard': return 'text-red-400 bg-red-500/10 border-red-500/20'
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
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
            // Optimistic update
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
            // Optimistic update
            setFacturesList(prev => prev.map(f => f.id === id ? { ...f, deleted_at: null } : f))
        } else {
            alert("Erreur : " + res.error)
        }
        setIsProcessing(null)
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une facture (ref, client)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                {/* Toggle History */}
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${showHistory ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                    <Trash2 size={18} />
                    {showHistory ? 'Masquer la corbeille' : 'Voir la corbeille'}
                </button>
            </div>

            {/* Banner Corbeille */}
            {showHistory && (
                <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-orange-400 mb-4">
                    <AlertTriangle size={20} />
                    <p>Vous visualisez les factures supprimées. Elles seront effacées définitivement après 30 jours.</p>
                </div>
            )}

            {/* Grid display for invoices */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFactures.map((facture) => (
                    <div key={facture.id} className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all ${facture.deleted_at ? 'bg-red-900/10 border-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1'}`}>

                        {/* Header Card */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <FileCheck size={18} className={facture.deleted_at ? "text-gray-500" : "text-purple-400"} />
                                    {facture.reference || 'Sans Ref'}
                                </h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(facture.status || 'en_attente')}`}>
                                {getStatusLabel(facture.status || 'en_attente')}
                            </span>
                        </div>

                        {/* Info Client & Chantier */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <User size={14} className="text-gray-500" />
                                <span className={facture.chantiers?.clients ? "" : "text-red-400 italic"}>
                                    {facture.chantiers?.clients?.name || 'Client supprimé'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin size={14} className="text-gray-500" />
                                <span className="truncate">{facture.chantiers?.name || 'Chantier inconnu'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} />
                                <span>Émise le : {new Date(facture.date_emission).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="font-bold text-white text-xl">
                                {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-'}
                            </span>

                            <div className="flex items-center gap-2">
                                {facture.deleted_at ? (
                                    <>
                                        <button
                                            onClick={() => handleRestore(facture.id)}
                                            disabled={isProcessing === facture.id}
                                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all"
                                            title="Restaurer"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(facture.id, true)}
                                            disabled={isProcessing === facture.id}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                            title="Supprimer définitivement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => generateFacturePDF(facture, companySettings)}
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
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
                                            className="p-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all"
                                            title="Envoyer par email"
                                        >
                                            <Mail size={14} />
                                        </button>
                                        <Link
                                            href={`/dashboard/factures/${facture.id}/edit`}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 text-purple-400 text-xs font-semibold hover:bg-purple-600 hover:text-white transition-all"
                                        >
                                            <Eye size={14} />
                                            Voir
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(facture.id)}
                                            disabled={isProcessing === facture.id}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
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

                {filteredFactures.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        {showHistory ? "La corbeille est vide." : "Aucune facture trouvée."}
                    </div>
                )}
            </div>
        </div>
    )
}
