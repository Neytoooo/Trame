'use client'

import { useState } from 'react'
import { Plus, Search, User, Mail, Phone, MapPin, Building2, Edit, Trash2, Upload, FileSpreadsheet } from 'lucide-react'
import NewClientModal from '@/components/dashboard/NewClientModal'
import ClientImportModal from '@/components/dashboard/ClientImportModal' // Import Modal
import ImportHelpButton from '@/components/dashboard/ImportHelpButton' // Helpers Import
import ViewToggle from '@/components/ui/ViewToggle'
import { deleteClientAction } from '@/app/actions/clients'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'

type Client = {
    id: string
    name: string
    type: 'particulier' | 'professionnel'
    email?: string
    billing_email?: string
    phone_mobile?: string
    city?: string
    siret?: string
    iban?: string
}

export default function ClientPageClient({ initialClients }: { initialClients: any[] }) {
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-clients', 'grid')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false) // State for Import Modal
    const [editingClient, setEditingClient] = useState<any>(null)
    const [search, setSearch] = useState('')
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const filteredClients = initialClients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?\n\nATTENTION :\n- Ses DEVIS seront SUPPRIMÉS DÉFINITIVEMENT.\n- Ses FACTURES seront ARCHIVÉES dans la corbeille.`)) return

        setIsProcessing(id)
        const res = await deleteClientAction(id)

        if (!res?.success) {
            alert(res?.error || "Une erreur est survenue lors de la suppression")
        }
        setIsProcessing(null)
    }

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none md:w-64"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                    <ImportHelpButton type="client" />
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={16} />
                        Importer (Excel)
                    </button>
                    <button
                        onClick={() => { setEditingClient(null); setIsModalOpen(true) }}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all"
                    >
                        <Plus size={18} />
                        Nouveau Client
                    </button>
                </div>
            </div>

            {/* Grid / List via viewMode */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nom</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Ville</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="transition-colors hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${client.type === 'professionnel' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {client.type === 'professionnel' ? <Building2 size={16} /> : <User size={16} />}
                                            </div>
                                            {client.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize">{client.type}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Mail size={12} />
                                                    {client.email}
                                                </div>
                                            )}
                                            {client.phone_mobile && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Phone size={12} />
                                                    {client.phone_mobile}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{client.city || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-blue-400 transition-all"
                                                title="Modifier"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id, client.name)}
                                                disabled={isProcessing === client.id}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
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
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${client.type === 'professionnel' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {client.type === 'professionnel' ? <Building2 size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
                                        <span className="text-xs text-gray-500 capitalize">{client.type}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
                                        className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-blue-400 transition-all"
                                        title="Modifier"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id, client.name)}
                                        disabled={isProcessing === client.id}
                                        className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Mail size={14} className="text-gray-600" />
                                        <span className="truncate">{client.email}</span>
                                        {client.billing_email && client.billing_email !== client.email && (
                                            <span className="text-xs text-gray-600">(Fac: {client.billing_email})</span>
                                        )}
                                    </div>
                                )}
                                {client.phone_mobile && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Phone size={14} className="text-gray-600" />
                                        <span>{client.phone_mobile}</span>
                                    </div>
                                )}
                                {client.city && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <MapPin size={14} className="text-gray-600" />
                                        <span>{client.city}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredClients.length === 0 && (
                <div className="mt-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-600">
                        <User size={32} />
                    </div>
                    <p className="text-gray-400">Aucun client trouvé.</p>
                </div>
            )}

            <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={editingClient} />
            <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </>
    )
}
