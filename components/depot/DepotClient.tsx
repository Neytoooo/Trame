'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
    Camera,
    Search,
    Filter,
    Plus,
    FileText,
    ExternalLink,
    Trash2,
    Edit3,
    Download,
    X,
    Check,
    Smartphone,
    Calendar,
    HardHat,
    Image as ImageIcon,
    RefreshCw,
    Sparkles,
    Eye,
    Layers,
    Tag,
    Share2,
    ZoomIn
} from 'lucide-react'
import { DepotPhoto, DepotStats, DepotPhotoCategory } from '@/types/depot'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Props {
    initialPhotos: DepotPhoto[]
    initialStats: DepotStats
    recentDevis: Array<{ id: string; reference: string; name: string; clientName?: string }>
}

const CATEGORY_CONFIG: Record<DepotPhotoCategory, { label: string; color: string; bg: string }> = {
    constat: {
        label: 'Constat / État des lieux',
        color: 'text-violet-400 border-violet-500/30',
        bg: 'bg-violet-500/10'
    },
    avant_travaux: {
        label: 'Avant travaux',
        color: 'text-amber-400 border-amber-500/30',
        bg: 'bg-amber-500/10'
    },
    en_cours: {
        label: 'En cours de chantier',
        color: 'text-sky-400 border-sky-500/30',
        bg: 'bg-sky-500/10'
    },
    apres_travaux: {
        label: 'Après travaux / Réception',
        color: 'text-emerald-400 border-emerald-500/30',
        bg: 'bg-emerald-500/10'
    },
    releve_technique: {
        label: 'Relevé technique / Cotes',
        color: 'text-indigo-400 border-indigo-500/30',
        bg: 'bg-indigo-500/10'
    },
    autre: {
        label: 'Autre',
        color: 'text-slate-400 border-slate-500/30',
        bg: 'bg-slate-500/10'
    }
}

export default function DepotClient({ initialPhotos, initialStats, recentDevis }: Props) {
    const router = useRouter()
    const confirm = useConfirm()
    const searchParams = useSearchParams()
    const paramDevis = searchParams.get('devis') || ''

    const [photos, setPhotos] = useState<DepotPhoto[]>(initialPhotos)
    const [stats, setStats] = useState<DepotStats>(initialStats)
    const [searchQuery, setSearchQuery] = useState(paramDevis)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Modals
    const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<DepotPhoto | null>(null)
    const [editingPhoto, setEditingPhoto] = useState<DepotPhoto | null>(null)
    const [editDevisRef, setEditDevisRef] = useState('')
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

    // Formulaire Upload
    const [uploadImageBase64, setUploadImageBase64] = useState<string | null>(null)
    const [uploadDevisRef, setUploadDevisRef] = useState('')
    const [uploadCategory, setUploadCategory] = useState<DepotPhotoCategory>('constat')
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadNotes, setUploadNotes] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [isLiveConnected, setIsLiveConnected] = useState(false)

    // Écoute temps réel Server-Sent Events (SSE) : actualisation instantanée SANS polling !
    useEffect(() => {
        let eventSource: EventSource | null = null

        try {
            eventSource = new EventSource('/api/mobile/depot/events')

            eventSource.onopen = () => {
                setIsLiveConnected(true)
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'NEW_PHOTO' && data.photo) {
                        setPhotos(prev => {
                            if (prev.some(p => p.id === data.photo.id)) return prev
                            return [data.photo, ...prev]
                        })
                        if (data.stats) setStats(data.stats)
                    } else if (data.type === 'UPDATE_PHOTO' && data.photo) {
                        setPhotos(prev => prev.map(p => p.id === data.photo.id ? data.photo : p))
                        if (data.stats) setStats(data.stats)
                    } else if (data.type === 'DELETE_PHOTO' && data.deletedId) {
                        setPhotos(prev => prev.filter(p => p.id !== data.deletedId))
                        if (data.stats) setStats(data.stats)
                    }
                } catch {
                    // Ignore
                }
            }

            eventSource.onerror = () => {
                setIsLiveConnected(false)
            }
        } catch {
            // Fallback
        }

        return () => {
            if (eventSource) {
                eventSource.close()
            }
        }
    }, [])

    // Rafraîchir les photos manuellement si besoin
    const refreshPhotos = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/mobile/depot')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setPhotos(data.photos)
                    setStats(data.stats)
                }
            }
        } catch (e) {
            console.error('Erreur refresh:', e)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Filtrage dynamique
    const filteredPhotos = useMemo(() => {
        return photos.filter((p) => {
            // Filtre par catégorie
            if (selectedCategory !== 'all' && p.category !== selectedCategory) {
                return false
            }

            // Recherche par devis ou texte libre
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase()
                const matchRef = p.devis_reference?.toLowerCase().includes(q)
                const matchTitle = p.title?.toLowerCase().includes(q)
                const matchNotes = p.notes?.toLowerCase().includes(q)
                const matchChantier = p.chantier_name?.toLowerCase().includes(q)
                const matchClient = p.client_name?.toLowerCase().includes(q)

                if (!matchRef && !matchTitle && !matchNotes && !matchChantier && !matchClient) {
                    return false
                }
            }

            return true
        })
    }, [photos, selectedCategory, searchQuery])

    // Sauvegarder la modification du devis rattaché
    const handleSaveEditDevis = async () => {
        if (!editingPhoto) return
        try {
            const res = await fetch(`/api/mobile/depot/${editingPhoto.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    devisReference: editDevisRef.trim() || null
                })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.photo) {
                    setPhotos(prev => prev.map(p => p.id === editingPhoto.id ? data.photo : p))
                    setEditingPhoto(null)
                    if (activeLightboxPhoto?.id === editingPhoto.id) {
                        setActiveLightboxPhoto(data.photo)
                    }
                }
            }
        } catch (e) {
            alert('Erreur lors de la mise à jour.')
        }
    }

    // Supprimer une photo avec la pop-up de confirmation KOTA Design
    const handleDeletePhoto = async (id: string, photoTitle?: string) => {
        const ok = await confirm({
            title: "Supprimer définitivement cette photo ?",
            message: photoTitle
                ? `Êtes-vous sûr de vouloir supprimer définitivement le cliché « ${photoTitle} » du Dépôt ? Cette action est irréversible.`
                : "Êtes-vous sûr de vouloir supprimer définitivement cette photo du Dépôt ? Cette action est irréversible.",
            confirmText: "Oui, supprimer",
            cancelText: "Non, annuler",
            variant: "danger"
        })
        if (!ok) return

        try {
            const res = await fetch(`/api/mobile/depot/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setPhotos(prev => prev.filter(p => p.id !== id))
                if (activeLightboxPhoto?.id === id) setActiveLightboxPhoto(null)
            }
        } catch (e) {
            console.error('Erreur lors de la suppression de la photo:', e)
        }
    }

    // Upload depuis le web (Drag & Drop / Fichier)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            setUploadImageBase64(reader.result as string)
            if (!uploadTitle) {
                setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
            }
        }
        reader.readAsDataURL(file)
    }

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!uploadImageBase64) {
            alert('Veuillez sélectionner une image.')
            return
        }

        setIsUploading(true)
        try {
            const res = await fetch('/api/mobile/depot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: uploadImageBase64,
                    devisReference: uploadDevisRef.trim() || undefined,
                    category: uploadCategory,
                    title: uploadTitle.trim() || undefined,
                    notes: uploadNotes.trim() || undefined,
                    deviceInfo: 'Import KOTA Web (Navigateur)'
                })
            })

            const data = await res.json()
            if (data.success && data.photo) {
                setPhotos(prev => [data.photo, ...prev])
                setIsUploadModalOpen(false)
                setUploadImageBase64(null)
                setUploadDevisRef('')
                setUploadTitle('')
                setUploadNotes('')
            } else {
                alert(data.error || 'Erreur lors du téléversement.')
            }
        } catch (err: any) {
            alert(err.message || 'Erreur réseau.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden animate-in fade-in duration-300">
            {/* --- 1. HEADER & ACTIONS --- */}
            <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                        <Camera size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Dépôt Photos Chantier
                            </h1>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                Smartphone & IA
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Stockage centralisé de vos clichés terrain reliés aux devis BTP par numéro de référence.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Badge Synchronisation En direct (SSE) */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="hidden sm:inline">En direct mobile</span>
                    </div>

                    <button
                        onClick={refreshPhotos}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs"
                        title="Actualiser les photos"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
                        <span className="hidden sm:inline">Actualiser</span>
                    </button>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Importer une photo</span>
                    </button>
                </div>
            </div>

            {/* --- 2. STATS BANNER --- */}
            <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                        <ImageIcon size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400 leading-none">Total Photos</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.totalPhotos}</p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <FileText size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400 leading-none">Photos Rattachées</p>
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none">{stats.linkedToDevisCount}</p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Tag size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400 leading-none">Devis avec Photos</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 leading-none">{stats.uniqueDevisCount}</p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                        <Smartphone size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400 leading-none">Origine Mobile</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate leading-none">Samsung S25+ 5G</p>
                    </div>
                </div>
            </div>

            {/* --- 3. RECHERCHE PAR N° DE DEVIS ET FILTRES --- */}
            <div className="shrink-0 flex flex-col gap-2.5 bg-slate-50 dark:bg-[#0D131F] p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Barre de recherche par numéro de devis */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par n° de devis (ex: DEV-MOB-47606, DEV-2026-...) ou mot-clé..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sélecteur de catégorie */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedCategory === 'all'
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-[#141C2E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            Toutes ({photos.length})
                        </button>
                        {(Object.keys(CATEGORY_CONFIG) as DepotPhotoCategory[]).map((cat) => {
                            const conf = CATEGORY_CONFIG[cat]
                            const count = photos.filter(p => p.category === cat).length
                            if (count === 0 && selectedCategory !== cat) return null

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        selectedCategory === cat
                                            ? 'bg-violet-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-[#141C2E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    {conf.label} ({count})
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Suggestions rapides : Devis récents à 1-clic */}
                {recentDevis && recentDevis.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                            <Tag size={10} /> Devis Récents :
                        </span>
                        {recentDevis.slice(0, 6).map((d) => {
                            const isSelected = searchQuery === d.reference
                            return (
                                <button
                                    key={d.id}
                                    onClick={() => setSearchQuery(isSelected ? '' : d.reference)}
                                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white/80 dark:bg-[#141C2E]/80 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40'
                                    }`}
                                >
                                    {d.reference} {d.clientName ? `• ${d.clientName}` : ''}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* --- 4. GALERIE PHOTO (BENTO GRID) --- */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 pb-10">
                {filteredPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-[#111726]/40 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6">
                        <div className="p-4 rounded-3xl bg-violet-500/10 text-violet-400 mb-3">
                            <Camera size={36} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucune photo trouvée</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                            {searchQuery
                                ? `Aucun cliché rattaché à la recherche "${searchQuery}". Vérifiez le numéro de devis.`
                                : 'Prenez une photo depuis votre smartphone dans KOTA Mobile ou importez-en une ici.'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-violet-600 text-white shadow-xs cursor-pointer"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {filteredPhotos.map((photo) => {
                            const catConf = CATEGORY_CONFIG[photo.category] || CATEGORY_CONFIG.autre
                            const hasDevis = Boolean(photo.devis_reference)

                            return (
                                <div
                                    key={photo.id}
                                    className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200"
                                >
                                    {/* Image Thumbnail Container */}
                                    <div
                                        className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center"
                                        onClick={() => setActiveLightboxPhoto(photo)}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                                            <Camera size={32} />
                                        </div>
                                        <img
                                            src={photo.image_url}
                                            alt={photo.title}
                                            className="relative z-1 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />

                                        {/* Overlay hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white shadow-lg">
                                                <ZoomIn size={18} />
                                            </span>
                                        </div>

                                        {/* Badge Devis Rattaché (Top Left) */}
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                            {hasDevis ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30">
                                                    <FileText size={11} />
                                                    {photo.devis_reference}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-amber-300 backdrop-blur-md border border-amber-500/30">
                                                    Non rattaché
                                                </span>
                                            )}
                                        </div>

                                        {/* Badge Catégorie (Bottom Right) */}
                                        <span className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md border ${catConf.color} bg-black/60`}>
                                            {catConf.label}
                                        </span>
                                    </div>

                                    {/* Informations Card */}
                                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                                        <div>
                                            <div className="flex items-start justify-between gap-1.5">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                                                    {photo.title}
                                                </h4>
                                                <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                                    {new Date(photo.created_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })}
                                                </span>
                                            </div>

                                            {photo.chantier_name && (
                                                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5 truncate">
                                                    <HardHat size={11} />
                                                    {photo.chantier_name}
                                                </p>
                                            )}

                                            {photo.notes ? (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                                    {photo.notes}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 italic mt-1">
                                                    Aucune note complémentaire
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Footer: Metadata & Quick Actions */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                <Smartphone size={10} />
                                                <span className="truncate max-w-[100px]">{photo.device_info || 'Mobile'}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {/* Bouton ouvrir le devis direct */}
                                                {hasDevis && photo.devis_id && (
                                                    <Link
                                                        href={`/dashboard/devis/${photo.devis_id}/edit`}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                                        title="Ouvrir le devis rattaché"
                                                    >
                                                        <ExternalLink size={13} />
                                                    </Link>
                                                )}

                                                {/* Bouton modifier le n° devis */}
                                                <button
                                                    onClick={() => {
                                                        setEditingPhoto(photo)
                                                        setEditDevisRef(photo.devis_reference || '')
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                                    title="Modifier le devis rattaché"
                                                >
                                                    <Edit3 size={13} />
                                                </button>

                                                {/* Bouton supprimer */}
                                                <button
                                                    onClick={() => handleDeletePhoto(photo.id, photo.title)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                    title="Supprimer la photo"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* --- 5. MODAL LIGHTBOX / VISUALISATION HD --- */}
            {activeLightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setActiveLightboxPhoto(null)}
                >
                    <div
                        className="relative max-w-4xl w-full bg-[#111726] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setActiveLightboxPhoto(null)}
                            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Image Viewer */}
                        <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px]">
                            <img
                                src={activeLightboxPhoto.image_url}
                                alt={activeLightboxPhoto.title}
                                className="max-h-[75vh] w-auto object-contain rounded-xl"
                            />
                        </div>

                        {/* Details Sidebar */}
                        <div className="w-full md:w-80 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 bg-[#0E1422]">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                                        {CATEGORY_CONFIG[activeLightboxPhoto.category]?.label || 'Photo de chantier'}
                                    </span>
                                    <h3 className="text-base font-bold text-white mt-0.5">{activeLightboxPhoto.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        {new Date(activeLightboxPhoto.created_at).toLocaleString('fr-FR')}
                                    </p>
                                </div>

                                {/* Devis Rattaché Box */}
                                <div className="p-3 rounded-2xl bg-violet-950/20 border border-violet-500/30">
                                    <p className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                                        <FileText size={13} /> Devis Rattaché
                                    </p>
                                    <p className="text-sm font-black text-white mt-1">
                                        {activeLightboxPhoto.devis_reference || 'Non relié à un devis'}
                                    </p>
                                    {activeLightboxPhoto.devis_id && (
                                        <Link
                                            href={`/dashboard/devis/${activeLightboxPhoto.devis_id}/edit`}
                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Ouvrir dans l&apos;éditeur de devis</span>
                                        </Link>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-300">Chantier & Client</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {activeLightboxPhoto.chantier_name} • {activeLightboxPhoto.client_name}
                                    </p>
                                </div>

                                {activeLightboxPhoto.notes && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-300">Notes de relevé</p>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                            {activeLightboxPhoto.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
                                <div className="flex items-center gap-2">
                                    <a
                                        href={activeLightboxPhoto.image_url}
                                        download={`photo-chantier-${activeLightboxPhoto.devis_reference || activeLightboxPhoto.id}.jpg`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                                    >
                                        <Download size={13} />
                                        <span>Télécharger</span>
                                    </a>

                                    <button
                                        onClick={() => handleDeletePhoto(activeLightboxPhoto.id, activeLightboxPhoto.title)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors cursor-pointer"
                                        title="Supprimer définitivement"
                                    >
                                        <Trash2 size={13} />
                                        <span>Supprimer</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setEditingPhoto(activeLightboxPhoto)
                                        setEditDevisRef(activeLightboxPhoto.devis_reference || '')
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium transition-colors cursor-pointer"
                                >
                                    <Edit3 size={13} />
                                    <span>Changer Devis</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 6. MODAL MODIFICATION DU DEVIS RATTACHÉ --- */}
            {editingPhoto && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#111726] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Tag size={16} className="text-indigo-400" />
                                Relier à un numéro de Devis
                            </h3>
                            <button
                                onClick={() => setEditingPhoto(null)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Référence ou numéro du Devis
                            </label>
                            <input
                                type="text"
                                placeholder="ex: DEV-MOB-47606 ou DEV-2026-001"
                                value={editDevisRef}
                                onChange={(e) => setEditDevisRef(e.target.value)}
                                className="w-full bg-[#141C2E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
                            />
                        </div>

                        {/* Suggestions */}
                        {recentDevis.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Devis récents :
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {recentDevis.slice(0, 4).map((d) => (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => setEditDevisRef(d.reference)}
                                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
                                        >
                                            {d.reference}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setEditingPhoto(null)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveEditDevis}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-500/20 cursor-pointer"
                            >
                                <Check size={14} />
                                <span>Enregistrer le rattachement</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 7. MODAL IMPORT WEB --- */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form
                        onSubmit={handleUploadSubmit}
                        className="max-w-lg w-full bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-violet-400" />
                                Ajouter une photo au Dépôt
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Zone Drop Image */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                Fichier Image (JPEG, PNG, WebP)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
                            />
                            {uploadImageBase64 && (
                                <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                                    <img src={uploadImageBase64} alt="Aperçu" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        {/* Référence Devis */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Numéro du Devis à relier (Optionnel)
                            </label>
                            <input
                                type="text"
                                placeholder="ex: DEV-MOB-47606"
                                value={uploadDevisRef}
                                onChange={(e) => setUploadDevisRef(e.target.value)}
                                className="w-full bg-[#141C2E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
                            />
                        </div>

                        {/* Catégorie */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Type de photo
                            </label>
                            <select
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value as DepotPhotoCategory)}
                                className="w-full bg-[#141C2E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            >
                                {(Object.keys(CATEGORY_CONFIG) as DepotPhotoCategory[]).map((cat) => (
                                    <option key={cat} value={cat}>
                                        {CATEGORY_CONFIG[cat].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Titre */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Titre ou Objet
                            </label>
                            <input
                                type="text"
                                placeholder="ex: Constat fissure façade nord"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                className="w-full bg-[#141C2E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Commentaires / Observations
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Précisez les cotes relevées, l'état constaté..."
                                value={uploadNotes}
                                onChange={(e) => setUploadNotes(e.target.value)}
                                className="w-full bg-[#141C2E] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(false)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading || !uploadImageBase64}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-500/25 disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? 'Enregistrement...' : 'Enregistrer au Dépôt'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
