'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Loader2, Wand2 } from 'lucide-react'
import { generateDevisFromEmail } from '@/app/actions/ai_devis'

export default function AiDevisModal({ onClose }: { onClose: () => void }) {
    const [emailText, setEmailText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleGenerate = async () => {
        if (!emailText.trim()) {
            setError("Veuillez coller le contenu de l'email ou la demande.")
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
            setError("Une erreur inattendue est survenue lors de l'analyse.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop sombre avec flou moderne */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Container Trame DA */}
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#0B101B]/95 p-0 text-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/15 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                Générer un devis par IA
                                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                                    IA BTP
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Analyse automatique de texte & matching avec votre bibliothèque de prix
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-300 leading-relaxed">
                        Collez ci-dessous le contenu de l&apos;email ou la demande du client. L&apos;Intelligence Artificielle va analyser le texte, extraire les besoins, et chercher dans votre catalogue les articles correspondants pour créer un brouillon de devis complet.
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Wand2 size={13} className="text-purple-400" />
                            Demande ou email du client
                        </label>
                        <textarea
                            value={emailText}
                            onChange={(e) => setEmailText(e.target.value)}
                            placeholder="Ex: Bonjour, je souhaite repeindre mon salon de 30m2 avec le plafond, poser 45m2 de parquet chêne dans les chambres, et installer 4 prises électriques supplémentaires..."
                            className="w-full h-52 p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-500 outline-none resize-none transition-all focus:border-purple-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-purple-500/20 font-medium leading-relaxed"
                            disabled={isGenerating}
                        />
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || !emailText.trim()}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(147,51,234,0.4)] transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Analyse intelligente en cours...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={15} />
                                <span>Générer le Devis</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
