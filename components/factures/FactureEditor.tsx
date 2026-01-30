'use client'

import { useState, useEffect, Fragment } from 'react'
import { Plus, Trash2, Save, Calculator, Loader2, FileCheck, Calendar, Wallet, ChevronRight } from 'lucide-react'
import ArticleSelector from '@/components/devis/ArticleSelector' // Reuse article selector
import { saveFacture, deleteFactureItem } from '@/app/actions/factures'

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
    initialSituationIndex
}: {
    initialItems: FactureItem[],
    factureId: string,
    articles: any[],
    initialReference: string,
    initialStatus: string,
    initialDateEcheance?: string,
    initialType: string,
    initialSituationIndex?: number
}) {
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



    return (
        <div className="space-y-6">
            <ArticleSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                articles={articles}
                onSelect={handleSelectArticle}
            />

            {/* --- METADATA HEADER (Status, Date) --- */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Statut de paiement
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-transparent font-medium text-white outline-none [&>option]:bg-gray-900"
                        >
                            <option value="en_attente">En attente</option>
                            <option value="payee">Payée</option>
                            <option value="retard">En retard</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                        <Calendar size={20} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Date d'échéance
                        </label>
                        <input
                            type="date"
                            value={dateEcheance}
                            onChange={(e) => setDateEcheance(e.target.value)}
                            className="w-full bg-transparent font-medium text-white outline-none"
                        />
                    </div>
                </div>
            </div>


            {/* BARRE D'OUTILS */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleAddLine}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Ajouter une ligne
                </button>

                <div className="flex-1" />

                <button
                    onClick={() => handleSave()}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>

            {/* TABLEAU (Reuse styles) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Description</th>
                            <th className="px-4 py-3 font-medium w-24">Qté</th>
                            <th className="px-4 py-3 font-medium w-24">Unité</th>
                            <th className="px-4 py-3 font-medium w-32 text-right">PU HT</th>
                            {initialType === 'situation' && <th className="px-4 py-3 font-medium w-24 text-center">Avanc. %</th>}
                            <th className="px-4 py-3 font-medium w-20 text-right">TVA</th>
                            <th className="px-4 py-3 font-medium w-32 text-right">Total HT</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                                    Cette facture est vide.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <Fragment key={item.id}>
                                    <tr className="hover:bg-white/5 transition-colors group">
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
                                                    className="w-full bg-transparent p-1 outline-none focus:border-b focus:border-purple-500"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-1 outline-none text-center focus:border-b focus:border-purple-500" />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input type="text" value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} className="w-full bg-transparent p-1 outline-none text-center focus:border-b focus:border-purple-500" />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <input type="number" value={item.unit_price} onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-1 outline-none text-right font-medium text-emerald-400 focus:border-b focus:border-emerald-500" />
                                        </td>
                                        {initialType === 'situation' && (
                                            <td className="px-4 py-2">
                                                <div className='flex items-center justify-center'>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.progress_percentage ?? 0}
                                                        onChange={(e) => handleItemChange(item.id, 'progress_percentage', parseFloat(e.target.value) || 0)}
                                                        className="w-16 bg-white/10 rounded-lg p-1 outline-none text-center font-bold text-orange-400 focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-right text-gray-500">{item.tva}%</td>
                                        <td className="px-4 py-2 text-right font-bold text-white">
                                            {((item.quantity * item.unit_price) * ((initialType === 'situation' ? (item.progress_percentage ?? 0) : 100) / 100)).toFixed(2)} €
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => handleDeleteLine(item.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                    {/* EXPANDED ROW */}
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
                                </Fragment>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-black/20 font-medium">
                        <tr>
                            <td colSpan={initialType === 'situation' ? 6 : 5} className="px-4 py-3 text-right text-gray-400">Total HT</td>
                            <td className="px-4 py-3 text-right text-white text-lg">{totalHT.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={initialType === 'situation' ? 6 : 5} className="px-4 py-1 text-right text-gray-500 text-xs">TVA</td>
                            <td className="px-4 py-1 text-right text-gray-400 text-xs">{totalTVA.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={initialType === 'situation' ? 6 : 5} className="px-4 py-4 text-right text-white font-bold">Net à payer TTC</td>
                            <td className="px-4 py-4 text-right text-purple-400 font-bold text-xl">{totalTTC.toFixed(2)} €</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
