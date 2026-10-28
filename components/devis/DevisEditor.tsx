'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import {
    Plus, Trash2, Save, Calculator, Loader2, FileText, ChevronRight,
    Layout, GripVertical, Wallet, Calendar, Sliders, FolderPlus,
    Building2, UserCheck, ShieldCheck, CheckCircle2, Tag, FileDown,
    Image as ImageIcon, ArrowUp, ArrowDown, Upload, Box, BookmarkPlus,
    Laptop, FolderArchive, X
} from 'lucide-react'
import ArticleSelector from './ArticleSelector'
import CalculatorPopover from './CalculatorPopover'
import DevisLineDetailModal, { DevisLineData } from './DevisLineDetailModal'
import DevisPdfExportModal from './DevisPdfExportModal'
import ImportToLibraryModal from './ImportToLibraryModal'
import DepotPhotoPickerModal from './DepotPhotoPickerModal'
import { DepotPhoto } from '@/types/depot'
import { saveDevis, deleteDevisItem } from '@/app/actions/devis'
import { generateCustomDevisPDF } from '@/utils/generatePdf'
import { DevisPdfColumnConfig } from '@/types/pdfExport'
import PillButton from '@/components/ui/PillButton'
import { useConfirm } from '@/components/ui/ConfirmProvider'

// On définit le format étendu d'une ligne de devis BTP
export type DevisItem = {
    id: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    tva: number
    article_id?: string
    components?: { name: string, quantity: number, unit: string }[]
    item_type?: 'item' | 'section' | 'sub_section' | 'image'
    details?: any
    image_url?: string
    caption?: string
    // Champs BTP enrichis (issus de Batiecom)
    reference?: string
    complement?: string
    discount_pct?: number
    cost_mat?: number
    cost_mo?: number
    cost_fg_pct?: number
    cost_total?: number
    margin?: number
    margin_pct?: number
    dont_totalize?: boolean
    copy_to_schedule?: boolean
    billed_pct?: number
    commercial?: string
    technicien?: string
}

export default function DevisEditor({
    initialItems,
    devisId,
    articles,
    initialName,
    initialStatus,
    reference,
    dateEmission,
    chantierName,
    client
}: {
    initialItems: DevisItem[],
    devisId: string,
    articles: any[],
    initialName: string,
    initialStatus: string,
    reference?: string,
    dateEmission?: string,
    chantierName?: string,
    client?: any
}) {
    const confirm = useConfirm()
    const [items, setItems] = useState<DevisItem[]>(initialItems)
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    // Modals Choix Image & Dépôt Photos (Web & KOTA Mobile)
    const [isImageChoiceOpen, setIsImageChoiceOpen] = useState(false)
    const [isDepotPickerOpen, setIsDepotPickerOpen] = useState(false)
    const [replacingItemId, setReplacingItemId] = useState<string | null>(null)

    // Calculator State
    const [calcModalOpen, setCalcModalOpen] = useState(false)
    const [currentCalcItem, setCurrentCalcItem] = useState<string | null>(null)

    // Modal Détail de Ligne & Déboursé (Photo 5)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [currentDetailItem, setCurrentDetailItem] = useState<DevisItem | null>(null)

    // Champs Pro BTP (Photos 1 & 4)
    const [metier, setMetier] = useState('RAVALEMENT')
    const [missionType, setMissionType] = useState('RAVALEMENT-COPRO')
    const [payeurType, setPayeurType] = useState('Syndic')
    const [payeurName, setPayeurName] = useState(client?.name ? `Syndic ${client.name}` : 'Syndic LAMY')
    const [payeurAddress, setPayeurAddress] = useState(client?.address_line1 || '35 Quater Boulevard Gambetta, 78300 POISSY')
    const [payeurPhone, setPayeurPhone] = useState('01 30 74 25 66')
    const [technicien, setTechnicien] = useState('VINUESA Alexandre')
    const [commercial, setCommercial] = useState('VINUESA Alexandre/COP')
    const [acomptePct, setAcomptePct] = useState(40)

    // Sync items when initialItems prop updates
    useEffect(() => {
        setItems(initialItems)
    }, [initialItems])

    // Sync name when initialName prop updates
    useEffect(() => {
        setName(initialName)
    }, [initialName])

    const [isImportToBiblioOpen, setIsImportToBiblioOpen] = useState(false)
    const [localArticles, setLocalArticles] = useState<any[]>(articles || [])

    // Sync articles when prop updates
    useEffect(() => {
        setLocalArticles(articles || [])
    }, [articles])

    // Indexation des noms déjà présents en bibliothèque (zéro requête superflue, calcul instantané)
    const existingNamesSet = useMemo(() => {
        const set = new Set<string>()
        for (const a of localArticles) {
            if (a && a.name) {
                set.add(a.name.trim().toLowerCase())
            }
        }
        return set
    }, [localArticles])

    // Détection optimisée des lignes complètes non encore présentes en bibliothèque
    const importableItems = useMemo(() => {
        const seenNames = new Set<string>()
        const candidates: DevisItem[] = []

        for (const item of items) {
            // Exclure les chapitres, sous-chapitres et photos
            if (item.item_type === 'section' || item.item_type === 'sub_section' || item.item_type === 'image') {
                continue
            }
            const desc = item.description?.trim() || ''
            const unit = item.unit?.trim() || ''
            const price = Number(item.unit_price) || 0

            // Condition : la ligne doit être entièrement remplie (description, unité, prix > 0)
            if (!desc || !unit || price <= 0) {
                continue
            }

            // Exclure si déjà reliée à un article existant
            if (item.article_id) {
                continue
            }

            const normDesc = desc.toLowerCase()
            // Exclure si déjà présente dans la bibliothèque
            if (existingNamesSet.has(normDesc)) {
                continue
            }

            // Éviter d'afficher plusieurs fois la même désignation
            if (seenNames.has(normDesc)) {
                continue
            }
            seenNames.add(normDesc)
            candidates.push(item)
        }

        return candidates
    }, [items, existingNamesSet])

    const handleSavedToLibrary = (savedMappings: { lineId: string, articleId: string }[]) => {
        const mappingMap = new Map(savedMappings.map(m => [m.lineId, m.articleId]))

        // Lier immédiatement les lignes de devis avec leur nouvel article_id
        setItems(prev => prev.map(it => {
            if (mappingMap.has(it.id)) {
                return { ...it, article_id: mappingMap.get(it.id) }
            }
            return it
        }))

        // Ajouter les nouveaux articles à la bibliothèque locale pour synchroniser en temps réel
        const newlyCreated = items
            .filter(it => mappingMap.has(it.id))
            .map(it => ({
                id: mappingMap.get(it.id),
                name: it.description,
                unit: it.unit,
                price_ht: it.unit_price,
                category: 'ouvrage'
            }))
        setLocalArticles(prev => [...prev, ...newlyCreated])
    }

    const handleItemChange = (id: string, field: keyof DevisItem, value: any) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    // Référence pour l'upload d'image entre les lignes
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Drag & Drop et slide pour intervertir les lignes
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= items.length) return
        setItems(prev => {
            const next = [...prev]
            const [moved] = next.splice(index, 1)
            next.splice(targetIndex, 0, moved)
            return next
        })
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (dragOverIndex !== index) {
            setDragOverIndex(index)
        }
    }

    const handleDrop = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null)
            setDragOverIndex(null)
            return
        }
        setItems(prev => {
            const next = [...prev]
            const [moved] = next.splice(draggedIndex, 1)
            next.splice(index, 0, moved)
            return next
        })
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    // Gestion de l'insertion et du remplacement d'image
    const handleTriggerImageUpload = () => {
        setReplacingItemId(null)
        setIsImageChoiceOpen(true)
    }

    const handleSelectDepotPhoto = async (photo: DepotPhoto) => {
        const caption = photo.title || photo.notes || 'Photo du Dépôt'

        // Créer une copie indépendante et permanente pour ce devis
        // Même si la photo originale du Dépôt est supprimée du Dépôt, le devis conserve sa copie !
        let devisImageUrl = photo.image_url
        try {
            const res = await fetch('/api/devis/copy-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: photo.image_url,
                    devisId: devisId || reference || 'devis'
                })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.imageUrl) {
                    devisImageUrl = data.imageUrl
                }
            }
        } catch (e) {
            console.error('Erreur copie photo pour le devis:', e)
        }

        const newImageItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: photo.title || `Photo ${photo.category}`,
            quantity: 0,
            unit: '',
            unit_price: 0,
            tva: 0,
            item_type: 'image',
            image_url: devisImageUrl,
            caption: caption,
            details: {
                is_image: true,
                image_url: devisImageUrl,
                caption: caption,
                depot_photo_id: photo.id,
                devis_reference: photo.devis_reference,
                original_depot_url: photo.image_url
            }
        }
        setItems(prev => [...prev, newImageItem])
    }

    const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert("Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).")
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            const caption = file.name.replace(/\.[^/.]+$/, '')
            const newImageItem: DevisItem = {
                id: `new_${Date.now()}`,
                description: caption,
                quantity: 0,
                unit: '',
                unit_price: 0,
                tva: 0,
                item_type: 'image',
                image_url: dataUrl,
                caption: caption,
                details: {
                    is_image: true,
                    image_url: dataUrl,
                    caption: caption
                }
            }
            setItems(prev => [...prev, newImageItem])
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleReplaceImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            setItems(prev => prev.map(it => it.id === id ? {
                ...it,
                image_url: dataUrl,
                details: { ...it.details, image_url: dataUrl }
            } : it))
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleAddLine = () => {
        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'm²',
            unit_price: 0,
            tva: 10,
            item_type: 'item'
        }
        setItems([...items, newItem])
    }

    const handleAddSection = () => {
        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: '0. INSTALLATION DE CHANTIER',
            quantity: 0,
            unit: '',
            unit_price: 0,
            tva: 0,
            item_type: 'section'
        }
        setItems([...items, newItem])
    }

    const handleAddSubSection = () => {
        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: 'Démarches diverses :',
            quantity: 0,
            unit: '',
            unit_price: 0,
            tva: 0,
            item_type: 'sub_section'
        }
        setItems([...items, newItem])
    }

    const handleDeleteLine = async (id: string) => {
        const itemToDelete = items.find(i => i.id === id)
        let itemLabel = "cette ligne"
        if (itemToDelete?.item_type === 'section') itemLabel = "ce chapitre"
        else if (itemToDelete?.item_type === 'sub_section') itemLabel = "ce sous-chapitre"
        else if (itemToDelete?.item_type === 'image') itemLabel = "cette photo"
        else if (itemToDelete?.description) itemLabel = `la prestation « ${itemToDelete.description.trim().slice(0, 30)}${itemToDelete.description.length > 30 ? '...' : ''} »`

        const ok = await confirm({
            title: `Supprimer ${itemLabel} ?`,
            message: `Êtes-vous sûr de vouloir supprimer ${itemLabel} du devis ? Cette action est irréversible.`,
            confirmText: "Oui, supprimer",
            cancelText: "Non, annuler",
            variant: "danger"
        })
        if (!ok) return

        const previousItems = items
        setItems(items.filter(i => i.id !== id))

        if (!id.startsWith('new_')) {
            const res = await deleteDevisItem(id)
            if (!res?.success) {
                setItems(previousItems)
                alert("Erreur lors de la suppression")
            }
        }
    }

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedItems)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExpandedItems(newSet)
    }

    const openCalculator = (itemId: string) => {
        setCurrentCalcItem(itemId)
        setCalcModalOpen(true)
    }

    const handleCalculatorApply = (total: number, lines: any[]) => {
        if (currentCalcItem) {
            setItems(prev => prev.map(item =>
                item.id === currentCalcItem ? { ...item, quantity: total, details: lines } : item
            ))
        }
        setCalcModalOpen(false)
        setCurrentCalcItem(null)
    }

    const openDetailModal = (item: DevisItem) => {
        setCurrentDetailItem(item)
        setDetailModalOpen(true)
    }

    const handleDetailSave = (updated: DevisLineData) => {
        setItems(prev => prev.map(item =>
            item.id === updated.id ? { ...item, ...updated } : item
        ))
    }

    const handleSave = async (targetStatus?: string) => {
        setLoading(true)
        const res = await saveDevis(devisId, items, {
            name,
            status: targetStatus
        })
        setLoading(false)
        if (res?.success) {
            // Success
        } else {
            alert("Erreur lors de l'enregistrement" + (res?.error ? ` : ${res.error}` : ''))
        }
    }

    // Calcul des totaux en temps réel (Exclure les sections, sous-sections, images et variantes non totalisées)
    const calculableItems = items.filter(i => i.item_type !== 'section' && i.item_type !== 'sub_section' && i.item_type !== 'image' && !i.dont_totalize)
    const totalHT = calculableItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)), 0)
    const totalTVA = calculableItems.reduce((sum, item) => {
        const lineHT = item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)
        return sum + (lineHT * ((item.tva || 10) / 100))
    }, 0)
    const totalTTC = totalHT + totalTVA
    const acompteMontant = (totalTTC * acomptePct) / 100

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

    const handleGenerateCustomPdf = async (pdfConfig: DevisPdfColumnConfig) => {
        const devisData = {
            id: devisId,
            name: name,
            reference: reference,
            status: initialStatus,
            date_emission: dateEmission,
            total_ht: totalHT,
            total_ttc: totalTTC,
            devis_items: items,
            chantiers: {
                name: chantierName,
                clients: client
            }
        }
        await generateCustomDevisPDF(devisData, pdfConfig)
    }

    const currentItemDetails = items.find(i => i.id === currentCalcItem)?.details || []

    const handleSelectArticle = (article: any) => {
        const nameParts = (article.name || '').split('\n')
        const designation = nameParts[0]
        const complement = nameParts[1] || ''

        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: designation,
            complement: complement,
            reference: article.reference || '',
            quantity: 1,
            unit: article.unit || 'u',
            unit_price: article.price_ht || 0,
            cost_mat: article.cost_ht || 0,
            tva: article.tva || 10,
            article_id: article.id,
            item_type: 'item'
        }
        setItems([...items, newItem])
        setIsSelectorOpen(false)
    }

    return (
        <div className="h-full flex flex-col min-h-0">

            {/* --- MODALS --- */}
            <ArticleSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                articles={localArticles}
                onSelect={handleSelectArticle}
            />

            <ImportToLibraryModal
                isOpen={isImportToBiblioOpen}
                onClose={() => setIsImportToBiblioOpen(false)}
                candidateItems={importableItems}
                onSuccess={handleSavedToLibrary}
            />

            <CalculatorPopover
                isOpen={calcModalOpen}
                onClose={() => setCalcModalOpen(false)}
                onApply={handleCalculatorApply}
                initialLines={currentItemDetails}
            />

            <DevisLineDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                item={currentDetailItem as any}
                onSave={handleDetailSave}
            />

            <DevisPdfExportModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                onGenerate={handleGenerateCustomPdf}
                devisReference={reference || name || 'BTP'}
            />

            {/* --- LAYOUT SCINDÉ GAUCHE / DROITE (100% de la hauteur, sans scroll global) --- */}
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3.5">

                {/* ======================================================== */}
                {/* COLONNE GAUCHE (8 colonnes) : ZONE DE SAISIE DU DEVIS    */}
                {/* ======================================================== */}
                <div className="xl:col-span-8 h-full flex flex-col gap-2.5 min-h-0">

                    {/* 1. NOM DU DEVIS (Libellé principal des travaux) */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-2.5 px-3.5 shadow-xs">
                        <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Nom du devis (Libellé principal des travaux)
                            </label>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {items.length} {items.length > 1 ? 'lignes' : 'ligne'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: RAVALEMENT SIMPLE DES 5 BÂTIMENTS"
                            className="w-full bg-transparent text-base md:text-lg font-bold text-slate-900 placeholder-slate-400 outline-none border-none p-0 focus:ring-0 dark:text-white dark:placeholder-slate-600"
                        />
                    </div>

                    {/* 2. BARRE D'OUTILS D'AJOUT DE LIGNES (PillButtons) */}
                    <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                        <PillButton
                            onClick={handleAddLine}
                            variant="primary"
                            icon={<Plus size={13} />}
                        >
                            Ajouter ligne
                        </PillButton>

                        <PillButton
                            onClick={handleAddSection}
                            variant="secondary"
                            icon={<Layout size={13} />}
                        >
                            Chapitre
                        </PillButton>

                        <PillButton
                            onClick={handleAddSubSection}
                            variant="secondary"
                            icon={<FolderPlus size={13} />}
                        >
                            Sous-chapitre
                        </PillButton>

                        <PillButton
                            onClick={handleTriggerImageUpload}
                            variant="secondary"
                            icon={<ImageIcon size={13} />}
                        >
                            Insérer image
                        </PillButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileSelected}
                            className="hidden"
                        />

                        <PillButton
                            onClick={() => setIsSelectorOpen(true)}
                            variant="ai"
                            icon={<Box size={13} />}
                        >
                            Bibliothèque
                        </PillButton>

                        <PillButton
                            onClick={() => setIsImportToBiblioOpen(true)}
                            disabled={importableItems.length === 0}
                            variant="secondary"
                            icon={<BookmarkPlus size={13} />}
                            title={
                                importableItems.length === 0
                                    ? "Remplissez une nouvelle ligne (désignation, unité, prix) pour l'importer en bibliothèque"
                                    : `Importer ${importableItems.length} nouvelle(s) prestation(s) dans la bibliothèque`
                            }
                        >
                            Importer{importableItems.length > 0 ? ` (${importableItems.length})` : ''}
                        </PillButton>

                        <PillButton
                            onClick={() => setIsPdfModalOpen(true)}
                            variant="secondary"
                            icon={<FileDown size={13} />}
                        >
                            Exporter PDF
                        </PillButton>
                    </div>

                    {/* 3. TABLEAU DES PRESTATIONS DU DEVIS (Scroll interne exclusif) */}
                    <div className="flex-1 min-h-0 overflow-hidden rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] flex flex-col shadow-xs">
                        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0E1524] border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-2 py-2 w-12 text-center" title="Glisser ou cliquer pour intervertir">Ordre</th>
                                        <th className="px-3 py-2 w-16">Réf.</th>
                                        <th className="px-3 py-2">Désignation des travaux</th>
                                        <th className="px-3 py-2 w-20 text-center">Qté</th>
                                        <th className="px-3 py-2 w-14 text-center">Unité</th>
                                        <th className="px-3 py-2 w-20 text-right">PU HT</th>
                                        <th className="px-3 py-2 w-14 text-right">TVA</th>
                                        <th className="px-3 py-2 w-24 text-right">Montant HT</th>
                                        <th className="px-3 py-2 w-14 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                                                Ce devis est vide. Commencez par ajouter des chapitres, des prestations ou des photos depuis la barre d'outils.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => {
                                            // Handle drag & drop slide styles
                                            const isDragged = draggedIndex === index
                                            const isDragOver = dragOverIndex === index

                                            // 1. RENDER SECTION (CHAPITRE)
                                            if (item.item_type === 'section') {
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`bg-slate-100/80 border-t-2 border-slate-300 hover:bg-slate-200/80 transition-colors group dark:bg-blue-950/40 dark:border-blue-500/30 dark:hover:bg-blue-900/40 ${
                                                            isDragged ? 'opacity-40' : ''
                                                        } ${isDragOver ? 'border-t-4 border-indigo-600 bg-indigo-100/50' : ''}`}
                                                    >
                                                        {/* Poignée de réorganisation */}
                                                        <td className="px-1 py-1.5 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <span
                                                                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                                    title="Glisser pour déplacer ce chapitre"
                                                                >
                                                                    <GripVertical size={13} />
                                                                </span>
                                                                <div className="flex flex-col -space-y-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'up')}
                                                                        disabled={index === 0}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ArrowUp size={9} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'down')}
                                                                        disabled={index === items.length - 1}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ArrowDown size={9} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td colSpan={7} className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-indigo-600 text-white font-mono text-[10px] font-bold shadow-xs">
                                                                    §
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                    className="w-full bg-transparent font-extrabold text-xs uppercase tracking-wide text-slate-900 placeholder-slate-400 outline-none dark:text-blue-200 dark:placeholder-slate-500"
                                                                    placeholder="Nom du chapitre (ex: 0. INSTALLATION DE CHANTIER)"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-center">
                                                            <button
                                                                onClick={() => handleDeleteLine(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                title="Supprimer ce chapitre"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // 2. RENDER SUB-SECTION (SOUS-CHAPITRE)
                                            if (item.item_type === 'sub_section') {
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`bg-slate-50/60 border-t border-dashed border-slate-200 hover:bg-slate-100/60 transition-colors group dark:bg-white/[0.02] dark:border-slate-800 dark:hover:bg-white/[0.04] ${
                                                            isDragged ? 'opacity-40' : ''
                                                        } ${isDragOver ? 'border-t-4 border-indigo-600 bg-indigo-100/50' : ''}`}
                                                    >
                                                        {/* Poignée de réorganisation */}
                                                        <td className="px-1 py-1.5 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <span
                                                                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                                    title="Glisser pour déplacer ce sous-chapitre"
                                                                >
                                                                    <GripVertical size={13} />
                                                                </span>
                                                                <div className="flex flex-col -space-y-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'up')}
                                                                        disabled={index === 0}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ArrowUp size={9} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'down')}
                                                                        disabled={index === items.length - 1}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ArrowDown size={9} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td colSpan={7} className="px-3 py-1.5 pl-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <FolderPlus size={13} className="text-indigo-500 shrink-0" />
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                    className="w-full bg-transparent font-semibold text-xs tracking-wide text-slate-800 placeholder-slate-400 italic outline-none dark:text-slate-200"
                                                                    placeholder="Sous-chapitre (ex: Démarches diverses :)"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-center">
                                                            <button
                                                                onClick={() => handleDeleteLine(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                title="Supprimer ce sous-chapitre"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // 3. RENDER IMAGE (PHOTO / VISUEL ENTRE LES LIGNES)
                                            if (item.item_type === 'image') {
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`bg-indigo-50/30 border-y-2 border-indigo-200/80 hover:bg-indigo-50/50 transition-colors group dark:bg-indigo-950/20 dark:border-indigo-800/60 ${
                                                            isDragged ? 'opacity-40' : ''
                                                        } ${isDragOver ? 'border-t-4 border-indigo-600 bg-indigo-100/50' : ''}`}
                                                    >
                                                        {/* Poignée de réorganisation */}
                                                        <td className="px-1 py-2 text-center align-middle">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <span
                                                                    className="cursor-grab active:cursor-grabbing p-1 text-indigo-500 hover:text-indigo-700 rounded transition-colors"
                                                                    title="Glisser pour déplacer cette photo"
                                                                >
                                                                    <GripVertical size={13} />
                                                                </span>
                                                                <div className="flex flex-col -space-y-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'up')}
                                                                        disabled={index === 0}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ArrowUp size={9} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'down')}
                                                                        disabled={index === items.length - 1}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ArrowDown size={9} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Contenu photo pleine largeur */}
                                                        <td colSpan={7} className="px-3 py-2.5">
                                                            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-[#131B2A] p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                                                                {/* Miniature photo */}
                                                                <div className="relative group/photo shrink-0">
                                                                    {item.image_url ? (
                                                                        <img
                                                                            src={item.image_url}
                                                                            alt={item.description || 'Photo devis'}
                                                                            className="h-20 w-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-20 w-32 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                                                            <ImageIcon size={20} />
                                                                        </div>
                                                                    )}
                                                                    <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-opacity text-[10px] font-semibold gap-1">
                                                                        <Upload size={13} />
                                                                        Changer
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleReplaceImage(item.id, e)}
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                </div>

                                                                {/* Légende modifiable */}
                                                                <div className="flex-1 w-full space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded border border-indigo-200/60 dark:border-indigo-800/40">
                                                                            <ImageIcon size={10} /> Photo insérée entre les lignes
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setReplacingItemId(item.id)
                                                                                setIsDepotPickerOpen(true)
                                                                            }}
                                                                            className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                                                        >
                                                                            <FolderArchive size={10} /> Remplacer depuis le Dépôt
                                                                        </button>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={item.description}
                                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-medium focus:border-indigo-500 outline-none"
                                                                        placeholder="Légende / commentaire de la photo (ex: État des lieux initial)"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Supprimer photo */}
                                                        <td className="px-3 py-1.5 text-center align-middle">
                                                            <button
                                                                onClick={() => handleDeleteLine(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                title="Supprimer cette photo"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // 4. RENDER STANDARD ITEM (LIGNE DE DEVIS BTP)
                                            return (
                                                <Fragment key={item.id}>
                                                    <tr
                                                        draggable
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`hover:bg-slate-50/80 dark:hover:bg-[#162032] transition-colors group relative ${
                                                            item.dont_totalize ? 'opacity-70 bg-amber-50/30 dark:bg-amber-500/5' : ''
                                                        } ${isDragged ? 'opacity-40' : ''} ${
                                                            isDragOver ? 'border-t-4 border-indigo-600 bg-indigo-100/50' : ''
                                                        }`}
                                                    >
                                                        {/* Poignée de réorganisation */}
                                                        <td className="px-1 py-1.5 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <span
                                                                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                                    title="Glisser pour déplacer cette prestation"
                                                                >
                                                                    <GripVertical size={13} />
                                                                </span>
                                                                <div className="flex flex-col -space-y-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'up')}
                                                                        disabled={index === 0}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ArrowUp size={9} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveItem(index, 'down')}
                                                                        disabled={index === items.length - 1}
                                                                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ArrowDown size={9} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Référence */}
                                                        <td className="px-3 py-1.5">
                                                            <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50">
                                                                {item.reference || '-'}
                                                            </span>
                                                        </td>

                                                        {/* Désignation & Complément */}
                                                        <td className="px-3 py-1.5">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    {item.components && item.components.length > 0 && (
                                                                        <button
                                                                            onClick={() => toggleExpand(item.id)}
                                                                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                                                                        >
                                                                            <ChevronRight
                                                                                size={13}
                                                                                className={`transition-transform duration-200 ${expandedItems.has(item.id) ? 'rotate-90' : ''}`}
                                                                            />
                                                                        </button>
                                                                    )}
                                                                    <input
                                                                        type="text"
                                                                        value={item.description}
                                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                        className="w-full bg-transparent p-0.5 outline-none font-medium focus:border-b focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                                                                        placeholder="Description des travaux"
                                                                    />
                                                                    {item.dont_totalize && (
                                                                        <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 px-1 py-0.2 rounded">
                                                                            Option
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {item.complement && (
                                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 italic">
                                                                        {item.complement}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Quantité */}
                                                        <td className="px-3 py-1.5 relative group/qty">
                                                            <div className="flex items-center gap-0.5 justify-center">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    className="w-14 bg-transparent p-0.5 outline-none text-center font-medium focus:border-b focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                                                                />
                                                                <button
                                                                    onClick={() => openCalculator(item.id)}
                                                                    className="text-slate-400 hover:text-violet-500 opacity-0 group-hover/qty:opacity-100 transition-opacity absolute right-0 cursor-pointer"
                                                                    title="Minute de métré"
                                                                >
                                                                    <Calculator size={11} />
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Unité */}
                                                        <td className="px-3 py-1.5">
                                                            <input
                                                                type="text"
                                                                value={item.unit}
                                                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                                className="w-full bg-transparent p-0.5 outline-none text-center font-mono text-[10px] text-slate-500 focus:border-b focus:border-indigo-500"
                                                            />
                                                        </td>

                                                        {/* PU HT */}
                                                        <td className="px-3 py-1.5 text-right">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-transparent p-0.5 outline-none text-right font-semibold text-xs text-emerald-600 focus:border-b focus:border-emerald-500 dark:text-emerald-400"
                                                            />
                                                        </td>

                                                        {/* TVA */}
                                                        <td className="px-3 py-1.5 text-right text-slate-400 dark:text-slate-500 text-[10px]">
                                                            {item.tva || 10}%
                                                        </td>

                                                        {/* Montant HT */}
                                                        <td className="px-3 py-1.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                                                            {(item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)).toFixed(2)} €
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-3 py-1.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => openDetailModal(item)}
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                                                    title="Étude de prix, déboursé & options BTP"
                                                                >
                                                                    <Sliders size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLine(item.id)}
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* EXPANDED OUVRAGE */}
                                                    {item.components && expandedItems.has(item.id) && (
                                                        <tr className="bg-slate-50/70 border-b border-slate-100 dark:bg-white/[0.02] dark:border-slate-800">
                                                            <td colSpan={9} className="px-3.5 py-2 pl-12">
                                                                <div className="text-[10px] uppercase text-slate-400 mb-1 font-semibold tracking-wider flex items-center gap-2">
                                                                    <span>📦 Composition de l'ouvrage</span>
                                                                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    {item.components.map((comp, idx) => (
                                                                        <div key={idx} className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                            <div className="w-14 text-right font-medium text-slate-500">{comp.quantity} {comp.unit}</div>
                                                                            <div className="text-slate-700 dark:text-slate-300">{comp.name}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* DISPLAY DETAILS (Métré) if present */}
                                                    {item.details && item.details.length > 0 && (
                                                        <tr className="bg-violet-50/60 border-b border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30">
                                                            <td colSpan={9} className="px-3.5 py-1.5 pl-12 text-[10px] text-violet-700 font-mono dark:text-violet-300">
                                                                <span className="mr-2 opacity-70">Minute :</span>
                                                                {item.details.map((d: any, i: number) => (
                                                                    <span key={i} className="mr-2.5">
                                                                        {d.label ? <span className="text-violet-600 dark:text-violet-400">{d.label}: </span> : ''}
                                                                        {d.expression} = {d.result}
                                                                    </span>
                                                                ))}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PIED DE CARTE FIXÉ EN BAS (Toujours ancré en bas, exactement comme demandé) */}
                        <div className="shrink-0 bg-slate-50/95 dark:bg-[#0E1524] border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                {calculableItems.length} prestation(s) chiffrée(s)
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total HT
                                </span>
                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                    {totalHT.toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* COLONNE DROITE (4 colonnes) : BTP INFO, TOTAUX & ACTIONS  */}
                {/* ======================================================== */}
                <div className="xl:col-span-4 h-full flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-1 scrollbar-thin">

                    {/* 1. CARTE INFOS CHANTIER & PRO BTP (EN HAUT À LA DEMANDE DE L'UTILISATEUR) */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Informations Chantier
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {reference || `D26-${devisId.slice(0, 8).toUpperCase()}`}
                            </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                            <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Chantier</span>
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                                    {chantierName || 'RESIDENCE LES JASMINS'}
                                </p>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                    Émission : {dateEmission ? new Date(dateEmission).toLocaleDateString('fr-FR') : '15/10/2026'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                                <div>
                                    <label className="block text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-0.5">Métier</label>
                                    <select
                                        value={metier}
                                        onChange={(e) => setMetier(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                                    >
                                        <option value="RAVALEMENT">RAVALEMENT</option>
                                        <option value="MAÇONNERIE">MAÇONNERIE</option>
                                        <option value="PEINTURE">PEINTURE</option>
                                        <option value="COUVERTURE">COUVERTURE</option>
                                        <option value="ISOLATION">ISOLATION</option>
                                        <option value="ÉLECTRICITÉ">ÉLECTRICITÉ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-0.5">Type mission</label>
                                    <input
                                        type="text"
                                        value={missionType}
                                        onChange={(e) => setMissionType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payeur / Syndic */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Building2 size={11} className="text-blue-500" /> Payeur (Syndic)
                                </span>
                                <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-mono dark:bg-blue-500/10 dark:text-blue-400">
                                    Copro
                                </span>
                            </div>
                            <input
                                type="text"
                                value={payeurName}
                                onChange={(e) => setPayeurName(e.target.value)}
                                placeholder="Nom du Syndic"
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                            />
                            <input
                                type="text"
                                value={payeurAddress}
                                onChange={(e) => setPayeurAddress(e.target.value)}
                                placeholder="Adresse"
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 outline-none"
                            />
                        </div>

                        {/* Responsables */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase block">Technicien</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{technicien}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase block">Commercial</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{commercial}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. CARTE FINANCIÈRE RÉCAPITULATIVE (Totaux & Acompte) */}
                    <div className="flex-1 min-h-fit rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs flex flex-col justify-between space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Récapitulatif Financier
                        </span>

                        {/* Grand Total TTC */}
                        <div className="rounded-xl p-2.5 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/25">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Montant Total TTC
                            </span>
                            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                                {totalTTC.toFixed(2)} €
                            </div>
                        </div>

                        {/* Total HT & TVA */}
                        <div className="space-y-1 text-xs pt-0.5 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-xs">
                                <span>Total HT brut</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{totalHT.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 text-[10px]">
                                <span>TVA estimée (10%)</span>
                                <span className="font-mono">{totalTVA.toFixed(2)} €</span>
                            </div>
                        </div>

                        {/* Acompte contractuel */}
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                                    Acompte contractuel
                                </span>
                                <div className="text-sm font-extrabold text-amber-800 dark:text-amber-300 font-mono">
                                    {acompteMontant.toFixed(2)} €
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={acomptePct}
                                    onChange={(e) => setAcomptePct(parseFloat(e.target.value) || 0)}
                                    className="w-10 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-black/40 px-1 py-0.5 text-center font-bold text-xs text-amber-900 dark:text-amber-200 outline-none"
                                />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. ACTIONS DE VALIDATION DU DEVIS (PillButtons - EN BAS DE LA COLONNE DROITE) */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Actions Devis
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                {initialStatus}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Enregistrer (Action principale) */}
                            <PillButton
                                onClick={() => {
                                    const nextStatus = initialStatus === 'brouillon' ? 'en_attente' : undefined
                                    handleSave(nextStatus)
                                }}
                                disabled={loading}
                                loading={loading}
                                variant="primary"
                                icon={<Save size={13} />}
                                className="flex-1 text-xs py-1.5"
                            >
                                Enregistrer
                            </PillButton>

                            {/* Approbation (Conversion facture) */}
                            <PillButton
                                onClick={async () => {
                                    const ok = await confirm({
                                        title: "Valider le devis et facturer ?",
                                        message: "Êtes-vous sûr de vouloir approuver ce devis et créer la facture correspondante ?",
                                        confirmText: "Oui, valider et facturer",
                                        cancelText: "Non, annuler",
                                        variant: "info"
                                    })
                                    if (!ok) return
                                    setLoading(true)
                                    await handleSave('en_attente_approbation')
                                    const { convertDevisToFacture } = await import('@/app/actions/factures')
                                    const res = await convertDevisToFacture(devisId)

                                    if (res?.success) {
                                        alert("Devis approuvé et facture créée !")
                                    } else {
                                        alert("Erreur lors de la création de la facture")
                                    }
                                    setLoading(false)
                                }}
                                disabled={loading}
                                variant="success"
                                icon={<CheckCircle2 size={13} />}
                                className="text-xs py-1.5"
                            >
                                Approbation
                            </PillButton>
                        </div>

                        <PillButton
                            onClick={() => setIsPdfModalOpen(true)}
                            variant="secondary"
                            icon={<FileDown size={13} />}
                            className="w-full text-xs py-1.5"
                        >
                            Exporter PDF (Personnaliser...)
                        </PillButton>

                        {/* Actions secondaires en ligne compacte */}
                        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                                onClick={() => handleSave('brouillon')}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Enregistrer comme brouillon"
                            >
                                <FileText size={12} />
                                Brouillon
                            </button>

                            <button
                                onClick={async () => {
                                    const p = prompt("Pourcentage de l'acompte (ex: 40) ?", acomptePct.toString())
                                    if (!p || isNaN(Number(p))) return
                                    setLoading(true)
                                    const { createAcompte } = await import('@/app/actions/factures')
                                    const res = await createAcompte(devisId, Number(p))
                                    if (res?.success) {
                                        window.location.href = `/dashboard/factures/${res.factureId}/edit`
                                    } else {
                                        alert(res?.error || "Erreur")
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Créer une facture d'acompte"
                            >
                                <Wallet size={12} />
                                Acompte
                            </button>

                            <button
                                onClick={async () => {
                                    const ok = await confirm({
                                        title: "Créer une situation de travaux ?",
                                        message: "Êtes-vous sûr de vouloir créer une situation de travaux pour ce devis ?",
                                        confirmText: "Oui, créer la situation",
                                        cancelText: "Non, annuler",
                                        variant: "info"
                                    })
                                    if (!ok) return
                                    setLoading(true)
                                    const { createSituation } = await import('@/app/actions/factures')
                                    const res = await createSituation(devisId)
                                    if (res?.success) {
                                        window.location.href = `/dashboard/factures/${res.factureId}/edit`
                                    } else {
                                        alert(res?.error || "Erreur")
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Créer une facture de situation"
                            >
                                <Calendar size={12} />
                                Situation
                            </button>
                        </div>
                    </div>
                </div>


            {/* Modal de Choix Source Image (Ordinateur ou Dépôt Mobile) */}
            {isImageChoiceOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="max-w-md w-full bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <ImageIcon size={16} className="text-violet-400" />
                                Insérer une photo dans le devis
                            </h3>
                            <button
                                onClick={() => setIsImageChoiceOpen(false)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="text-xs text-slate-400">
                            Choisissez la provenance du visuel à ajouter entre les prestations de votre devis :
                        </p>

                        <div className="grid grid-cols-1 gap-2.5 pt-1">
                            {/* Option 1: Dépôt Photos Chantier */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsImageChoiceOpen(false)
                                    setReplacingItemId(null)
                                    setIsDepotPickerOpen(true)
                                }}
                                className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/40 hover:border-violet-500 text-left transition-all hover:scale-[1.01] cursor-pointer group flex items-start gap-3.5 shadow-xs"
                            >
                                <div className="p-2.5 rounded-xl bg-violet-600 text-white shrink-0 group-hover:bg-violet-500 transition-colors">
                                    <FolderArchive size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">Depuis le Dépôt Photos</span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">
                                            KOTA Mobile
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                        {reference 
                                            ? `Sélectionnez un cliché pris avec le smartphone rattaché au devis ${reference}.`
                                            : 'Accédez aux photos de chantiers prises avec votre smartphone.'}
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Depuis mon ordinateur */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsImageChoiceOpen(false)
                                    fileInputRef.current?.click()
                                }}
                                className="p-4 rounded-2xl bg-[#141C2E] border border-slate-800 hover:border-slate-700 text-left transition-all hover:scale-[1.01] cursor-pointer group flex items-start gap-3.5"
                            >
                                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 shrink-0 group-hover:bg-slate-700 transition-colors">
                                    <Laptop size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-white">Importer depuis mon ordinateur</span>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                        Choisissez un fichier image sur votre disque dur (JPEG, PNG, WebP).
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Sélecteur Dépôt Photos */}
            <DepotPhotoPickerModal
                isOpen={isDepotPickerOpen}
                onClose={() => {
                    setIsDepotPickerOpen(false)
                    setReplacingItemId(null)
                }}
                currentDevisReference={reference}
                onSelectPhoto={async (photo) => {
                    let devisImageUrl = photo.image_url
                    try {
                        const res = await fetch('/api/devis/copy-photo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                imageUrl: photo.image_url,
                                devisId: devisId || reference || 'devis'
                            })
                        })
                        if (res.ok) {
                            const data = await res.json()
                            if (data.success && data.imageUrl) {
                                devisImageUrl = data.imageUrl
                            }
                        }
                    } catch (e) {
                        console.error('Erreur copie photo:', e)
                    }

                    if (replacingItemId) {
                        setItems(prev => prev.map(it => it.id === replacingItemId ? {
                            ...it,
                            image_url: devisImageUrl,
                            caption: photo.title || photo.notes || 'Photo du Dépôt',
                            details: { ...it.details, image_url: devisImageUrl, caption: photo.title || photo.notes }
                        } : it))
                        setReplacingItemId(null)
                    } else {
                        handleSelectDepotPhoto(photo)
                    }
                }}
            />

            </div>
        </div>
    )
}