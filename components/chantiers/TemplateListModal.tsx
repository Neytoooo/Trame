'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, Loader2, ArrowRight } from 'lucide-react'
import { getTemplates, loadTemplate } from '@/app/actions/templates'

interface TemplateListModalProps {
    isOpen: boolean
    onClose: () => void
    chantierId: string
}

export default function TemplateListModal({ isOpen, onClose, chantierId }: TemplateListModalProps) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [importing, setImporting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            getTemplates().then(res => {
                if (res.data) setTemplates(res.data)
                setLoading(false)
            })
        }
    }, [isOpen])

    const handleImport = async (templateId: string) => {
        if (!confirm("⚠️ Attention : Charger un modèle va remplacer le graphe actuel. Continuer ?")) return

        setImporting(true)
        const res = await loadTemplate(chantierId, templateId)

        if (res.success) {
            // Need to reload window or notify parent to refresh?
            // loadTemplate does revalidatePath, but client state in SuiviGraph needs update if not full reload.
            // Since SuiviGraph listens to Realtime, the DELETE then INSERT operations from server action
            // SHOULD trigger the realtime updates automatically! :D
            // Wait a bit for realtime to propagate?
            onClose()
        } else {
            alert("Erreur : " + res.error)
        }
        setImporting(false)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col max-h-[80vh]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-500" />
                            Charger un Modèle
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 flex-1">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Aucun modèle sauvegardé.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${activeId === template.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                                : 'border-gray-200 dark:border-white/10 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                        onClick={() => setActiveId(template.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description || "Pas de description"}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                                        {template.nodes?.length || 0} étapes
                                                    </span>
                                                </div>
                                            </div>
                                            {activeId === template.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleImport(template.id)
                                                    }}
                                                    disabled={importing}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                                >
                                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Charger"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
