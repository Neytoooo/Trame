'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    X,
    Search,
    Camera,
    Tag,
    Calendar,
    Smartphone,
    Check,
    FolderArchive,
    RefreshCw,
    ExternalLink
} from 'lucide-react'
import { DepotPhoto, DepotPhotoCategory } from '@/types/depot'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSelectPhoto: (photo: DepotPhoto) => void
    currentDevisReference?: string
}

const CATEGORY_LABELS: Record<DepotPhotoCategory, string> = {
    constat: 'Constat / État des lieux',
    avant_travaux: 'Avant travaux',
    en_cours: 'En cours de chantier',
    apres_travaux: 'Après travaux / Réception',
    releve_technique: 'Relevé technique / Cotes',
    autre: 'Autre'
}

export default function DepotPhotoPickerModal({
    isOpen,
    onClose,
    onSelectPhoto,
    currentDevisReference
}: Props) {
    const [photos, setPhotos] = useState<DepotPhoto[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTab, setFilterTab] = useState<'current_devis' | 'all'>('current_devis')
    const [selectedPhoto, setSelectedPhoto] = useState<DepotPhoto | null>(null)

    // Charger les photos du Dépôt à l'ouverture
    useEffect(() => {
        if (!isOpen) return

        let isMounted = true
        setIsLoading(true)

        fetch('/api/mobile/depot')
            .then(res => res.json())
            .then(data => {
                if (isMounted && data.success && Array.isArray(data.photos)) {
                    setPhotos(data.photos)
                    // Si aucune photo n'est reliée au devis actuel, basculer sur "Toutes"
                    const hasCurrent = currentDevisReference
                        ? data.photos.some((p: DepotPhoto) => 
                            p.devis_reference?.toLowerCase() === currentDevisReference.toLowerCase()
                          )
                        : false
                    if (!hasCurrent) {
                        setFilterTab('all')
                    }
                }
            })
            .catch(err => {
                console.error('Erreur chargement Dépôt:', err)
            })
            .finally(() => {
                if (isMounted) setIsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [isOpen, currentDevisReference])

    const cleanCurrentRef = currentDevisReference?.trim().toLowerCase() || ''

    // Photos du devis actuel
    const currentDevisPhotos = useMemo(() => {
        if (!cleanCurrentRef) return []
        return photos.filter(p => p.devis_reference?.toLowerCase() === cleanCurrentRef)
    }, [photos, cleanCurrentRef])

    // Filtrage dynamique
    const displayPhotos = useMemo(() => {
        let baseList = filterTab === 'current_devis' && cleanCurrentRef ? currentDevisPhotos : photos

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            baseList = baseList.filter(p => {
                const matchRef = p.devis_reference?.toLowerCase().includes(q)
                const matchTitle = p.title?.toLowerCase().includes(q)
                const matchNotes = p.notes?.toLowerCase().includes(q)
                const matchChantier = p.chantier_name?.toLowerCase().includes(q)
                return matchRef || matchTitle || matchNotes || matchChantier
            })
        }

        return baseList
    }, [photos, currentDevisPhotos, filterTab, cleanCurrentRef, searchQuery])

    if (!isOpen) return null

    const handleConfirm = () => {
        if (!selectedPhoto) return
        onSelectPhoto(selectedPhoto)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-[#111726] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header Modal */}
                <div className="shrink-0 p-5 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                            <FolderArchive size={22} />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                                Choisir une photo du Dépôt
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                    KOTA Mobile
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Insérez un cliché pris sur le terrain directement dans les lignes du devis.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Barre Filtres & Recherche */}
                <div className="shrink-0 p-4 bg-[#0D131F] border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Onglets Filtres */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#141C2E] border border-slate-800 rounded-xl">
                        {cleanCurrentRef && (
                            <button
                                type="button"
                                onClick={() => setFilterTab('current_devis')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    filterTab === 'current_devis'
                                        ? 'bg-violet-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Ce devis ({currentDevisReference}) [{currentDevisPhotos.length}]
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setFilterTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                filterTab === 'all'
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Toutes les photos ({photos.length})
                        </button>
                    </div>

                    {/* Barre de Recherche */}
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par mot-clé, devis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#141C2E] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Grille des photos */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 no-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                            <RefreshCw size={24} className="animate-spin text-violet-400" />
                            <p className="text-xs">Chargement des photos du Dépôt...</p>
                        </div>
                    ) : displayPhotos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-3xl bg-violet-500/10 text-violet-400 mb-3">
                                <Camera size={32} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Aucune photo trouvée</h3>
                            <p className="text-xs text-slate-400 max-w-md mt-1">
                                {filterTab === 'current_devis' && cleanCurrentRef
                                    ? `Aucun cliché n'est encore rattaché au devis ${currentDevisReference}. Prenez-en une depuis l'application mobile KOTA Mobile en sélectionnant ce numéro.`
                                    : 'Aucune photo disponible dans le Dépôt. Utilisez KOTA Mobile pour en envoyer.'}
                            </p>
                            {filterTab === 'current_devis' && photos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('all')}
                                    className="mt-4 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-violet-600 text-white shadow-xs cursor-pointer"
                                >
                                    Voir toutes les photos du Dépôt ({photos.length})
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {displayPhotos.map((p) => {
                                const isSelected = selectedPhoto?.id === p.id
                                const isLinkedToThisDevis = cleanCurrentRef && p.devis_reference?.toLowerCase() === cleanCurrentRef

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPhoto(p)}
                                        className={`group relative rounded-2xl bg-[#0E1422] border overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                                            isSelected
                                                ? 'border-violet-500 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/20'
                                                : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                                                <Camera size={24} />
                                            </div>
                                            <img
                                                src={p.image_url}
                                                alt={p.title}
                                                className="relative z-1 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />

                                            {/* Badge sélection */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 z-2 p-1.5 rounded-full bg-violet-600 text-white shadow-md">
                                                    <Check size={14} />
                                                </div>
                                            )}

                                            {/* Badge Devis */}
                                            {p.devis_reference && (
                                                <div className="absolute bottom-2 left-2 z-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        isLinkedToThisDevis
                                                            ? 'bg-violet-600 text-white shadow-xs'
                                                            : 'bg-black/70 text-slate-300 backdrop-blur-xs'
                                                    }`}>
                                                        {p.devis_reference}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 truncate">
                                                    {CATEGORY_LABELS[p.category] || p.category}
                                                </p>
                                                <p className="text-xs font-bold text-white truncate mt-0.5" title={p.title}>
                                                    {p.title}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                <Calendar size={10} />
                                                {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="shrink-0 p-4 border-t border-slate-800 bg-[#0E1422] flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                        {selectedPhoto ? (
                            <span className="text-white font-medium">
                                Sélectionné : <strong className="text-violet-400">{selectedPhoto.title}</strong>
                            </span>
                        ) : (
                            <span>Cliquez sur une photo pour la sélectionner.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            disabled={!selectedPhoto}
                            onClick={handleConfirm}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <Check size={14} />
                            <span>Insérer dans le devis</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
