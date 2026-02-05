'use client'

import { useState } from 'react'
import { X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface NewNodeQuoteModalProps {
    isOpen: boolean
    onClose: () => void
    chantierId: string
    onQuoteCreated: (quoteId: string, quoteTitle: string) => void
}

export default function NewNodeQuoteModal({ isOpen, onClose, chantierId, onQuoteCreated }: NewNodeQuoteModalProps) {
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)

        try {
            // 1. Create the Quote (Devis)
            // Default status 'brouillon'
            // We need a reference number, let's generate a temporary one or let DB handle it?
            // Usually we want a reference like DEV-{Year}-{Count}.
            // For simplicity here, let's just insert basic info and let database defaults/triggers handle reference if setup,
            // OR generate a simple timestamp-based reference if needed locally.
            // Let's assume there is a trigger or we generate one.
            const ref = `DEV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

            const { data: newQuote, error } = await supabase
                .from('devis')
                .insert({
                    chantier_id: chantierId,
                    reference: ref,
                    name: title,
                    status: 'brouillon',
                    total_ht: 0
                })
                .select()
                .single()

            if (error) throw error

            // 2. Callback
            onQuoteCreated(newQuote.id, title)
            onClose()

        } catch (error) {
            console.error("Error creating linked quote:", error)
            alert("Erreur lors de la création du devis")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} />
                        Nouveau Devis
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Nom du devis
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Menuiserie Extérieure"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Ce devis sera exclusivement lié à cette étape du workflow.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                            Créer et Lier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
