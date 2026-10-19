'use client'

import { useState } from 'react'
import { Plus, Search, User, Mail, Phone, MapPin, Building2, Edit, Trash2, Upload, FileSpreadsheet } from 'lucide-react'
import NewClientModal from '@/components/dashboard/NewClientModal'
import ClientImportModal from '@/components/dashboard/ClientImportModal' // Import Modal
import ImportHelpButton from '@/components/dashboard/ImportHelpButton' // Helpers Import
import ViewToggle from '@/components/ui/ViewToggle'
import { deleteClientAction, fetchClientsAction } from '@/app/actions/clients'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import VirtualizedList from '@/components/ui/VirtualizedList' // Added Import
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

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
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const {
        data: clients,
        hasMore,
        isLoading,
        loadMore,
        searchQuery,
        setSearchQuery
    } = useInfiniteScroll({
        fetchAction: fetchClientsAction,
        initialData: initialClients,
        limit: 10
    })

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?\n\nATTENTION :\n- Ses DEVIS seront SUPPRIMÉS DÉFINITIVEMENT.\n- Ses FACTURES seront ARCHIVÉES dans la corbeille.`)) return

        setIsProcessing(id)
        const res = await deleteClientAction(id)

        if (!res?.success) {
            alert(res?.error || "Une erreur est survenue lors de la suppression")
        }
        setIsProcessing(null)
    }

    // LIST ROW RENDERER
    const renderListRow = (client: any, index: number, style: any, isScrolling?: boolean) => (
        <div style={style}>
            {isScrolling ? (
                <div className="flex items-center px-6 py-4 border-b border-gray-100 dark:border-white/5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 dark:bg-white/10"></div>
                </div>
            ) : (
                <div className="flex items-center px-6 border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 h-full text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${client.type === 'professionnel' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                {client.type === 'professionnel' ? <Building2 size={16} /> : <User size={16} />}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white truncate">{client.name}</span>
                        </div>
                    </div>
                    <div className="w-32 capitalize">{client.type}</div>
                    <div className="w-64">
                        <div className="flex flex-col gap-1">
                            {client.email && (
                                <div className="flex items-center gap-2 text-xs truncate">
                                    <Mail size={12} />
                                    {client.email}
                                </div>
                            )}
                            {client.phone_mobile && (
                                <div className="flex items-center gap-2 text-xs truncate">
                                    <Phone size={12} />
                                    {client.phone_mobile}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-40 truncate">{client.city || '-'}</div>
                    <div className="w-24 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-all dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-blue-400"
                                title="Modifier"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(client.id, client.name)}
                                disabled={isProcessing === client.id}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-all dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-6 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md">
                {clients.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-600">
                            <User size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Aucun client trouvé.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="flex flex-col h-full">
                        {/* Static Header */}
                        <div className="flex items-center bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-300 py-4 px-6 font-medium border-b border-gray-200 dark:border-white/10 shrink-0">
                            <div className="flex-1 pr-4">Nom</div>
                            <div className="w-32">Type</div>
                            <div className="w-64">Contact</div>
                            <div className="w-40">Ville</div>
                            <div className="w-24 text-right">Actions</div>
                        </div>
                        {/* Virtual List */}
                        <div className="flex-1">
                            <VirtualizedList
                                items={clients}
                                renderItem={renderListRow}
                                itemHeight={72}
                                useIsScrolling
                                hasMore={hasMore}
                                isLoading={isLoading}
                                onEndReached={loadMore}
                            />
                        </div>
                    </div>
                ) : (
                    // GRID VIEW
                    <div className="h-full p-4 bg-gray-50/50 dark:bg-transparent">
                        <VirtualizedGridAdapter items={clients} onEdit={(c: Client) => { setEditingClient(c); setIsModalOpen(true) }} onDelete={handleDelete} isProcessing={isProcessing} hasMore={hasMore} isLoading={isLoading} onEndReached={loadMore} />
                    </div>
                )}
            </div>

            <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={editingClient} />
            <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </div>
    )
}


// Sub-component for Virtualized Grid Adapter
function VirtualizedGridAdapter({ items, onEdit, onDelete, isProcessing, hasMore, isLoading, onEndReached }: { items: Client[], onEdit: (client: Client) => void, onDelete: (id: string, name: string) => void, isProcessing: string | null, hasMore?: boolean, isLoading?: boolean, onEndReached?: () => void }) {
    const ITEMS_PER_ROW = 3

    // Create chunks
    // Note: useMemo might be expensive if items change often, but good for filtering.
    // We recreate chunks on render.
    const rows = []
    for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
        rows.push(items.slice(i, i + ITEMS_PER_ROW))
    }

    const renderRow = (chunk: Client[], index: number, style: any, isScrolling?: boolean) => (
        <div style={style}>
            {isScrolling ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2 pb-4">
                    {[...Array(chunk.length)].map((_, i) => (
                        <div key={i} className="h-[200px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2 pb-4">
                    {chunk.map((client: Client) => (
                        <ClientCard key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} isProcessing={isProcessing} />
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <VirtualizedList
            items={rows}
            renderItem={renderRow}
            itemHeight={220} // Height of card + gap
            useIsScrolling
            hasMore={hasMore}
            isLoading={isLoading}
            onEndReached={onEndReached}
        />
    )
}

function ClientCard({ client, onEdit, onDelete, isProcessing }: { client: Client, onEdit: (client: Client) => void, onDelete: (id: string, name: string) => void, isProcessing: string | null }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-black/20 h-[200px] flex flex-col justify-between">
            {/* Card Content ... (same as before) */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${client.type === 'professionnel' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                        }`}>
                        {client.type === 'professionnel' ? <Building2 size={20} /> : <User size={20} />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400 truncate max-w-[120px]">{client.name}</h3>
                        <span className="text-xs text-gray-500 capitalize">{client.type}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => onEdit(client)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all dark:hover:bg-white/10 dark:hover:text-blue-400"
                        title="Modifier"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(client.id, client.name)}
                        disabled={isProcessing === client.id}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail size={14} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        <span className="truncate">{client.email}</span>
                        {client.billing_email && client.billing_email !== client.email && (
                            <span className="text-xs text-gray-500">(Fac: {client.billing_email})</span>
                        )}
                    </div>
                )}
                {client.phone_mobile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone size={14} className="text-gray-400 dark:text-gray-600" />
                        <span>{client.phone_mobile}</span>
                    </div>
                )}
                {client.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin size={14} className="text-gray-400 dark:text-gray-600" />
                        <span>{client.city}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
