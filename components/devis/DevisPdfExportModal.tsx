'use client'

import { useState } from 'react'
import { FileDown, SlidersHorizontal, Check, X, Sparkles } from 'lucide-react'
import { DevisPdfColumnConfig, DEFAULT_PDF_PRESETS } from '@/types/pdfExport'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: DevisPdfColumnConfig) => Promise<void>;
    devisReference: string;
    clientName?: string;
}

export default function DevisPdfExportModal({ isOpen, onClose, onGenerate, devisReference, clientName }: Props) {
    const [config, setConfig] = useState<DevisPdfColumnConfig>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('trame_pdf_config_devis')
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch {
                    // fallback
                }
            }
        }
        return DEFAULT_PDF_PRESETS.ARCHITECTE_MOE.config
    })
    const [isGenerating, setIsGenerating] = useState(false)

    if (!isOpen) return null

    const toggleColumn = (key: keyof DevisPdfColumnConfig) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const applyPreset = (presetKey: keyof typeof DEFAULT_PDF_PRESETS) => {
        setConfig(DEFAULT_PDF_PRESETS[presetKey].config)
    }

    const handleExport = async (saveAsDefault = false) => {
        if (saveAsDefault && typeof window !== 'undefined') {
            localStorage.setItem('trame_pdf_config_devis', JSON.stringify(config))
        }
        setIsGenerating(true)
        try {
            await onGenerate(config)
            onClose()
        } catch (err: any) {
            console.error("Erreur génération PDF devis:", err)
            alert("Erreur lors de la génération du PDF: " + (err?.message || err))
        } finally {
            setIsGenerating(false)
        }
    }

    const columnsList: { key: keyof DevisPdfColumnConfig; label: string; desc: string }[] = [
        { key: 'showReference', label: 'Code & Référence article', desc: 'Code catalogue ou référence technique BTP' },
        { key: 'showDescription', label: 'Description détaillée & compléments', desc: 'Désignation principale et précisions techniques' },
        { key: 'showQuantity', label: 'Quantité', desc: 'Volume ou métré chiffré' },
        { key: 'showUnit', label: 'Unité de mesure', desc: 'm², ml, kg, forfait, unité' },
        { key: 'showUnitPrice', label: 'Prix Unitaire HT', desc: 'Tarif unitaire appliqué avant remise' },
        { key: 'showTotalHT', label: 'Total HT par ligne', desc: 'Montant ligne calculé (Qté × PU HT)' },
        { key: 'showTotals', label: 'Totaux financiers en pied de page', desc: 'Total HT Brut, TVA estimée et Total TTC final' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
                
                {/* En-tête */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-indigo-600 dark:text-indigo-400" />
                            Personnaliser l'export PDF du devis
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Devis N° {devisReference || 'BTP'} — Choisissez les colonnes et totaux à afficher</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Presets rapides */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                        Presets d'export métier recommandés
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(DEFAULT_PDF_PRESETS).map(([key, preset]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => applyPreset(key as any)}
                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 group cursor-pointer"
                            >
                                <span className="font-bold text-xs block text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {preset.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sélecteur de colonnes */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        Colonnes et données visibles dans le tableau
                    </label>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 p-1.5 max-h-56 overflow-y-auto">
                        {columnsList.map(({ key, label, desc }) => (
                            <label key={key} className="flex items-center justify-between py-2 px-3 hover:bg-white dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors">
                                <div>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">{label}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={Boolean(config[key] ?? true)}
                                    onChange={() => toggleColumn(key)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Note sur les totaux */}
                <div className="rounded-xl p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Désactivez « Totaux financiers » pour exporter un métré d'exécution sans mention de prix pour les équipes chantier.</span>
                </div>

                {/* Pied & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                        Annuler
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleExport(true)}
                            disabled={isGenerating}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl transition-all cursor-pointer"
                            title="Sauvegarder ce réglage de colonnes pour vos prochains exports"
                        >
                            Enregistrer par défaut & Télécharger
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport(false)}
                            disabled={isGenerating}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                            <FileDown size={14} />
                            {isGenerating ? 'Génération...' : 'Télécharger le PDF'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
