'use client'

import Link from 'next/link'
import { useState, useEffect, Fragment } from 'react'
import { Plus, Trash2, Save, Calculator, Loader2, FileText, ChevronRight, Layout, GripVertical } from 'lucide-react'
import ArticleSelector from './ArticleSelector'
import CalculatorPopover from './CalculatorPopover'
import { saveDevis, deleteDevisItem } from '@/app/actions/devis'

// On définit le format d'une ligne de devis
type DevisItem = {
    id: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    tva: number
    article_id?: string
    components?: { name: string, quantity: number, unit: string }[]
    // New fields
    item_type?: 'item' | 'section'
    details?: { id: string, label: string, expression: string, result: number }[]
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
    const [currentCalcItem, setCurrentCalcItem] = useState<string | null>(null) // ID of item being calculated

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
            id: `new_${Date.now()}`, // ID temporaire
            description: '',
            quantity: 1,
            unit: 'u',
            unit_price: 0,
            tva: 20,
            item_type: 'item'
        }
        setItems([...items, newItem])
    }

    const handleAddSection = () => {
        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: 'Nouvelle Section',
            quantity: 0,
            unit: '',
            unit_price: 0,
            tva: 0,
            item_type: 'section'
        }
        setItems([...items, newItem])
    }

    const handleDeleteLine = async (id: string) => {
        // Optimistic UI update
        const previousItems = items
        setItems(items.filter(i => i.id !== id))

        // If it's a saved item (real UUID), delete from DB immediately
        if (!id.startsWith('new_')) {
            const res = await deleteDevisItem(id)
            if (!res?.success) {
                // Revert if error
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

    const handleSave = async (targetStatus?: string) => {
        setLoading(true)
        const res = await saveDevis(devisId, items, {
            name,
            status: targetStatus
        })
        setLoading(false)
        if (res?.success) {
            // Success feedback
        } else {
            alert("Erreur lors de l'enregistrement")
        }
    }

    // Calcul des totaux en temps réel (Exclure les sections)
    const calculableItems = items.filter(i => i.item_type !== 'section')
    const totalHT = calculableItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const totalTVA = calculableItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tva / 100)), 0)
    const totalTTC = totalHT + totalTVA

    // Find current item details for calculator
    const currentItemDetails = items.find(i => i.id === currentCalcItem)?.details || []

    const handleSelectArticle = (article: any) => {
        const newItem: DevisItem = {
            id: `new_${Date.now()}`,
            description: article.name,
            quantity: 1,
            unit: article.unit,
            unit_price: article.price_ht,
            tva: article.tva || 20, // Default to 20 if not present
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

            {/* CHAMP NOM DU DEVIS */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Nom du devis (Optionnel)
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Rénovation Cuisine M. Dupont"
                    className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-600 outline-none border-none p-0 focus:ring-0"
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
                    className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all active:scale-95 whitespace-nowrap"
                >
                    <Layout size={16} />
                    Ajouter tranche
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
                    className="flex items-center gap-2 rounded-xl border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700/50 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                    Brouillon
                </button>

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

            {/* TABLEAU ÉDITABLE (Style Glass) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Description</th>
                            <th className="px-4 py-3 font-medium w-32 text-center">Qté</th>
                            <th className="px-4 py-3 font-medium w-24 text-center">Unité</th>
                            <th className="px-4 py-3 font-medium w-32 text-right">PU HT</th>
                            <th className="px-4 py-3 font-medium w-20 text-right">TVA</th>
                            <th className="px-4 py-3 font-medium w-32 text-right">Total HT</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                                    Ce devis est vide. Commencez par ajouter des ouvrages ou des tranches.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => {
                                // RENDER SECTION ROW
                                if (item.item_type === 'section') {
                                    return (
                                        <tr key={item.id} className="bg-white/10 hover:bg-white/15 transition-colors group">
                                            <td colSpan={6} className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    className="w-full bg-transparent font-bold text-white placeholder-gray-400 outline-none"
                                                    placeholder="Nom de la tranche (ex: Lot Électricité)"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteLine(item.id)}
                                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }

                                // RENDER STANDARD ROW
                                return (
                                    <Fragment key={item.id}>
                                        <tr className="hover:bg-white/5 transition-colors group relative">
                                            <td className="px-4 py-2">
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
                                                        className="w-full bg-transparent p-1 outline-none focus:border-b focus:border-blue-500"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 relative group/qty">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-transparent p-1 outline-none text-center focus:border-b focus:border-blue-500"
                                                    />
                                                    <button
                                                        onClick={() => openCalculator(item.id)}
                                                        className="text-gray-600 hover:text-purple-400 opacity-0 group-hover/qty:opacity-100 transition-opacity absolute right-2"
                                                        title="Minute de métré"
                                                    >
                                                        <Calculator size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                    className="w-full bg-transparent p-1 outline-none text-center text-gray-500 focus:border-b focus:border-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent p-1 outline-none text-right font-medium text-emerald-400 focus:border-b focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-500">
                                                {item.tva}%
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-white">
                                                {(item.quantity * item.unit_price).toFixed(2)} €
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteLine(item.id)}
                                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* EXPANDED OUVAGE */}
                                        {item.components && expandedItems.has(item.id) && (
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <td colSpan={7} className="px-4 py-3 pl-14">
                                                    <div className="text-xs uppercase text-gray-500 mb-2 font-semibold tracking-wider flex items-center gap-2">
                                                        <span>📦 Composition de l'ouvrage</span>
                                                        <span className="h-px flex-1 bg-white/5"></span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {item.components.map((comp, idx) => (
                                                            <div key={idx} className="flex items-center gap-4 text-sm text-gray-400">
                                                                <div className="w-16 text-right font-medium text-gray-500">{comp.quantity} {comp.unit}</div>
                                                                <div className="text-gray-300">{comp.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {/* DISPLAY DETAILS (Métré) if present */}
                                        {item.details && item.details.length > 0 && (
                                            <tr className="bg-purple-900/10 border-b border-purple-500/10">
                                                <td colSpan={7} className="px-4 py-2 pl-14 text-xs text-purple-300 font-mono">
                                                    <span className="mr-2 opacity-70">Calcul :</span>
                                                    {item.details.map((d, i) => (
                                                        <span key={i} className="mr-4">
                                                            {d.label ? <span className="text-purple-400">{d.label}: </span> : ''}
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
                    {/* PIED DE TABLEAU (Totaux) */}
                    <tfoot className="bg-black/20 font-medium">
                        <tr>
                            <td colSpan={5} className="px-4 py-3 text-right text-gray-400">Total HT</td>
                            <td className="px-4 py-3 text-right text-white text-lg">{totalHT.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="px-4 py-1 text-right text-gray-500 text-xs">TVA (20%)</td>
                            <td className="px-4 py-1 text-right text-gray-400 text-xs">{totalTVA.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="px-4 py-4 text-right text-white font-bold">Net à payer TTC</td>
                            <td className="px-4 py-4 text-right text-blue-400 font-bold text-xl">{totalTTC.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}