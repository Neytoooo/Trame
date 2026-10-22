'use client'

import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle, FileSpreadsheet, Loader2, AlertTriangle, RefreshCw, Edit3, EyeOff } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
    importArticlesWithConflictsAction,
    getExistingArticlesForImportAction,
    ImportArticleItem
} from '@/app/actions/articles'
import PillButton from '@/components/ui/PillButton'

export default function ArticleImportModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewData, setPreviewData] = useState<(ImportArticleItem & { existingName?: string, renamedName?: string })[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setError(null)

        try {
            // 1. Récupérer les articles existants en base pour détecter les doublons
            const existingArticles = await getExistingArticlesForImportAction()
            const existingMap = new Map<string, any>()
            const existingRefMap = new Map<string, any>()

            existingArticles.forEach(ea => {
                if (ea.name) existingMap.set(ea.name.trim().toLowerCase(), ea)
                if (ea.reference) existingRefMap.set(ea.reference.trim().toLowerCase(), ea)
            })

            const reader = new FileReader()
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const wsname = wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

                    const headers = (data[0] as string[]).map(h => (h || '').toString().trim().toLowerCase())
                    const rows = data.slice(1)

                    const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h?.includes(k)))

                    const nameIdx = getIdx(['designation', 'nom', 'libelle', 'name'])
                    const catIdx = getIdx(['cat', 'type', 'category'])
                    const unitIdx = getIdx(['unit', 'u'])
                    const priceIdx = getIdx(['vente', 'prix', 'price', 'pu'])
                    const costIdx = getIdx(['achat', 'cout', 'revient', 'cost', 'debourse'])
                    const refIdx = getIdx(['ref', 'code'])
                    const tvaIdx = getIdx(['tva', 'taxe'])
                    const stockIdx = getIdx(['stock', 'quantite'])
                    const minStockIdx = getIdx(['seuil', 'alert', 'min'])
                    const supplierIdx = getIdx(['fournisseur', 'supplier', 'prov'])

                    if (nameIdx === -1) {
                        setError("Aucune colonne de désignation/nom trouvée dans votre fichier Excel.")
                        setIsLoading(false)
                        return
                    }

                    const mappedData = rows.map((row: any) => {
                        if (!row || row.length === 0) return null

                        const rawName = (row[nameIdx] || '').toString().trim()
                        if (!rawName) return null

                        const rawRef = row[refIdx] ? row[refIdx].toString().trim() : null
                        const existing = existingMap.get(rawName.toLowerCase()) || (rawRef ? existingRefMap.get(rawRef.toLowerCase()) : null)

                        const hasConflict = Boolean(existing)

                        return {
                            name: rawName,
                            category: mapCategory(row[catIdx]),
                            unit: row[unitIdx] || 'u',
                            price_ht: parseFloat(row[priceIdx]) || 0,
                            cost_ht: parseFloat(row[costIdx]) || 0,
                            reference: rawRef,
                            tva: parseFloat(row[tvaIdx]) || 20,
                            stock: parseInt(row[stockIdx]) || 0,
                            min_stock: parseInt(row[minStockIdx]) || 0,
                            supplier: row[supplierIdx] || null,
                            hasConflict,
                            existingId: existing?.id,
                            existingName: existing?.name,
                            conflictStrategy: (hasConflict ? 'replace' : undefined) as 'replace' | 'rename' | 'skip' | undefined,
                            renamedName: `${rawName} (copie)`
                        }
                    }).filter(Boolean) as (ImportArticleItem & { existingName?: string, renamedName?: string })[]

                    if (mappedData.length === 0) {
                        setError("Aucune donnée valide trouvée. Vérifiez les en-têtes (Désignation, Catégorie, Unité, Prix).")
                    } else {
                        setPreviewData(mappedData)
                    }
                } catch (err) {
                    console.error(err)
                    setError("Erreur lors de la lecture du fichier Excel.")
                } finally {
                    setIsLoading(false)
                }
            }
            reader.readAsBinaryString(file)
        } catch (err) {
            console.error(err)
            setError("Erreur de connexion au serveur.")
            setIsLoading(false)
        }
    }

    const mapCategory = (val: string) => {
        const v = val?.toString().toLowerCase() || ''
        if (v.includes('main')) return 'main_doeuvre'
        if (v.includes('engin') || v.includes('machine')) return 'engin'
        return 'fourniture'
    }

    const conflictsCount = previewData.filter(p => p.hasConflict).length

    const applyGlobalStrategy = (strategy: 'replace' | 'rename' | 'skip') => {
        setPreviewData(prev => prev.map(item => {
            if (!item.hasConflict) return item
            return {
                ...item,
                conflictStrategy: strategy
            }
        }))
    }

    const setItemStrategy = (index: number, strategy: 'replace' | 'rename' | 'skip') => {
        setPreviewData(prev => {
            const next = [...prev]
            next[index] = { ...next[index], conflictStrategy: strategy }
            return next
        })
    }

    const setItemRenamedName = (index: number, newName: string) => {
        setPreviewData(prev => {
            const next = [...prev]
            next[index] = { ...next[index], renamedName: newName }
            return next
        })
    }

    const handleImport = async () => {
        if (previewData.length === 0) return
        setIsLoading(true)
        setError(null)

        try {
            const itemsToSend = previewData.map(item => {
                if (item.hasConflict && item.conflictStrategy === 'rename') {
                    return {
                        ...item,
                        name: item.renamedName || `${item.name} (copie)`
                    }
                }
                return item
            })

            const res = await importArticlesWithConflictsAction(itemsToSend)
            if (res.success) {
                setIsOpen(false)
                setPreviewData([])
                const summaryParts = []
                if (res.insertedCount) summaryParts.push(`${res.insertedCount} nouveau(x) produit(s) ajouté(s)`)
                if (res.updatedCount) summaryParts.push(`${res.updatedCount} produit(s) mis à jour/remplacé(s)`)
                if (res.skippedCount) summaryParts.push(`${res.skippedCount} doublon(s) ignoré(s)`)

                alert(`Importation réussie !\n\n${summaryParts.join('\n') || `${res.count} articles traités.`}`)
                window.location.reload()
            } else {
                setError(res.error || "Erreur lors de l'import")
            }
        } catch (e: any) {
            setError(e.message || "Erreur serveur lors de l'importation")
        } finally {
            setIsLoading(false)
        }
    }

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { Reference: "PLA001", Designation: 'Plaque BA13', Categorie: 'Fourniture', Unite: 'm2', Prix_Vente: 8.50, Prix_Achat: 3.20, TVA: 20, Stock: 500, Seuil_Alerte: 50, Fournisseur: "Point.P" },
            { Reference: "MO_PEINT", Designation: 'Main d\'oeuvre Peintre', Categorie: 'Main d\'oeuvre', Unite: 'h', Prix_Vente: 45.00, Prix_Achat: 0, TVA: 10, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Interne" }
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Modele")
        XLSX.writeFile(wb, "modele_import_articles.xlsx")
    }

    return (
        <>
            <PillButton
                onClick={() => setIsOpen(true)}
                variant="success"
                icon={<FileSpreadsheet size={14} />}
            >
                Importer (Excel)
            </PillButton>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileSpreadsheet className="text-emerald-500" />
                                Importer des articles (Excel / CSV)
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {!previewData.length ? (
                            <div className="space-y-6 py-6">
                                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center transition-colors hover:bg-white/10 relative">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        disabled={isLoading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto mb-4 text-gray-400" size={32} />
                                    <p className="text-lg font-medium text-white">Glissez votre fichier ici ou cliquez pour parcourir</p>
                                    <p className="text-sm text-gray-500 mt-2">Format supporté: .xlsx, .csv</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FileSpreadsheet size={14} />
                                        <span>Télécharger le modèle Excel vierge</span>
                                    </button>
                                    <span className="text-gray-600 hidden sm:inline">•</span>
                                    <a
                                        href="/test_articles_btp.xlsx"
                                        download="test_articles_btp.xlsx"
                                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium cursor-pointer"
                                    >
                                        <FileSpreadsheet size={14} />
                                        <span>Télécharger le fichier de test (avec doublons & nouveaux articles)</span>
                                    </a>
                                </div>

                                {isLoading && (
                                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Analyse du fichier et détection des doublons...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="rounded-lg bg-red-500/10 p-4 text-red-400 flex items-center gap-2 text-sm border border-red-500/20">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
                                {/* Conflict Summary Bar */}
                                {conflictsCount > 0 ? (
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                                        <div className="flex items-center gap-2.5 text-amber-300 text-xs md:text-sm font-medium">
                                            <AlertTriangle size={18} className="shrink-0 text-amber-400" />
                                            <span>
                                                <strong>{conflictsCount} produit(s) existent déjà</strong> dans votre catalogue.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[11px] text-gray-400">Action pour tous les doublons :</span>
                                            <button
                                                type="button"
                                                onClick={() => applyGlobalStrategy('replace')}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 transition-all font-medium flex items-center gap-1"
                                                title="Mettre à jour le produit existant avec les nouvelles données du fichier"
                                            >
                                                <RefreshCw size={12} />
                                                Tout remplacer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyGlobalStrategy('rename')}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 transition-all font-medium flex items-center gap-1"
                                                title="Ajouter comme nouveau produit en ajoutant (copie)"
                                            >
                                                <Edit3 size={12} />
                                                Tout renommer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyGlobalStrategy('skip')}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all font-medium flex items-center gap-1"
                                                title="Ignorer les doublons et n'importer que les nouveaux produits"
                                            >
                                                <EyeOff size={12} />
                                                Tout ignorer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 shrink-0">
                                        <Check size={14} className="text-emerald-400" />
                                        <span>Tous les <strong>{previewData.length} produits</strong> sont nouveaux et seront ajoutés à votre catalogue sans doublon.</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between shrink-0">
                                    <p className="text-xs text-gray-400">
                                        {previewData.length} articles trouvés dans le fichier • <span className="text-emerald-400">{previewData.length - conflictsCount} nouveaux</span> {conflictsCount > 0 && <span className="text-amber-400">• {conflictsCount} doublon(s)</span>}
                                    </p>
                                    <button onClick={() => setPreviewData([])} className="text-xs text-gray-400 hover:text-white underline">
                                        Changer de fichier
                                    </button>
                                </div>

                                {/* Table Preview with Conflict Resolution */}
                                <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-white/5">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-black/40 text-gray-400 uppercase sticky top-0 backdrop-blur-md z-10">
                                            <tr>
                                                <th className="px-3 py-2.5">Réf</th>
                                                <th className="px-3 py-2.5">Désignation</th>
                                                <th className="px-3 py-2.5">Catégorie</th>
                                                <th className="px-3 py-2.5">Unité</th>
                                                <th className="px-3 py-2.5 text-right">Prix HT</th>
                                                <th className="px-3 py-2.5 text-right">Stock</th>
                                                <th className="px-3 py-2.5 text-center min-w-[240px]">Gestion du doublon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {previewData.map((row, i) => (
                                                <tr
                                                    key={i}
                                                    className={`hover:bg-white/5 transition-colors ${
                                                        row.hasConflict
                                                            ? row.conflictStrategy === 'skip'
                                                                ? 'opacity-40 bg-black/20'
                                                                : 'bg-amber-500/[0.04]'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-2 text-gray-400 font-mono">{row.reference || '-'}</td>
                                                    <td className="px-3 py-2 text-white font-medium max-w-[260px]">
                                                        {row.hasConflict && row.conflictStrategy === 'rename' ? (
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={row.renamedName || ''}
                                                                    onChange={(e) => setItemRenamedName(i, e.target.value)}
                                                                    className="px-2 py-1 text-xs rounded bg-black/40 border border-amber-500/40 text-amber-200 focus:outline-none focus:border-amber-400"
                                                                    placeholder="Nouveau nom du produit"
                                                                />
                                                                <span className="text-[10px] text-gray-500">Nom original : {row.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span>{row.name}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-400">{row.category}</td>
                                                    <td className="px-3 py-2 text-gray-400">{row.unit}</td>
                                                    <td className="px-3 py-2 text-right text-emerald-400 font-semibold">{row.price_ht?.toFixed(2)} €</td>
                                                    <td className="px-3 py-2 text-right text-gray-300">{row.stock}</td>

                                                    {/* Sélecteur de conflit */}
                                                    <td className="px-3 py-2 text-center">
                                                        {row.hasConflict ? (
                                                            <div className="flex flex-col items-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                    <AlertTriangle size={10} />
                                                                    Existe déjà
                                                                </span>
                                                                <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-0.5 gap-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setItemStrategy(i, 'replace')}
                                                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                                                            row.conflictStrategy === 'replace'
                                                                                ? 'bg-blue-600 text-white font-bold shadow'
                                                                                : 'text-gray-400 hover:text-white'
                                                                        }`}
                                                                        title="Remplacer les données de l'article existant"
                                                                    >
                                                                        Remplacer
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setItemStrategy(i, 'rename')}
                                                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                                                            row.conflictStrategy === 'rename'
                                                                                ? 'bg-amber-600 text-white font-bold shadow'
                                                                                : 'text-gray-400 hover:text-white'
                                                                        }`}
                                                                        title="Renommer pour créer un second produit distinct"
                                                                    >
                                                                        Renommer
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setItemStrategy(i, 'skip')}
                                                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                                                            row.conflictStrategy === 'skip'
                                                                                ? 'bg-red-600/80 text-white font-bold shadow'
                                                                                : 'text-gray-400 hover:text-white'
                                                                        }`}
                                                                        title="Ne pas ajouter cet article"
                                                                    >
                                                                        Ne pas ajouter
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                <Check size={10} />
                                                                Nouveau
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
                                    <div className="text-xs text-gray-400">
                                        <span>Articles à insérer : <strong>{previewData.filter(p => !p.hasConflict || p.conflictStrategy === 'rename').length}</strong></span>
                                        {conflictsCount > 0 && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span>À remplacer : <strong>{previewData.filter(p => p.hasConflict && p.conflictStrategy === 'replace').length}</strong></span>
                                                <span className="mx-2">•</span>
                                                <span>Ignorés : <strong>{previewData.filter(p => p.hasConflict && p.conflictStrategy === 'skip').length}</strong></span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleImport}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                            Valider l'importation
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-center text-red-400 text-sm mt-1">{error}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
