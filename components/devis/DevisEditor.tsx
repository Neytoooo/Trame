'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Calculator, Loader2 } from 'lucide-react'
import ArticleSelector from './ArticleSelector'
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
}

export default function DevisEditor({
    initialItems,
    devisId,
    articles
}: {
    initialItems: DevisItem[],
    devisId: string,
    articles: any[]
}) {
    const [items, setItems] = useState<DevisItem[]>(initialItems)
    const [loading, setLoading] = useState(false)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)

    // Sync items when initialItems prop updates
    useEffect(() => {
        setItems(initialItems)
    }, [initialItems])

    const handleItemChange = (id: string, field: keyof DevisItem, value: string | number) => {
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
            tva: 20
        }
        setItems([...items, newItem])
    }

    const handleDeleteLine = async (id: string) => {
        // Optimistic UI update
        const previousItems = items
        setItems(items.filter(i => i.id !== id))

        // If it's a saved item (real UUID), delete from DB immediately
        // (Alternatively we could wait for "Save", but deleting immediately is often clearer for sub-items)
        if (!id.startsWith('new_')) {
            const res = await deleteDevisItem(id)
            if (!res?.success) {
                // Revert if error
                setItems(previousItems)
                alert("Erreur lors de la suppression")
            }
        }
    }

    const handleSave = async () => {
        setLoading(true)
        const res = await saveDevis(devisId, items)
        setLoading(false)
        if (res?.success) {
            // Success feedback (could be a toast)
        } else {
            alert("Erreur lors de l'enregistrement")
        }
    }

    // Calcul des totaux en temps réel
    const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const totalTVA = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tva / 100)), 0)
    const totalTTC = totalHT + totalTVA

    return (
        <div className="space-y-6">

            {/* --- LE MODAL (Invisible tant que isSelectorOpen est false) --- */}
            <ArticleSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                articles={articles}
                devisId={devisId}
            />

            {/* BARRE D'OUTILS (Boutons d'action) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleAddLine}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Ajouter une ligne
                </button>
                <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                    <Calculator size={16} />
                    Importer depuis la bibliothèque
                </button>
                <div className="flex-1" /> {/* Espace vide pour pousser le bouton Save à droite */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>

            {/* TABLEAU ÉDITABLE (Style Glass) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Description</th>
                            <th className="px-4 py-3 font-medium w-24">Qté</th>
                            <th className="px-4 py-3 font-medium w-24">Unité</th>
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
                                    Ce devis est vide. Commencez par ajouter des ouvrages.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            className="w-full bg-transparent p-1 outline-none focus:border-b focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent p-1 outline-none text-center focus:border-b focus:border-blue-500"
                                        />
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
                            ))
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