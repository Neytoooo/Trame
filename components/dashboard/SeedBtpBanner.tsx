'use client'

import { useState } from 'react'
import { HardHat, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Building2, FileCheck, Layers } from 'lucide-react'
import { seedProBtpDataAction } from '@/app/actions/seed_pro_data'
import { useRouter } from 'next/navigation'

interface SeedBtpBannerProps {
    clientCount: number
}

export default function SeedBtpBanner({ clientCount }: SeedBtpBannerProps) {
    const [loading, setLoading] = useState(false)
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleSeed = async () => {
        setLoading(true)
        setStatusMsg(null)

        try {
            const res = await seedProBtpDataAction()
            if (res.success) {
                setStatusMsg({
                    type: 'success',
                    text: `✅ Données créées avec succès ! 3 Clients, 3 Chantiers, Devis & Factures initialisés avec mattiskhn@gmail.com.`
                })
                router.refresh()
            } else {
                setStatusMsg({
                    type: 'error',
                    text: res.error || "Une erreur est survenue lors de l'initialisation."
                })
            }
        } catch (e: any) {
            setStatusMsg({
                type: 'error',
                text: e.message || "Erreur de connexion au serveur."
            })
        } finally {
            setLoading(false)
        }
    }

    // Si les données sont déjà là, on affiche un bouton compact discret
    if (clientCount > 0) {
        return (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <HardHat size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Données Démo BTP Métier actives</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">3 Clients Copro & Syndics (Poissy, Saint-Mandé, Conflans) • Email: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-medium">mattiskhn@gmail.com</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {statusMsg && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                            {statusMsg.text}
                        </span>
                    )}
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#1A2438] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
                        title="Réinitialiser et recharger les 3 clients BTP"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""} />
                        {loading ? "Génération..." : "Recharger la démo BTP"}
                    </button>
                </div>
            </div>
        )
    }

    // Si la base est vide (clientCount === 0), on affiche une bannière complète et invitante
    return (
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-slate-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Sparkles size={13} />
                            Données BTP Démo Pro
                        </span>
                        <span className="text-xs text-gray-400">Prêt pour test complet</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        Initialiser les 3 Clients & 3 Chantiers Métier BTP
                    </h2>

                    <p className="text-sm text-gray-300 leading-relaxed">
                        Créez un jeu de données 100% réaliste de travaux de façade & couverture :
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                            <Building2 size={15} className="text-blue-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-white">Syndic LAMY (Poissy)</p>
                                <p className="text-[11px] text-gray-400">D26100199 (208k€ HT) • Acompte 40% (91k€)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                            <Layers size={15} className="text-purple-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-white">Cabinet BARBEY (Saint-Mandé)</p>
                                <p className="text-[11px] text-gray-400">D26100236 (41k€ HT) • Acompte 30% (13k€)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                            <FileCheck size={15} className="text-emerald-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-white">FONCIA (Conflans)</p>
                                <p className="text-[11px] text-gray-400">D23010550 (74k€ HT) • Acompte & Situation n°1</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-blue-200/80 pt-1">
                        🎯 Tous les emails clients et facturation sont configurés avec <span className="font-mono font-semibold text-blue-300">mattiskhn@gmail.com</span> pour vous permettre de tester les envois de devis, factures et notifications.
                    </p>
                </div>

                <div className="flex flex-col items-stretch sm:items-end gap-3 flex-shrink-0">
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="group flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <HardHat size={18} className={loading ? "animate-bounce" : "group-hover:rotate-12 transition-transform"} />
                        {loading ? "Génération des données..." : "Générer les 3 Chantiers BTP"}
                    </button>

                    {statusMsg && (
                        <div className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border max-w-sm ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
                            <span>{statusMsg.text}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
