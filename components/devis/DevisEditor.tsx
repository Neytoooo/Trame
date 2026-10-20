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
import PillButton from '@/components/ui/PillButton'

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
        <div className="space-y-4">

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

            {/* --- LAYOUT SCINDÉ GAUCHE / DROITE --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

                {/* ======================================================== */}
                {/* COLONNE GAUCHE (8 colonnes) : ZONE DE SAISIE DU DEVIS    */}
                {/* ======================================================== */}
                <div className="xl:col-span-8 space-y-3.5">

                    {/* 1. NOM DU DEVIS (Libellé principal des travaux) */}
                    <div className="rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Nom du devis (Libellé principal des travaux)
                            </label>
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                {items.length} {items.length > 1 ? 'lignes' : 'ligne'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: RAVALEMENT SIMPLE DES 5 BÂTIMENTS"
                            className="w-full bg-transparent text-lg md:text-xl font-bold text-slate-900 placeholder-slate-400 outline-none border-none p-0 focus:ring-0 dark:text-white dark:placeholder-slate-600"
                        />
                    </div>

                    {/* 2. BARRE D'OUTILS D'AJOUT DE LIGNES (PillButtons) */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
                        <PillButton
                            onClick={handleAddLine}
                            variant="primary"
                            icon={<Plus size={14} />}
                        >
                            Ajouter ligne
                        </PillButton>

                        <PillButton
                            onClick={handleAddSection}
                            variant="secondary"
                            icon={<Layout size={14} />}
                        >
                            Chapitre
                        </PillButton>

                        <PillButton
                            onClick={handleAddSubSection}
                            variant="secondary"
                            icon={<FolderPlus size={14} />}
                        >
                            Sous-chapitre
                        </PillButton>

                        <PillButton
                            onClick={() => setIsSelectorOpen(true)}
                            variant="ai"
                            icon={<Calculator size={14} />}
                        >
                            Bibliothèque
                        </PillButton>
                    </div>

                    {/* 3. TABLEAU DES PRESTATIONS DU DEVIS (Scroll interne fluide) */}
                    <div className="overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
                        <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0E1524] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-3.5 py-3 w-20">Réf.</th>
                                        <th className="px-3.5 py-3">Désignation des travaux</th>
                                        <th className="px-3.5 py-3 w-24 text-center">Qté</th>
                                        <th className="px-3.5 py-3 w-16 text-center">Unité</th>
                                        <th className="px-3.5 py-3 w-24 text-right">PU HT</th>
                                        <th className="px-3.5 py-3 w-16 text-right">TVA</th>
                                        <th className="px-3.5 py-3 w-24 text-right">Montant HT</th>
                                        <th className="px-3.5 py-3 w-16 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-14 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                                                Ce devis est vide. Commencez par ajouter des chapitres ou des prestations depuis la bibliothèque.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => {
                                            // 1. RENDER SECTION (CHAPITRE)
                                            if (item.item_type === 'section') {
                                                return (
                                                    <tr key={item.id} className="bg-slate-100/80 border-t-2 border-slate-300 hover:bg-slate-200/80 transition-colors group dark:bg-blue-950/40 dark:border-blue-500/30 dark:hover:bg-blue-900/40">
                                                        <td colSpan={7} className="px-3.5 py-2.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white font-mono text-[11px] font-bold shadow-xs">
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
                                                        <td className="px-3.5 py-2 text-center">
                                                            <button
                                                                onClick={() => handleDeleteLine(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                title="Supprimer ce chapitre"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // 2. RENDER SUB-SECTION (SOUS-CHAPITRE)
                                            if (item.item_type === 'sub_section') {
                                                return (
                                                    <tr key={item.id} className="bg-slate-50/60 border-t border-dashed border-slate-200 hover:bg-slate-100/60 transition-colors group dark:bg-white/[0.02] dark:border-slate-800 dark:hover:bg-white/[0.04]">
                                                        <td colSpan={7} className="px-3.5 py-2 pl-7">
                                                            <div className="flex items-center gap-2">
                                                                <FolderPlus size={14} className="text-indigo-500 shrink-0" />
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                    className="w-full bg-transparent font-semibold text-xs tracking-wide text-slate-800 placeholder-slate-400 italic outline-none dark:text-slate-200"
                                                                    placeholder="Sous-chapitre (ex: Démarches diverses :)"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-3.5 py-2 text-center">
                                                            <button
                                                                onClick={() => handleDeleteLine(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                title="Supprimer ce sous-chapitre"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // 3. RENDER STANDARD ITEM (LIGNE DE DEVIS BTP)
                                            return (
                                                <Fragment key={item.id}>
                                                    <tr className={`hover:bg-slate-50/80 dark:hover:bg-[#162032] transition-colors group relative ${
                                                        item.dont_totalize ? 'opacity-70 bg-amber-50/30 dark:bg-amber-500/5' : ''
                                                    }`}>
                                                        {/* Référence */}
                                                        <td className="px-3.5 py-2">
                                                            <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50">
                                                                {item.reference || '-'}
                                                            </span>
                                                        </td>

                                                        {/* Désignation & Complément */}
                                                        <td className="px-3.5 py-2">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    {item.components && item.components.length > 0 && (
                                                                        <button
                                                                            onClick={() => toggleExpand(item.id)}
                                                                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                                                                        >
                                                                            <ChevronRight
                                                                                size={14}
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
                                                                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 px-1 py-0.5 rounded">
                                                                            Option
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {item.complement && (
                                                                    <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-1 italic">
                                                                        {item.complement}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Quantité */}
                                                        <td className="px-3.5 py-2 relative group/qty">
                                                            <div className="flex items-center gap-1 justify-center">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    className="w-16 bg-transparent p-0.5 outline-none text-center font-medium focus:border-b focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                                                                />
                                                                <button
                                                                    onClick={() => openCalculator(item.id)}
                                                                    className="text-slate-400 hover:text-violet-500 opacity-0 group-hover/qty:opacity-100 transition-opacity absolute right-0.5 cursor-pointer"
                                                                    title="Minute de métré"
                                                                >
                                                                    <Calculator size={12} />
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Unité */}
                                                        <td className="px-3.5 py-2">
                                                            <input
                                                                type="text"
                                                                value={item.unit}
                                                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                                className="w-full bg-transparent p-0.5 outline-none text-center font-mono text-[11px] text-slate-500 focus:border-b focus:border-indigo-500"
                                                            />
                                                        </td>

                                                        {/* PU HT */}
                                                        <td className="px-3.5 py-2 text-right">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-transparent p-0.5 outline-none text-right font-semibold text-xs text-emerald-600 focus:border-b focus:border-emerald-500 dark:text-emerald-400"
                                                            />
                                                        </td>

                                                        {/* TVA */}
                                                        <td className="px-3.5 py-2 text-right text-slate-400 dark:text-slate-500 text-[11px]">
                                                            {item.tva || 10}%
                                                        </td>

                                                        {/* Montant HT */}
                                                        <td className="px-3.5 py-2 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                                                            {(item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100)).toFixed(2)} €
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-3.5 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => openDetailModal(item)}
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                                                    title="Étude de prix, déboursé & options BTP"
                                                                >
                                                                    <Sliders size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLine(item.id)}
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* EXPANDED OUVRAGE */}
                                                    {item.components && expandedItems.has(item.id) && (
                                                        <tr className="bg-slate-50/70 border-b border-slate-100 dark:bg-white/[0.02] dark:border-slate-800">
                                                            <td colSpan={8} className="px-4 py-2.5 pl-12">
                                                                <div className="text-[10px] uppercase text-slate-400 mb-1.5 font-semibold tracking-wider flex items-center gap-2">
                                                                    <span>📦 Composition de l'ouvrage</span>
                                                                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                                                                </div>
                                                                <div className="space-y-1">
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
                                                            <td colSpan={8} className="px-4 py-1.5 pl-12 text-[11px] text-violet-700 font-mono dark:text-violet-300">
                                                                <span className="mr-2 opacity-70">Minute de calcul :</span>
                                                                {item.details.map((d: any, i: number) => (
                                                                    <span key={i} className="mr-3">
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
                                {/* Pied de tableau : Récapitulatif rapide HT */}
                                <tfoot className="bg-slate-50/90 dark:bg-[#0E1524] border-t border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <tr>
                                        <td colSpan={4} className="px-3.5 py-2.5 text-slate-400 dark:text-slate-500 text-[11px] font-normal">
                                            {calculableItems.length} prestation(s) chiffrée(s)
                                        </td>
                                        <td colSpan={2} className="px-3.5 py-2.5 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                                            Total HT
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {totalHT.toFixed(2)} €
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* COLONNE DROITE (4 colonnes) : ACTIONS, TOTAUX & BTP INFO */}
                {/* ======================================================== */}
                <div className="xl:col-span-4 space-y-3.5 xl:sticky xl:top-4">

                    {/* 1. ACTIONS DE VALIDATION DU DEVIS (PillButtons) */}
                    <div className="rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Actions Devis
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
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
                                icon={<Save size={14} />}
                                className="flex-1"
                            >
                                Enregistrer
                            </PillButton>

                            {/* Approbation (Conversion facture) */}
                            <PillButton
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
                                variant="success"
                                icon={<CheckCircle2 size={14} />}
                            >
                                Approbation
                            </PillButton>
                        </div>

                        {/* Actions secondaires en ligne compacte */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                                onClick={() => handleSave('brouillon')}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Enregistrer comme brouillon"
                            >
                                <FileText size={13} />
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
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Créer une facture d'acompte"
                            >
                                <Wallet size={13} />
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
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Créer une facture de situation"
                            >
                                <Calendar size={13} />
                                Situation
                            </button>
                        </div>
                    </div>

                    {/* 2. CARTE FINANCIÈRE RÉCAPITULATIVE (Totaux & Acompte) */}
                    <div className="rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Récapitulatif Financier
                        </span>

                        {/* Grand Total TTC */}
                        <div className="rounded-xl p-3.5 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/25">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Montant Total TTC
                            </span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                                {totalTTC.toFixed(2)} €
                            </div>
                        </div>

                        {/* Total HT & TVA */}
                        <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                <span>Total HT brut</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{totalHT.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 text-[11px]">
                                <span>TVA estimée (10%)</span>
                                <span className="font-mono">{totalTVA.toFixed(2)} €</span>
                            </div>
                        </div>

                        {/* Acompte contractuel */}
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                                    Acompte contractuel
                                </span>
                                <div className="text-base font-extrabold text-amber-800 dark:text-amber-300 font-mono">
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
                                    className="w-12 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-black/40 px-1.5 py-1 text-center font-bold text-xs text-amber-900 dark:text-amber-200 outline-none"
                                />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. CARTE INFOS CHANTIER & PRO BTP (Issu de Batiecom) */}
                    <div className="rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Informations Chantier
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {reference || `D26-${devisId.slice(0, 8).toUpperCase()}`}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Chantier</span>
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {chantierName || 'RESIDENCE LES JASMINS'}
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    Émission : {dateEmission ? new Date(dateEmission).toLocaleDateString('fr-FR') : '15/10/2026'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">Métier</label>
                                    <select
                                        value={metier}
                                        onChange={(e) => setMetier(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
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
                                    <label className="block text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">Type mission</label>
                                    <input
                                        type="text"
                                        value={missionType}
                                        onChange={(e) => setMissionType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payeur / Syndic */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Building2 size={12} className="text-blue-500" /> Payeur (Syndic)
                                </span>
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-mono dark:bg-blue-500/10 dark:text-blue-400">
                                    Copro
                                </span>
                            </div>
                            <input
                                type="text"
                                value={payeurName}
                                onChange={(e) => setPayeurName(e.target.value)}
                                placeholder="Nom du Syndic"
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                            />
                            <input
                                type="text"
                                value={payeurAddress}
                                onChange={(e) => setPayeurAddress(e.target.value)}
                                placeholder="Adresse"
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 outline-none"
                            />
                        </div>

                        {/* Responsables */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Technicien</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{technicien}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Commercial</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{commercial}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}