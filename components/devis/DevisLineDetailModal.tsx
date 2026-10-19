'use client'

import { useState, useEffect } from 'react'
import { X, Calculator, ShieldCheck, Check, Percent, User, Wrench, Calendar, Info } from 'lucide-react'

export interface DevisLineData {
    id: string
    reference?: string
    description: string
    complement?: string
    quantity: number
    unit: string
    unit_price: number
    discount_pct?: number
    tva: number
    // Déboursé / Analyse de rentabilité
    cost_mat?: number // Prix d'achat / Fournitures
    cost_mo?: number  // Main d'oeuvre
    cost_fg_pct?: number // Frais généraux %
    cost_total?: number
    margin?: number
    margin_pct?: number
    // Options
    dont_totalize?: boolean
    copy_to_schedule?: boolean
    billed_pct?: number
    commercial?: string
    technicien?: string
}

interface DevisLineDetailModalProps {
    isOpen: boolean
    onClose: () => void
    item: DevisLineData | null
    onSave: (updatedItem: DevisLineData) => void
}

export default function DevisLineDetailModal({
    isOpen,
    onClose,
    item,
    onSave
}: DevisLineDetailModalProps) {
    if (!isOpen || !item) return null

    const [reference, setReference] = useState(item.reference || '')
    const [description, setDescription] = useState(item.description || '')
    const [quantity, setQuantity] = useState(Number(item.quantity) || 1)
    const [unit, setUnit] = useState(item.unit || 'u')
    const [unitPrice, setUnitPrice] = useState(Number(item.unit_price) || 0)
    const [discountPct, setDiscountPct] = useState(Number(item.discount_pct) || 0)
    const [tva, setTva] = useState(Number(item.tva) || 10)

    // Déboursé
    const [costMat, setCostMat] = useState(Number(item.cost_mat) || 0)
    const [costMo, setCostMo] = useState(Number(item.cost_mo) || 0)
    const [costFgPct, setCostFgPct] = useState(Number(item.cost_fg_pct) || 0)

    // Options
    const [dontTotalize, setDontTotalize] = useState(Boolean(item.dont_totalize))
    const [copyToSchedule, setCopyToSchedule] = useState(Boolean(item.copy_to_schedule))
    const [billedPct, setBilledPct] = useState(Number(item.billed_pct) || 100)
    const [commercial, setCommercial] = useState(item.commercial || 'VINUESA Alexandre/COP')
    const [technicien, setTechnicien] = useState(item.technicien || 'VINUESA Alexandre')

    // Calculs en temps réel
    const puNet = unitPrice * (1 - discountPct / 100)
    const lineTotal = quantity * puNet
    const totalCost = costMat + costMo + (costMat + costMo) * (costFgPct / 100)
    const margin = puNet - totalCost
    const marginPct = puNet > 0 ? (margin / puNet) * 100 : 0

    const handleApply = () => {
        onSave({
            ...item,
            reference,
            description,
            quantity,
            unit,
            unit_price: unitPrice,
            discount_pct: discountPct,
            tva,
            cost_mat: costMat,
            cost_mo: costMo,
            cost_fg_pct: costFgPct,
            cost_total: totalCost,
            margin,
            margin_pct: marginPct,
            dont_totalize: dontTotalize,
            copy_to_schedule: copyToSchedule,
            billed_pct: billedPct,
            commercial,
            technicien
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-900 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                            <Calculator size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ligne de devis & Étude de prix</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Paramétrage technique, déboursé sec et rentabilité</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Identification */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Référence BTP
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Ex: PEI994, RAV D2..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono font-medium text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Désignation
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Quantités et Tarification */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tarification Client</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Quantité</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-center text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Unité</label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-center text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">P.U. HT (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-right text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Remise %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={discountPct}
                                    onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-right text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">TVA</label>
                                <select
                                    value={tva}
                                    onChange={(e) => setTva(parseFloat(e.target.value))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                >
                                    <option value={10}>10% (BTP)</option>
                                    <option value={20}>20% (Normal)</option>
                                    <option value={5.5}>5.5% (Éco)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Montant Net</label>
                                <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-right text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    {lineTotal.toFixed(2)} €
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Étude de Déboursé & Rentabilité (Photo 5) */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={15} />
                                Déboursé Sec & Analyse de Marge
                            </h3>
                            <span className="text-xs text-gray-500">Base unitaire</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Prix d'Achat (Fournitures)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={costMat}
                                    onChange={(e) => setCostMat(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-right font-medium text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Main d'Œuvre (M.O.)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={costMo}
                                    onChange={(e) => setCostMo(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-right font-medium text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Frais Généraux (% f.g.)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={costFgPct}
                                    onChange={(e) => setCostFgPct(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-right font-medium text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Prix de Revient (P.R.)</label>
                                <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-right text-gray-700 dark:bg-white/5 dark:text-gray-300">
                                    {totalCost.toFixed(2)} €
                                </div>
                            </div>
                        </div>

                        {/* Barre de marge */}
                        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Marge brute dégagée :</span>
                                <span className={`text-sm font-bold ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                    {margin.toFixed(2)} € / {unit}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Taux de marge :</span>
                                <span className={`text-sm font-extrabold px-2 py-0.5 rounded-md ${
                                    marginPct >= 30 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                    marginPct >= 15 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                                    'bg-red-500/20 text-red-500'
                                }`}>
                                    {marginPct.toFixed(1)} %
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Équipes & Options d'exécution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <User size={14} /> Technico-commercial
                            </label>
                            <input
                                type="text"
                                value={commercial}
                                onChange={(e) => setCommercial(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Wrench size={14} /> Technicien / Conducteur
                            </label>
                            <input
                                type="text"
                                value={technicien}
                                onChange={(e) => setTechnicien(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Options Avancées BTP */}
                    <div className="rounded-xl border border-gray-200 p-4 space-y-3 dark:border-white/10">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dontTotalize}
                                onChange={(e) => setDontTotalize(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Ne pas totaliser (Ligne en variante / informative)
                                </span>
                                <p className="text-xs text-gray-500">
                                    Cette ligne apparaît sur le devis pour information mais n'est pas additionnée au total HT.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={copyToSchedule}
                                onChange={(e) => setCopyToSchedule(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-500" />
                                    Synchroniser dans le planning des techniciens
                                </span>
                                <p className="text-xs text-gray-500">
                                    Créera un bloc d'intervention dans la semaine du planning pour le technicien assigné.
                                </p>
                            </div>
                        </label>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                À facturer (Avancement de travaux) :
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={billedPct}
                                    onChange={(e) => setBilledPct(parseFloat(e.target.value) || 0)}
                                    className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-center font-bold text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                                <span className="text-sm text-gray-500">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                    >
                        <Check size={16} />
                        Appliquer les modifications
                    </button>
                </div>
            </div>
        </div>
    )
}
