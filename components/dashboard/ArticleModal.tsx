'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Loader2, Search, Trash2, Box, Layers, CheckCircle2 } from 'lucide-react'
import { createArticle, updateArticleAction, searchArticles } from '@/app/actions/articles'
import PillButton from '@/components/ui/PillButton'

interface ArticleModalProps {
    isOpen?: boolean
    onClose?: () => void
    articleToEdit?: any
}

export default function ArticleModal({
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    articleToEdit
}: ArticleModalProps = {}) {
    const isControlled = typeof controlledIsOpen === 'boolean'
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen

    const [isLoading, setIsLoading] = useState(false)
    const [type, setType] = useState<'simple' | 'ouvrage'>('simple')

    // Ouvrage state
    const [composants, setComposants] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [calculatedCost, setCalculatedCost] = useState(0)

    // Controlled inputs state
    const [cost, setCost] = useState('')
    const [name, setName] = useState('')
    const [reference, setReference] = useState('')
    const [category, setCategory] = useState('fourniture')
    const [unit, setUnit] = useState('u')
    const [priceHt, setPriceHt] = useState('')
    const [tva, setTva] = useState('20')
    const [stock, setStock] = useState('')
    const [minStock, setMinStock] = useState('')
    const [supplier, setSupplier] = useState('')

    const formRef = useRef<HTMLFormElement>(null)

    const handleClose = () => {
        if (isControlled) {
            controlledOnClose?.()
        } else {
            setInternalIsOpen(false)
        }
    }

    // Synchronisation avec l'article à éditer
    useEffect(() => {
        if (isOpen && articleToEdit) {
            setName(articleToEdit.name || '')
            setReference(articleToEdit.reference || '')
            setCategory(articleToEdit.category || 'fourniture')
            setUnit(articleToEdit.unit || 'u')
            setPriceHt(articleToEdit.price_ht ? String(articleToEdit.price_ht) : '')
            setCost(articleToEdit.cost_ht ? String(articleToEdit.cost_ht) : '')
            setTva(articleToEdit.tva ? String(articleToEdit.tva) : '20')
            setStock(articleToEdit.stock ? String(articleToEdit.stock) : '')
            setMinStock(articleToEdit.min_stock ? String(articleToEdit.min_stock) : '')
            setSupplier(articleToEdit.supplier || '')
            setType(articleToEdit.category === 'ouvrage' ? 'ouvrage' : 'simple')
        } else if (isOpen && !articleToEdit) {
            setName('')
            setReference('')
            setCategory('fourniture')
            setUnit('u')
            setPriceHt('')
            setCost('')
            setTva('20')
            setStock('')
            setMinStock('')
            setSupplier('')
            setType('simple')
            setComposants([])
        }
    }, [isOpen, articleToEdit])

    // Calcul du coût automatique pour ouvrage
    useEffect(() => {
        if (type === 'ouvrage') {
            const total = composants.reduce((acc, item) => acc + (item.quantity * item.cost_ht), 0)
            setCalculatedCost(total)
            setCost(total.toFixed(2))
        }
    }, [composants, type])

    // Recherche d'articles
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                const results = await searchArticles(searchTerm)
                setSearchResults(results)
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)

        if (type === 'ouvrage') {
            const composantsData = composants.map(c => ({
                child_article_id: c.id,
                quantity: c.quantity
            }))
            formData.append('composants', JSON.stringify(composantsData))
            formData.set('cost_ht', calculatedCost.toFixed(2))
        }

        const result = articleToEdit?.id
            ? await updateArticleAction(articleToEdit.id, formData)
            : await createArticle(formData)

        setIsLoading(false)

        if (result?.success) {
            handleClose()
            setComposants([])
            setSearchTerm('')
            formRef.current?.reset()
        } else {
            alert(result?.error || "Erreur lors de l'enregistrement")
        }
    }

    const addComposant = (article: any) => {
        if (composants.some(c => c.id === article.id)) return
        setComposants([...composants, { ...article, quantity: 1 }])
        setSearchTerm('')
        setSearchResults([])
    }

    return (
        <>
            {!isControlled && (
                <PillButton
                    onClick={() => setInternalIsOpen(true)}
                    icon={<Plus size={14} />}
                >
                    Nouvel Article
                </PillButton>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                        onClick={handleClose}
                    />

                    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#0B101B]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">

                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0B101B]/95 backdrop-blur-md px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                                    {type === 'ouvrage' ? <Layers size={20} /> : <Box size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">
                                        {articleToEdit ? "Modifier l'article" : "Ajouter un article"}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {articleToEdit ? "Mettre à jour les tarifs et caractéristiques" : "Catalogue de prix & ouvrages composés"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Segmented Type Toggle */}
                        <div className="px-6 pt-5 pb-2">
                            <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setType('simple')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${type === 'simple'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_2px_14px_rgba(124,58,237,0.4)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <Box size={15} /> Article Simple
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('ouvrage')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${type === 'ouvrage'
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_2px_14px_rgba(99,102,241,0.4)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <Layers size={15} /> Ouvrage Composé
                                </button>
                            </div>
                        </div>

                        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Référence
                                    </label>
                                    <input
                                        name="reference"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="ex: REF-001"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-medium"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Désignation
                                    </label>
                                    <input
                                        name="name"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ex: Pose Parquet Chêne Massif"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Catégorie / Type
                                    </label>
                                    <select
                                        name="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0E1526] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
                                    >
                                        <option value="fourniture">📦 Fourniture</option>
                                        <option value="main_doeuvre">👷 Main d&apos;œuvre</option>
                                        <option value="engin">🚜 Engin</option>
                                        <option value="sous_traitance">🤝 Sous-traitance</option>
                                        <option value="ouvrage">🏗️ Ouvrage</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Unité
                                    </label>
                                    <select
                                        name="unit"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0E1526] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
                                    >
                                        <option value="u">Unité (u)</option>
                                        <option value="h">Heure (h)</option>
                                        <option value="m2">Mètre carré (m²)</option>
                                        <option value="ml">Mètre linéaire (ml)</option>
                                        <option value="m3">Mètre cube (m³)</option>
                                        <option value="ens">Ensemble (ens)</option>
                                    </select>
                                </div>
                            </div>

                            {/* SECTION OUVRAGE COMPOSÉ */}
                            {type === 'ouvrage' && (
                                <div className="space-y-3.5 border border-violet-500/30 bg-violet-500/[0.05] rounded-2xl p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                                        <Layers size={14} />
                                        Composition de l&apos;ouvrage
                                    </h3>

                                    <div className="relative">
                                        <div className="flex items-center gap-2 border border-white/10 bg-black/30 rounded-2xl px-3.5 py-2.5">
                                            <Search size={15} className="text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher un composant dans la bibliothèque..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-500"
                                            />
                                        </div>

                                        {/* Resultats recherche */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0E1526] border border-white/15 rounded-2xl shadow-2xl z-30 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                {searchResults.map(result => (
                                                    <button
                                                        key={result.id}
                                                        type="button"
                                                        onClick={() => addComposant(result)}
                                                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-violet-600/30 hover:text-white rounded-xl transition-colors flex justify-between items-center"
                                                    >
                                                        <span className="font-medium truncate">{result.name}</span>
                                                        <span className="text-violet-300 font-mono font-semibold">{result.cost_ht} €</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Liste composants ajoutés */}
                                    <div className="space-y-2">
                                        {composants.map((comp, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/[0.04] border border-white/5 p-2.5 rounded-xl">
                                                <span className="flex-1 text-xs text-white truncate font-medium">{comp.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={comp.quantity}
                                                        onChange={(e) => {
                                                            const newComps = [...composants]
                                                            newComps[idx].quantity = parseFloat(e.target.value) || 0
                                                            setComposants(newComps)
                                                        }}
                                                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                                                    />
                                                    <span className="text-[11px] text-slate-400 font-mono">{comp.unit}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newComps = [...composants]
                                                        newComps.splice(idx, 1)
                                                        setComposants(newComps)
                                                    }}
                                                    className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-right text-xs text-slate-400 pt-1">
                                        Coût estimé déboursé : <span className="text-violet-300 font-mono font-bold text-sm">{calculatedCost.toFixed(2)} €</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                        Prix Vente HT (€)
                                    </label>
                                    <input
                                        name="price_ht"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={priceHt}
                                        onChange={(e) => setPriceHt(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-300 placeholder-emerald-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 font-mono font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        TVA (%)
                                    </label>
                                    <select
                                        name="tva"
                                        value={tva}
                                        onChange={(e) => setTva(e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0E1526] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 [&>option]:bg-[#0E1526] [&>option]:text-white font-medium"
                                    >
                                        <option value="20">20% (Standard)</option>
                                        <option value="10">10% (Rénovation)</option>
                                        <option value="5.5">5.5% (Énergétique)</option>
                                        <option value="0">0% (Autoliquidation)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Coût / Déboursé (€)
                                    </label>
                                    <input
                                        name="cost_ht"
                                        type="number"
                                        step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        readOnly={type === 'ouvrage'}
                                        placeholder="0.00"
                                        className={`w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white font-mono placeholder-slate-500 outline-none transition-all ${
                                            type === 'ouvrage'
                                                ? 'cursor-not-allowed opacity-75 bg-white/[0.01]'
                                                : 'focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* SECTION STOCK (Uniquement pour fournitures) */}
                            {type === 'simple' && (
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Gestion de Stock & Fournisseur (Optionnel)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="mb-1 block text-[11px] text-slate-400">Stock Actuel</label>
                                            <input
                                                name="stock"
                                                type="number"
                                                step="1"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] text-slate-400">Seuil d&apos;alerte</label>
                                            <input
                                                name="min_stock"
                                                type="number"
                                                step="1"
                                                value={minStock}
                                                onChange={(e) => setMinStock(e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] text-slate-400">Fournisseur</label>
                                            <input
                                                name="supplier"
                                                type="text"
                                                value={supplier}
                                                onChange={(e) => setSupplier(e.target.value)}
                                                placeholder="Nom fournisseur"
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    <span>{articleToEdit ? "Mettre à jour l'article" : "Enregistrer l'article"}</span>
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
