'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, X, Check, Loader2, BookmarkPlus, Tag } from 'lucide-react'
import { DevisItem } from './DevisEditor'
import { saveQuoteLinesToArticlesAction } from '@/app/actions/articles'

interface ImportToLibraryModalProps {
    isOpen: boolean
    onClose: () => void
    candidateItems: DevisItem[]
    onSuccess: (savedMappings: { lineId: string, articleId: string }[]) => void
}

export default function ImportToLibraryModal({
    isOpen,
    onClose,
    candidateItems,
    onSuccess
}: ImportToLibraryModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(candidateItems.map(i => i.id))
    )
    const [categories, setCategories] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        candidateItems.forEach(i => {
            initial[i.id] = 'ouvrage'
        })
        return initial
    })
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(candidateItems.map(i => i.id)))
            const initial: Record<string, string> = {}
            candidateItems.forEach(i => {
                initial[i.id] = categories[i.id] || 'ouvrage'
            })
            setCategories(initial)
            setError(null)
        }
    }, [isOpen, candidateItems])

    if (!isOpen) return null

    const toggleSelectAll = () => {
        if (selectedIds.size === candidateItems.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(candidateItems.map(i => i.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const handleCategoryChange = (id: string, cat: string) => {
        setCategories(prev => ({ ...prev, [id]: cat }))
    }

    const handleSave = async () => {
        const itemsToSave = candidateItems.filter(i => selectedIds.has(i.id))
        if (itemsToSave.length === 0) return

        setIsSaving(true)
        setError(null)

        try {
            const payload = itemsToSave.map(item => ({
                lineId: item.id,
                name: item.description,
                unit: item.unit || 'u',
                price_ht: item.unit_price || 0,
                cost_ht: item.cost_mat ? (item.cost_mat + (item.cost_mo || 0)) : (item.cost_total || 0),
                category: categories[item.id] || 'ouvrage',
                reference: item.reference || undefined,
                tva: item.tva || 20
            }))

            const res = await saveQuoteLinesToArticlesAction(payload)
            if (res.success && res.mappings) {
                onSuccess(res.mappings)
                onClose()
            } else {
                setError(res.error || "Erreur lors de l'enregistrement dans la bibliothèque.")
            }
        } catch (e: any) {
            setError(e.message || "Erreur serveur")
        } finally {
            setIsSaving(false)
        }
    }

    const allSelected = selectedIds.size === candidateItems.length && candidateItems.length > 0

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={isSaving ? undefined : onClose}
                    className="fixed inset-0 bg-slate-950/65 dark:bg-black/75 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-3xl bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <Box size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    Enregistrer dans la Bibliothèque
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Prestations créées dans ce devis et absentes de votre catalogue
                                </p>
                            </div>
                        </div>

                        {!isSaving && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Explication & Select All */}
                    <div className="px-5 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 cursor-pointer"
                            />
                            <span>Tout sélectionner ({candidateItems.length} prestations)</span>
                        </label>

                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            <strong>{selectedIds.size}</strong> sélectionnée(s)
                        </span>
                    </div>

                    {/* Table / List */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-5">
                        <div className="space-y-2">
                            {candidateItems.map((item) => {
                                const isChecked = selectedIds.has(item.id)
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleSelect(item.id)}
                                        className={`p-3.5 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                                            isChecked
                                                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30'
                                                : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 opacity-60'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}} // Géré par onClick parent
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 shrink-0 cursor-pointer"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {item.reference && (
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                        {item.reference}
                                                    </span>
                                                )}
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                    {item.description}
                                                </p>
                                            </div>
                                            {item.complement && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {item.complement}
                                                </p>
                                            )}
                                        </div>

                                        {/* Catégorie */}
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <select
                                                value={categories[item.id] || 'ouvrage'}
                                                onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="ouvrage">Ouvrage</option>
                                                <option value="fourniture">Fourniture</option>
                                                <option value="main_doeuvre">Main d'œuvre</option>
                                                <option value="engin">Engin</option>
                                            </select>
                                        </div>

                                        {/* Unité & Prix */}
                                        <div className="shrink-0 text-right w-24">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {item.unit_price ? Number(item.unit_price).toFixed(2) : '0.00'} €
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                par {item.unit || 'u'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-black/20">
                        {error ? (
                            <span className="text-xs text-red-500 font-medium">{error}</span>
                        ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Les prestations cochées seront ajoutées à votre catalogue et réutilisables dans tous vos futurs devis.
                            </span>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={selectedIds.size === 0 || isSaving}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Enregistrement...</span>
                                    </>
                                ) : (
                                    <>
                                        <BookmarkPlus size={14} />
                                        <span>Enregistrer ({selectedIds.size})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
