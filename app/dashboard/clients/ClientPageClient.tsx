'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, User, Mail, Phone, MapPin, Building2, Edit, Trash2, FileSpreadsheet, Shield } from 'lucide-react'
import NewClientModal from '@/components/dashboard/NewClientModal'
import ClientImportModal from '@/components/dashboard/ClientImportModal'
import ImportHelpButton from '@/components/dashboard/ImportHelpButton'
import FilterBar from '@/components/dashboard/FilterBar'
import ViewToggle from '@/components/ui/ViewToggle'
import PillButton from '@/components/ui/PillButton'
import { usePersistentViewMode } from '@/hooks/usePersistentViewMode'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { deleteClientAction, fetchClientsAction } from '@/app/actions/clients'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export type Client = {
    id: string
    name: string
    type: 'particulier' | 'professionnel'
    email?: string
    billing_email?: string
    phone_mobile?: string
    phone_fixe?: string
    address_line1?: string
    address_line2?: string
    city?: string
    zip_code?: string
    siret?: string
    iban?: string
    created_at?: string
}

export default function ClientPageClient({ initialClients }: { initialClients: any[] }) {
    const confirm = useConfirm()
    const [viewMode, setViewMode] = usePersistentViewMode('view-mode-clients', 'list')
    const [typeFilter, setTypeFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const {
        data: clientsList,
        setData: setClientsList,
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

    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!hasMore || isLoading) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
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

    // Helper for date filtering
    const isWithinDateRange = (dateString?: string, range: string = 'all') => {
        if (range === 'all' || !dateString) return true
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

    const filteredClients = clientsList.filter((client: any) => {
        // 1. Type Filter
        if (typeFilter !== 'all' && client.type !== typeFilter) return false

        // 2. Date Filter
        if (!isWithinDateRange(client.created_at, dateFilter)) return false

        // 3. Client-side Search fallback
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchName = client.name?.toLowerCase().includes(q)
            const matchEmail = client.email?.toLowerCase().includes(q) || client.billing_email?.toLowerCase().includes(q)
            const matchCity = client.city?.toLowerCase().includes(q)
            const matchSiret = client.siret?.toLowerCase().includes(q)
            if (!matchName && !matchEmail && !matchCity && !matchSiret) return false
        }

        return true
    })

    const handleDelete = async (id: string, name: string) => {
        const ok = await confirm({
            title: `Supprimer le client ${name} ?`,
            message: `Êtes-vous sûr de vouloir supprimer définitivement ${name} ?\n\n⚠️ Conséquences importantes :\n• Tous ses devis seront supprimés définitivement.\n• Toutes ses factures seront archivées dans la corbeille.`,
            confirmText: "Oui, supprimer le client",
            cancelText: "Non, annuler",
            variant: "danger"
        })
        if (!ok) return

        setIsProcessing(id)
        const res = await deleteClientAction(id)

        if (res?.success) {
            setClientsList(prev => prev.filter(c => c.id !== id))
        } else {
            alert(res?.error || "Une erreur est survenue lors de la suppression")
        }
        setIsProcessing(null)
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Filter Bar (Fixed) */}
            <div className="shrink-0 pb-4">
                <FilterBar
                    placeholder="Rechercher un client (nom, email, ville, SIRET)..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusValue={typeFilter}
                    onStatusChange={setTypeFilter}
                    dateRangeValue={dateFilter}
                    onDateRangeChange={setDateFilter}
                    statusOptions={[
                        { label: 'Entreprises (Pro)', value: 'professionnel' },
                        { label: 'Particuliers', value: 'particulier' }
                    ]}
                >
                    <div className="flex items-center gap-2">
                        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                        <ImportHelpButton type="client" />
                        <PillButton
                            onClick={() => setIsImportModalOpen(true)}
                            variant="success"
                            icon={<FileSpreadsheet size={14} />}
                        >
                            Importer (Excel)
                        </PillButton>
                        <PillButton
                            onClick={() => { setEditingClient(null); setIsModalOpen(true) }}
                            variant="primary"
                            icon={<Plus size={14} />}
                        >
                            Nouveau Client
                        </PillButton>
                    </div>
                </FilterBar>
            </div>

            {/* Content: Table View OR Grid View (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6 space-y-4">
                {filteredClients.length === 0 && !isLoading ? (
                    <div className="text-center py-16 bg-white dark:bg-[#131B2A] rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                            <User size={22} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucun client trouvé</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto font-medium">
                            {searchQuery ? "Aucun résultat ne correspond à votre recherche." : "Ajoutez votre premier client ou importez votre fichier Excel pour démarrer."}
                        </p>
                        <div className="pt-2">
                            <PillButton
                                onClick={() => { setEditingClient(null); setIsModalOpen(true) }}
                                variant="primary"
                                icon={<Plus size={14} />}
                            >
                                Nouveau Client
                            </PillButton>
                        </div>
                    </div>
                ) : viewMode === 'list' ? (
                    /* --- 1. TABLE VIEW (Copie conforme du tableau de Factures) --- */
                    <div className="overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0E1524] text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Client / Entreprise</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Contact Direct</th>
                                <th className="px-6 py-4 font-semibold">Localisation</th>
                                <th className="px-6 py-4 font-semibold">Identifiant / SIRET</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {filteredClients.map((client) => {
                                const initials = client.name
                                    ? client.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                                    : 'CL'

                                return (
                                    <tr
                                        key={client.id}
                                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#162032] group"
                                    >
                                        {/* Client / Entreprise */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${
                                                    client.type === 'professionnel'
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
                                                        : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50'
                                                }`}>
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {client.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                        {client.address_line1 || 'Adresse non renseignée'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                client.type === 'professionnel'
                                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${client.type === 'professionnel' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                                {client.type === 'professionnel' ? 'Entreprise' : 'Particulier'}
                                            </span>
                                        </td>

                                        {/* Contact Direct */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-xs">
                                                {client.email && (
                                                    <a
                                                        href={`mailto:${client.email}`}
                                                        className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        <Mail size={12} className="text-slate-400 shrink-0" />
                                                        <span className="truncate max-w-[220px] font-medium">{client.email}</span>
                                                    </a>
                                                )}
                                                {(client.phone_mobile || client.phone_fixe) && (
                                                    <a
                                                        href={`tel:${client.phone_mobile || client.phone_fixe}`}
                                                        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                                                    >
                                                        <Phone size={12} className="text-slate-400 shrink-0" />
                                                        <span>{client.phone_mobile || client.phone_fixe}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        {/* Localisation */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                                <MapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span>
                                                    {client.city ? `${client.zip_code ? client.zip_code + ' ' : ''}${client.city}` : '-'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Identifiant / SIRET */}
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {client.siret || '-'}
                                        </td>

                                        {/* Actions (Exactement comme dans FactureList) */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                                    title="Modifier le client"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id, client.name)}
                                                    disabled={isProcessing === client.id}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-all cursor-pointer disabled:opacity-50"
                                                    title="Supprimer le client"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* --- 2. GRID VIEW (Mêmes cartes Bento spacieuses que FactureList) --- */
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => {
                        const initials = client.name
                            ? client.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                            : 'CL'

                        return (
                            <div
                                key={client.id}
                                className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                {/* Header Card */}
                                <div>
                                    <div className="flex items-start justify-between mb-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border ${
                                                client.type === 'professionnel'
                                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
                                                    : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50'
                                            }`}>
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                                    {client.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                                    {client.address_line1 || 'Adresse non renseignée'}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                                            client.type === 'professionnel'
                                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {client.type === 'professionnel' ? 'Entreprise' : 'Particulier'}
                                        </span>
                                    </div>

                                    {/* Info Client */}
                                    <div className="space-y-2 my-4 text-xs font-medium">
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Mail size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {client.email}
                                                </a>
                                            </div>
                                        )}
                                        {(client.phone_mobile || client.phone_fixe) && (
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Phone size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <a href={`tel:${client.phone_mobile || client.phone_fixe}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {client.phone_mobile || client.phone_fixe}
                                                </a>
                                            </div>
                                        )}
                                        {client.city && (
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <MapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span className="truncate">{client.zip_code ? `${client.zip_code} ` : ''}{client.city}</span>
                                            </div>
                                        )}
                                        {client.siret && (
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                                                <Shield size={13} className="shrink-0" />
                                                <span>SIRET: {client.siret}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Footer (Exactement comme dans FactureList) */}
                                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                        {client.city || 'Client enregistré'}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                            title="Modifier"
                                        >
                                            <Edit size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id, client.name)}
                                            disabled={isProcessing === client.id}
                                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-all cursor-pointer disabled:opacity-50"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="h-4 w-full" />
            </div>

            {/* Modales */}
            <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={editingClient} />
            <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </div>
    )
}
