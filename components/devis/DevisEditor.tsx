'use client'

import Link from 'next/link'
import { useState, useEffect, Fragment } from 'react'
import {
    Plus, Trash2, Save, Calculator, Loader2, FileText, ChevronRight,
    Layout, GripVertical, Wallet, Calendar, Sliders, FolderPlus,
    Building2, UserCheck, ShieldCheck, CheckCircle2, Tag
} from 'lucide-react'
import ArticleSelector from './ArticleSelector'
import CalculatorPopover from './CalculatorPopover'
import DevisLineDetailModal, { DevisLineData } from './DevisLineDetailModal'
import { saveDevis, deleteDevisItem } from '@/app/actions/devis'

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
    item_type?: 'item' | 'section' | 'sub_section'
    details?: any
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
    const [items, setItems] = useState<DevisItem[]>(initialItems)
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

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

    const handleItemChange = (id: string, field: keyof DevisItem, value: any) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
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
            alert("Erreur lors de l'enregistrement")
        }
    }

    // Calcul des totaux en temps réel (Exclure les sections, sous-sections et variantes non totalisées)
    const calculableItems = items.filter(i => i.item_type !== 'section' && i.item_type !== 'sub_section' && !i.dont_totalize)
    const totalHT = calculableItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)), 0)
    const totalTVA = calculableItems.reduce((sum, item) => {
        const lineHT = item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)
        return sum + (lineHT * ((item.tva || 10) / 100))
    }, 0)
    const totalTTC = totalHT + totalTVA
    const acompteMontant = (totalTTC * acomptePct) / 100

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
        <div className="space-y-6">

            {/* --- MODALS --- */}
            <ArticleSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                articles={articles}
                onSelect={handleSelectArticle}
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

            {/* EN-TÊTE PRO BTP (Issu de Batiecom BLUE SELECT - Photos 1 & 4) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Colonne 1: Réf & Chantier */}
                    <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pr-4 pb-4 md:pb-0">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Devis N°</span>
                            <div className="font-mono text-base font-bold text-gray-900 dark:text-white">
                                {reference || `D26-${devisId.slice(0, 8).toUpperCase()}`}
                            </div>
                            <span className="text-xs text-gray-500">{dateEmission ? new Date(dateEmission).toLocaleDateString('fr-FR') : '15/10/2026'}</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Chantier</span>
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{chantierName || 'RESIDENCE LES JASMINS'}</p>
                        </div>
                    </div>

                    {/* Colonne 2: Métier & Type de mission */}
                    <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pr-4 pb-4 md:pb-0">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Métier</label>
                            <select
                                value={metier}
                                onChange={(e) => setMetier(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
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
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Type de mission</label>
                            <input
                                type="text"
                                value={missionType}
                                onChange={(e) => setMissionType(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Colonne 3: Payeur / Syndic vs Client */}
                    <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pr-4 pb-4 md:pb-0">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                <Building2 size={13} className="text-blue-500" /> Payeur (Syndic)
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono dark:bg-blue-500/10 dark:text-blue-400">
                                Copro
                            </span>
                        </div>
                        <input
                            type="text"
                            value={payeurName}
                            onChange={(e) => setPayeurName(e.target.value)}
                            placeholder="Nom du Syndic / Gestionnaire"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                        />
                        <input
                            type="text"
                            value={payeurAddress}
                            onChange={(e) => setPayeurAddress(e.target.value)}
                            placeholder="Adresse"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 dark:border-white/10 dark:bg-black/20 dark:text-gray-300"
                        />
                    </div>

                    {/* Colonne 4: Équipe & Acompte */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Technicien</span>
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{technicien}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Commercial</span>
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{commercial}</p>
                            </div>
                        </div>

                        {/* Bloc Acompte en direct */}
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Acompte à verser
                                </span>
                                <div className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
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
                                    className="w-12 rounded-lg border border-amber-300 bg-white px-1.5 py-1 text-center font-bold text-xs text-amber-900 dark:border-amber-500/30 dark:bg-black/40 dark:text-amber-200"
                                />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAMP NOM DU DEVIS */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-sm">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Nom du devis (Libellé principal des travaux)
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: RAVALEMENT SIMPLE DES 5 BÂTIMENTS"
                    className="w-full bg-transparent text-xl font-bold text-gray-900 placeholder-gray-400 outline-none border-none p-0 focus:ring-0 dark:text-white dark:placeholder-gray-600"
                />
            </div>

            {/* BARRE D'OUTILS (Boutons d'action) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <button
                    onClick={handleAddLine}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                    <Plus size={16} />
                    Ajouter ligne
                </button>
                <button
                    onClick={handleAddSection}
                    className="flex items-center gap-2 rounded-xl bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20"
                >
                    <Layout size={16} />
                    Chapitre
                </button>
                <button
                    onClick={handleAddSubSection}
                    className="flex items-center gap-2 rounded-xl bg-white border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20"
                >
                    <FolderPlus size={16} />
                    Sous-chapitre
                </button>
                <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                    <Calculator size={16} />
                    Bibliothèque
                </button>
                <div className="flex-1 min-w-[20px]" />

                {/* BOUTON BROUILLON */}
                <button
                    onClick={() => handleSave('brouillon')}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
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
                    className="flex items-center gap-2 rounded-xl bg-amber-600/20 border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-500 hover:bg-amber-600/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                    <Wallet size={16} />
                    Acompte
                </button>

                <button
                    onClick={async () => {
                        if (!confirm("Créer une situation de travaux pour ce devis ?")) return
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
                    className="flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-600/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                    <Calendar size={16} />
                    Situation
                </button>

                <div className="w-px bg-white/10 h-8 mx-1" />

                <button
                    onClick={async () => {
                        if (!confirm("Valider ce devis et créer la facture correspondante ?")) return
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
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                    <FileText size={16} />
                    Approbation
                </button>

                <button
                    onClick={() => {
                        const nextStatus = initialStatus === 'brouillon' ? 'en_attente' : undefined
                        handleSave(nextStatus)
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {loading ? '...' : 'Enregistrer'}
                </button>
            </div>

            {/* TABLEAU ÉDITABLE (Style Batiecom BLUE SELECT avec Glassmorphism) */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 dark:bg-black/20 dark:border-white/5">
                        <tr>
                            <th className="px-4 py-3 font-semibold w-24">Réf.</th>
                            <th className="px-4 py-3 font-semibold">Désignation des travaux</th>
                            <th className="px-4 py-3 font-semibold w-28 text-center">Qté</th>
                            <th className="px-4 py-3 font-semibold w-20 text-center">Unité</th>
                            <th className="px-4 py-3 font-semibold w-28 text-right">PU HT</th>
                            <th className="px-4 py-3 font-semibold w-20 text-right">TVA</th>
                            <th className="px-4 py-3 font-semibold w-28 text-right">Montant HT</th>
                            <th className="px-4 py-3 w-16 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-500 italic">
                                    Ce devis est vide. Commencez par ajouter des chapitres ou des prestations depuis la bibliothèque.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => {
                                // 1. RENDER SECTION (CHAPITRE)
                                if (item.item_type === 'section') {
                                    return (
                                        <tr key={item.id} className="bg-slate-100 border-t-2 border-slate-300 hover:bg-slate-200 transition-colors group dark:bg-blue-950/40 dark:border-blue-500/30 dark:hover:bg-blue-900/40">
                                            <td colSpan={7} className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white font-mono text-xs font-bold shadow-sm">
                                                        §
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent font-extrabold text-sm uppercase tracking-wide text-gray-900 placeholder-gray-500 outline-none dark:text-blue-200 dark:placeholder-gray-400"
                                                        placeholder="Nom du chapitre (ex: 0. INSTALLATION DE CHANTIER)"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteLine(item.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Supprimer ce chapitre"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }

                                // 2. RENDER SUB-SECTION (SOUS-CHAPITRE)
                                if (item.item_type === 'sub_section') {
                                    return (
                                        <tr key={item.id} className="bg-gray-50/80 border-t border-dashed border-gray-200 hover:bg-gray-100 transition-colors group dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/5">
                                            <td colSpan={7} className="px-4 py-2.5 pl-8">
                                                <div className="flex items-center gap-2">
                                                    <FolderPlus size={15} className="text-blue-500" />
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent font-semibold text-xs tracking-wide text-gray-800 placeholder-gray-400 italic outline-none dark:text-gray-200"
                                                        placeholder="Sous-chapitre (ex: Démarches diverses :)"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteLine(item.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Supprimer ce sous-chapitre"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }

                                // 3. RENDER STANDARD ITEM (LIGNE DE DEVIS BTP)
                                return (
                                    <Fragment key={item.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors group relative dark:hover:bg-white/5 ${
                                            item.dont_totalize ? 'opacity-70 bg-amber-50/30 dark:bg-amber-500/5' : ''
                                        }`}>
                                            {/* Référence */}
                                            <td className="px-4 py-2.5">
                                                <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                                    {item.reference || '-'}
                                                </span>
                                            </td>

                                            {/* Désignation & Complément */}
                                            <td className="px-4 py-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {item.components && item.components.length > 0 && (
                                                            <button
                                                                onClick={() => toggleExpand(item.id)}
                                                                className="text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                <ChevronRight
                                                                    size={16}
                                                                    className={`transition-transform duration-200 ${expandedItems.has(item.id) ? 'rotate-90' : ''}`}
                                                                />
                                                            </button>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                            className="w-full bg-transparent p-1 outline-none font-medium focus:border-b focus:border-blue-500 text-gray-900 dark:text-white"
                                                            placeholder="Description des travaux"
                                                        />
                                                        {item.dont_totalize && (
                                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                                                Option
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.complement && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 pl-1 italic">
                                                            {item.complement}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Quantité */}
                                            <td className="px-4 py-2 relative group/qty">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-transparent p-1 outline-none text-center font-medium focus:border-b focus:border-blue-500 text-gray-900 dark:text-white"
                                                    />
                                                    <button
                                                        onClick={() => openCalculator(item.id)}
                                                        className="text-gray-400 hover:text-purple-500 opacity-0 group-hover/qty:opacity-100 transition-opacity absolute right-1"
                                                        title="Minute de métré"
                                                    >
                                                        <Calculator size={13} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Unité */}
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                    className="w-full bg-transparent p-1 outline-none text-center font-mono text-xs text-gray-500 focus:border-b focus:border-blue-500"
                                                />
                                            </td>

                                            {/* PU HT */}
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent p-1 outline-none text-right font-semibold text-emerald-600 focus:border-b focus:border-emerald-500 dark:text-emerald-400"
                                                />
                                            </td>

                                            {/* TVA */}
                                            <td className="px-4 py-2 text-right text-gray-500 text-xs">
                                                {item.tva || 10}%
                                            </td>

                                            {/* Montant HT */}
                                            <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">
                                                {(item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)).toFixed(2)} €
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openDetailModal(item)}
                                                        className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
                                                        title="Étude de prix, déboursé & options BTP"
                                                    >
                                                        <Sliders size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLine(item.id)}
                                                        className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* EXPANDED OUVRAGE */}
                                        {item.components && expandedItems.has(item.id) && (
                                            <tr className="bg-gray-50/50 border-b border-gray-100 dark:bg-white/[0.02] dark:border-white/5">
                                                <td colSpan={8} className="px-4 py-3 pl-14">
                                                    <div className="text-xs uppercase text-gray-500 mb-2 font-semibold tracking-wider flex items-center gap-2">
                                                        <span>📦 Composition de l'ouvrage</span>
                                                        <span className="h-px flex-1 bg-gray-200 dark:bg-white/5"></span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {item.components.map((comp, idx) => (
                                                            <div key={idx} className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                                <div className="w-16 text-right font-medium text-gray-500">{comp.quantity} {comp.unit}</div>
                                                                <div className="text-gray-700 dark:text-gray-300">{comp.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {/* DISPLAY DETAILS (Métré) if present */}
                                        {item.details && item.details.length > 0 && (
                                            <tr className="bg-purple-50 border-b border-purple-100 dark:bg-purple-900/10 dark:border-purple-500/10">
                                                <td colSpan={8} className="px-4 py-2 pl-14 text-xs text-purple-700 font-mono dark:text-purple-300">
                                                    <span className="mr-2 opacity-70">Minute de calcul :</span>
                                                    {item.details.map((d: any, i: number) => (
                                                        <span key={i} className="mr-4">
                                                            {d.label ? <span className="text-purple-600 dark:text-purple-400">{d.label}: </span> : ''}
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

                    {/* PIED DE TABLEAU (Totaux & Acompte BTP Batiecom) */}
                    <tfoot className="bg-gray-50/90 border-t-2 border-gray-200 font-medium dark:bg-black/30 dark:border-white/10">
                        <tr>
                            <td colSpan={6} className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">Total HT brut</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900 text-base dark:text-white">
                                {totalHT.toFixed(2)} €
                            </td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={6} className="px-4 py-1.5 text-right text-gray-500 text-xs">TVA estimée (taux intermédiaire 10%)</td>
                            <td className="px-4 py-1.5 text-right font-mono text-gray-500 text-xs">{totalTVA.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                        <tr className="border-t border-gray-200 dark:border-white/10">
                            <td colSpan={6} className="px-4 py-3 text-right text-gray-900 font-bold dark:text-white">
                                Montant Total TTC
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-600 font-black text-xl dark:text-blue-400">
                                {totalTTC.toFixed(2)} €
                            </td>
                            <td></td>
                        </tr>
                        <tr className="bg-amber-500/10 dark:bg-amber-500/15">
                            <td colSpan={6} className="px-4 py-3 text-right font-bold text-amber-800 dark:text-amber-300">
                                Acompte contractuel à verser ({acomptePct}%)
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-black text-amber-800 text-lg dark:text-amber-300">
                                {acompteMontant.toFixed(2)} €
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}