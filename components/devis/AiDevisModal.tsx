'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { generateDevisFromEmail } from '@/app/actions/ai_devis'

export default function AiDevisModal({ onClose }: { onClose: () => void }) {
    const [emailText, setEmailText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleGenerate = async () => {
        if (!emailText.trim()) {
            setError("Veuillez coller le contenu de l'email.")
            return
        }

        setIsGenerating(true)
        setError(null)

        try {
            const res = await generateDevisFromEmail(emailText)
            
            if (res.error) {
                setError(res.error)
            } else if (res.success && res.devisId) {
                onClose()
                router.push(`/dashboard/devis/${res.devisId}/edit`)
            }
        } catch (err: any) {
            setError("Une erreur inattendue est survenue.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Sparkles size={20} />
                        <h2 className="text-lg font-bold">Générer un devis par IA</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Collez ci-dessous le contenu de l'email ou la demande du client. L'Intelligence Artificielle va analyser le texte, extraire les besoins, et chercher dans votre catalogue les articles correspondants pour créer un brouillon de devis.
                    </p>

                    <textarea
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        placeholder="Ex: Bonjour, je souhaite repeindre mon salon de 30m2 avec le plafond..."
                        className="w-full h-48 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none dark:bg-black/20 dark:border-white/10 dark:text-white dark:focus:border-purple-500/50"
                        disabled={isGenerating}
                    />

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 dark:bg-white/5 dark:border-white/10">
                    <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !emailText.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-transparent gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Générer le Devis
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    )
}
