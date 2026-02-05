'use client'

import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { importArticlesAction } from '@/app/actions/articles'

export default function ArticleImportModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewData, setPreviewData] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setError(null)

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

                // Headers expected: Designation, Categorie, Unite, Prix_Vente, Prix_Achat (optional)
                // We'll try to map leniently
                const headers = (data[0] as string[]).map(h => h?.trim().toLowerCase())
                const rows = data.slice(1)

                // Mapping logic
                const mappedData = rows.map((row: any) => {
                    if (!row || row.length === 0) return null

                    // Helper to get index safely
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

                    if (nameIdx === -1) return null // Mandatory

                    return {
                        name: row[nameIdx],
                        category: mapCategory(row[catIdx]),
                        unit: row[unitIdx] || 'u',
                        price_ht: parseFloat(row[priceIdx]) || 0,
                        cost_ht: parseFloat(row[costIdx]) || 0,
                        reference: row[refIdx] || null,
                        tva: parseFloat(row[tvaIdx]) || 20,
                        stock: parseInt(row[stockIdx]) || 0,
                        min_stock: parseInt(row[minStockIdx]) || 0,
                        supplier: row[supplierIdx] || null
                    }
                }).filter(Boolean)

                if (mappedData.length === 0) {
                    setError("Aucune donnée valide trouvée. Vérifiez les en-têtes (Désignation, Catégorie, Unité, Prix).")
                } else {
                    setPreviewData(mappedData)
                }
            } catch (err) {
                console.error(err)
                setError("Erreur lors de la lecture du fichier.")
            } finally {
                setIsLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const mapCategory = (val: string) => {
        const v = val?.toString().toLowerCase() || ''
        if (v.includes('main')) return 'main_doeuvre'
        if (v.includes('engin') || v.includes('machine')) return 'engin'
        return 'fourniture' // Default
    }

    const handleImport = async () => {
        if (previewData.length === 0) return
        setIsLoading(true)

        try {
            const res = await importArticlesAction(previewData)
            if (res.success) {
                setIsOpen(false)
                setPreviewData([])
                alert(`${res.count} articles importés avec succès !`)
            } else {
                setError(res.error || "Erreur lors de l'import")
            }
        } catch (e) {
            setError("Erreur serveur")
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
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
                <FileSpreadsheet size={16} />
                Importer (Excel)
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileSpreadsheet className="text-emerald-500" />
                                Importer des articles
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {!previewData.length ? (
                            <div className="space-y-6">
                                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center transition-colors hover:bg-white/10 relative">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto mb-4 text-gray-400" size={32} />
                                    <p className="text-lg font-medium text-white">Glissez votre fichier ici ou cliquez pour parcourir</p>
                                    <p className="text-sm text-gray-500 mt-2">Format supporté: .xlsx, .csv</p>
                                </div>

                                <div className="text-center">
                                    <button onClick={downloadTemplate} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                                        Télécharger le modèle Excel
                                    </button>
                                </div>

                                {isLoading && <div className="text-center text-emerald-500">Lecture du fichier...</div>}
                                {error && (
                                    <div className="rounded-lg bg-red-500/10 p-4 text-red-400 flex items-center gap-2 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400">{previewData.length} articles trouvés</p>
                                    <button onClick={() => setPreviewData([])} className="text-xs text-gray-500 hover:text-white">Annuler et changer de fichier</button>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-black/20 text-gray-500 uppercase sticky top-0 backdrop-blur-md z-10">
                                            <tr>
                                                <th className="px-4 py-2">Réf</th>
                                                <th className="px-4 py-2">Désignation</th>
                                                <th className="px-4 py-2">Catégorie</th>
                                                <th className="px-4 py-2">Unité</th>
                                                <th className="px-4 py-2 text-right">Prix HT</th>
                                                <th className="px-4 py-2 text-right">Coût HT</th>
                                                <th className="px-4 py-2 text-right">Stock</th>
                                                <th className="px-4 py-2">Fournisseur</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {previewData.slice(0, 50).map((row, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-2 text-gray-400 font-mono">{row.reference}</td>
                                                    <td className="px-4 py-2 text-white font-medium">{row.name}</td>
                                                    <td className="px-4 py-2 text-gray-400">{row.category}</td>
                                                    <td className="px-4 py-2 text-gray-400">{row.unit}</td>
                                                    <td className="px-4 py-2 text-right text-emerald-400">{row.price_ht?.toFixed(2)} €</td>
                                                    <td className="px-4 py-2 text-right text-gray-500">{row.cost_ht?.toFixed(2)} €</td>
                                                    <td className={`px-4 py-2 text-right font-medium ${row.stock <= row.min_stock ? 'text-red-400' : 'text-blue-400'}`}>
                                                        {row.stock}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-400 truncate max-w-[100px]">{row.supplier}</td>
                                                </tr>
                                            ))}
                                            {previewData.length > 50 && (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-2 text-center text-gray-500 italic">
                                                        ... et {previewData.length - 50} autres lignes
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                        Valider l'import
                                    </button>
                                </div>
                                {error && (
                                    <div className="text-center text-red-400 text-sm mt-2">{error}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
