'use client'

import { useState, useEffect, Fragment } from 'react'
import { Plus, Trash2, Save, Box, Loader2, FileCheck, Calendar, Wallet, ChevronRight, Building2, User, Download } from 'lucide-react'
import ArticleSelector from '@/components/devis/ArticleSelector' // Reuse article selector
import { saveFacture, deleteFactureItem } from '@/app/actions/factures'
import { generateFacturePDF } from '@/utils/generatePdf'
import PillButton from '@/components/ui/PillButton'
import { useConfirm } from '@/components/ui/ConfirmProvider'

type FactureItem = {
    id: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    tva: number
    article_id?: string
    components?: { name: string, quantity: number, unit: string }[]
    progress_percentage?: number
}

export default function FactureEditor({
    initialItems,
    factureId,
    articles,
    initialReference,
    initialStatus,
    initialDateEcheance,
    initialType,
    initialSituationIndex,
    chantierName,
    client,
    dateEmission
}: {
    initialItems: FactureItem[],
    factureId: string,
    articles: any[],
    initialReference: string,
    initialStatus: string,
    initialDateEcheance?: string,
    initialType: string,
    initialSituationIndex?: number,
    chantierName?: string,
    client?: any,
    dateEmission?: string
}) {
    const confirm = useConfirm()
    const [items, setItems] = useState<FactureItem[]>(initialItems)
    const [status, setStatus] = useState(initialStatus)
    const [dateEcheance, setDateEcheance] = useState(initialDateEcheance ? new Date(initialDateEcheance).toISOString().split('T')[0] : '')
    const [loading, setLoading] = useState(false)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    // Sync from props
    useEffect(() => { setItems(initialItems) }, [initialItems])
    useEffect(() => { setStatus(initialStatus) }, [initialStatus])

    const handleSelectArticle = (article: any) => {
        const newItem: FactureItem = {
            id: `new_${Date.now()}`,
            description: article.name,
            quantity: 1,
            unit: article.unit || 'u',
            unit_price: article.unit_price || 0,
            tva: article.tva || 20,
            article_id: article.id,
            components: article.components
        }
        setItems(prev => [...prev, newItem])
        setIsSelectorOpen(false)
    }

    const handleItemChange = (id: string, field: keyof FactureItem, value: string | number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const handleAddLine = () => {
        const newItem: FactureItem = {
            id: `new_${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'u',
            unit_price: 0,
            tva: 20
        }
        setItems([...items, newItem])
    }

    const handleDeleteLine = async (id: string) => {
        const itemToDelete = items.find(i => i.id === id)
        const itemDesc = itemToDelete?.description ? `la prestation « ${itemToDelete.description.trim().slice(0, 30)}${itemToDelete.description.length > 30 ? '...' : ''} »` : "cette ligne"
        const ok = await confirm({
            title: "Supprimer cette ligne de facture ?",
            message: `Êtes-vous sûr de vouloir supprimer ${itemDesc} de la facture ? Cette action est irréversible.`,
            confirmText: "Oui, supprimer",
            cancelText: "Non, annuler",
            variant: "danger"
        })
        if (!ok) return

        const previousItems = items
        setItems(items.filter(i => i.id !== id))

        if (!id.startsWith('new_')) {
            const res = await deleteFactureItem(id)
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

    const handleSave = async (targetStatus?: string) => {
        setLoading(true)
        const finalStatus = targetStatus || status

        // Update local status if changed via button
        if (targetStatus) setStatus(targetStatus)

        const res = await saveFacture(factureId, items, {
            status: finalStatus,
            date_echeance: dateEcheance || undefined
        })
        setLoading(false)
        if (res?.success) {
            // Success feedback
        } else {
            alert("Erreur lors de l'enregistrement")
        }
    }

    // Totaux
    const totalHT = items.reduce((sum, item) => {
        const progress = initialType === 'situation' ? (item.progress_percentage ?? 0) : 100
        return sum + (item.quantity * item.unit_price * (progress / 100))
    }, 0)

    const totalTVA = items.reduce((sum, item) => {
        const progress = initialType === 'situation' ? (item.progress_percentage ?? 0) : 100
        return sum + (item.quantity * item.unit_price * (progress / 100) * (item.tva / 100))
    }, 0)

    const totalTTC = totalHT + totalTVA

    const [downloadingPdf, setDownloadingPdf] = useState(false)

    const handleDownloadPdf = async () => {
        try {
            setDownloadingPdf(true)
            const factureData = {
                id: factureId,
                reference: initialReference,
                status: status,
                type: initialType,
                situation_index: initialSituationIndex,
                date_emission: dateEmission,
                date_echeance: dateEcheance,
                total_ht: totalHT,
                total_ttc: totalTTC,
                factures_items: items,
                chantiers: {
                    name: chantierName,
                    clients: client
                }
            }
            await generateFacturePDF(factureData)
        } catch (err: any) {
            console.error("Erreur téléchargement facture:", err)
            alert("Erreur lors de la génération du PDF: " + (err?.message || err))
        } finally {
            setDownloadingPdf(false)
        }
    }



    return (
        <div className="h-full flex flex-col min-h-0">
            <ArticleSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                articles={articles}
                onSelect={handleSelectArticle}
            />

            {/* --- LAYOUT SCINDÉ GAUCHE / DROITE (100% de la hauteur, sans scroll global) --- */}
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3.5">

                {/* ======================================================== */}
                {/* COLONNE GAUCHE (8 colonnes) : ZONE DE FACTURE & LIGNES   */}
                {/* ======================================================== */}
                <div className="xl:col-span-8 h-full flex flex-col gap-2.5 min-h-0">

                    {/* 1. EN-TÊTE RÉFÉRENCE FACTURE & CHANTIER */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-2.5 px-3.5 shadow-xs">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Facture N° {initialReference || 'Facture Provisoire'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {items.length} {items.length > 1 ? 'lignes' : 'ligne'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Chantier :</span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{chantierName || 'Chantier non spécifié'}</span>
                        </div>
                    </div>

                    {/* 2. BARRE D'OUTILS D'AJOUT (PillButtons) */}
                    <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                        <PillButton
                            onClick={handleAddLine}
                            variant="primary"
                            icon={<Plus size={13} />}
                        >
                            Ajouter une ligne
                        </PillButton>
                        <PillButton
                            onClick={() => setIsSelectorOpen(true)}
                            variant="ai"
                            icon={<Box size={13} />}
                        >
                            Bibliothèque
                        </PillButton>
                        <PillButton
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            loading={downloadingPdf}
                            variant="secondary"
                            icon={<Download size={13} />}
                        >
                            Télécharger PDF
                        </PillButton>
                    </div>

                    {/* 3. TABLEAU DES PRESTATIONS DE LA FACTURE (Scroll interne exclusif) */}
                    <div className="flex-1 min-h-0 overflow-hidden rounded-[20px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] flex flex-col shadow-xs">
                        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0E1524] border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-3 py-2">Description des prestations</th>
                                        <th className="px-3 py-2 w-20 text-center">Qté</th>
                                        <th className="px-3 py-2 w-14 text-center">Unité</th>
                                        <th className="px-3 py-2 w-20 text-right">PU HT</th>
                                        {initialType === 'situation' && (
                                            <th className="px-3 py-2 w-20 text-center">Avanc. %</th>
                                        )}
                                        <th className="px-3 py-2 w-14 text-right">TVA</th>
                                        <th className="px-3 py-2 w-24 text-right">Total HT</th>
                                        <th className="px-3 py-2 w-12 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={initialType === 'situation' ? 8 : 7} className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                                                Cette facture est vide. Commencez par ajouter une ligne de prestation.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <Fragment key={item.id}>
                                                <tr className="hover:bg-slate-50/80 dark:hover:bg-[#162032] transition-colors group relative border-b border-slate-100 dark:border-slate-800/60">
                                                    <td className="px-3 py-1.5">
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
                                                                placeholder="Description de la prestation"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-1.5">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-14 bg-transparent p-0.5 outline-none text-center font-medium focus:border-b focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-1.5">
                                                        <input
                                                            type="text"
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                            className="w-full bg-transparent p-0.5 outline-none text-center font-mono text-[10px] text-slate-500 focus:border-b focus:border-indigo-500"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-1.5 text-right">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-transparent p-0.5 outline-none text-right font-semibold text-xs text-emerald-600 focus:border-b focus:border-emerald-500 dark:text-emerald-400"
                                                        />
                                                    </td>

                                                    {initialType === 'situation' && (
                                                        <td className="px-3 py-1.5">
                                                            <div className="flex items-center justify-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={item.progress_percentage ?? 0}
                                                                    onChange={(e) => handleItemChange(item.id, 'progress_percentage', parseFloat(e.target.value) || 0)}
                                                                    className="w-12 rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 text-center font-bold text-xs text-amber-700 dark:text-amber-400 outline-none"
                                                                />
                                                            </div>
                                                        </td>
                                                    )}

                                                    <td className="px-3 py-1.5 text-right text-slate-400 dark:text-slate-500 text-[10px]">
                                                        {item.tva}%
                                                    </td>

                                                    <td className="px-3 py-1.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                                                        {((item.quantity * item.unit_price) * ((initialType === 'situation' ? (item.progress_percentage ?? 0) : 100) / 100)).toFixed(2)} €
                                                    </td>

                                                    <td className="px-3 py-1.5 text-center">
                                                        <button
                                                            onClick={() => handleDeleteLine(item.id)}
                                                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* EXPANDED ROW */}
                                                {item.components && expandedItems.has(item.id) && (
                                                    <tr className="bg-slate-50/70 border-b border-slate-100 dark:bg-white/[0.02] dark:border-slate-800">
                                                        <td colSpan={initialType === 'situation' ? 8 : 7} className="px-3.5 py-2 pl-10">
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
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PIED DE CARTE FIXÉ EN BAS (Toujours ancré en bas, exactement comme demandé) */}
                        <div className="shrink-0 bg-slate-50/95 dark:bg-[#0E1524] border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                {items.length} prestation(s)
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
                {/* COLONNE DROITE (4 colonnes) : CHANTIER, CLIENT, TOTAUX, ACTIONS */}
                {/* ======================================================== */}
                <div className="xl:col-span-4 h-full flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-1 scrollbar-thin">

                    {/* 1. INFORMATIONS CHANTIER & CLIENT (EN HAUT, COMME DANS DEVIS) */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Informations Facture
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {initialReference}
                            </span>
                        </div>

                        {/* Chantier */}
                        <div className="space-y-1 text-xs">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Chantier</span>
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                                {chantierName || 'Chantier associé'}
                            </p>
                        </div>

                        {/* Client */}
                        {client && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Client Facturé</span>
                                <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                                {client.address_line1 && <p className="text-[11px] text-slate-500 dark:text-slate-400">{client.address_line1}</p>}
                                {(client.zip_code || client.city) && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{client.zip_code} {client.city}</p>
                                )}
                            </div>
                        )}

                        {/* Paramètres de paiement (Statut & Échéance) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="block text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-0.5">Statut</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                                >
                                    <option value="en_attente">En attente</option>
                                    <option value="payee">Payée</option>
                                    <option value="retard">En retard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-0.5">Échéance</label>
                                <input
                                    type="date"
                                    value={dateEcheance}
                                    onChange={(e) => setDateEcheance(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-900 dark:text-white outline-none"
                                />
                            </div>
                        </div>

                        {dateEmission && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                Émission : {new Date(dateEmission).toLocaleDateString('fr-FR')}
                            </div>
                        )}
                    </div>

                    {/* 2. RÉCAPITULATIF FINANCIER */}
                    <div className="flex-1 min-h-fit rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs flex flex-col justify-between space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Montants Facturés
                        </span>

                        {/* Grand Total TTC */}
                        <div className="rounded-xl p-2.5 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/25">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Net à payer TTC
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
                                <span>TVA estimée</span>
                                <span className="font-mono">{totalTVA.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. ACTIONS FACTURE */}
                    <div className="shrink-0 rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-3 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Actions Facture
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                {status}
                            </span>
                        </div>

                        <PillButton
                            onClick={() => handleSave()}
                            disabled={loading}
                            loading={loading}
                            variant="primary"
                            icon={<Save size={13} />}
                            className="w-full text-xs py-1.5"
                        >
                            Enregistrer la facture
                        </PillButton>

                        <PillButton
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            loading={downloadingPdf}
                            variant="secondary"
                            icon={<Download size={13} />}
                            className="w-full text-xs py-1.5"
                        >
                            Télécharger le PDF
                        </PillButton>
                    </div>
                </div>

            </div>
        </div>
    )
}
