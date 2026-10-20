'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Activity, ArrowRight, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react'

type Automation = {
    chantier_id: string
    chantier_name: string
    created_at: string
    current_step: string
    progress: number
    status: string
}

export default function ActiveAutomations() {
    // Stable Supabase client
    const supabase = useMemo(() => createClient(), [])
    const [automations, setAutomations] = useState<Automation[]>([])
    const [loading, setLoading] = useState(true)
    const isFetchingRef = useRef(false)

    // Single nested query instead of N+1 separate queries
    const fetchData = useCallback(async () => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        try {
            const { data: chantiers } = await supabase
                .from('chantiers')
                .select(`
                    id,
                    name,
                    status,
                    created_at,
                    chantier_nodes (
                        id,
                        label,
                        status,
                        type,
                        action_type
                    )
                `)
                .eq('status', 'en_cours')
                .order('created_at', { ascending: false })
                .limit(10)

            if (!chantiers || chantiers.length === 0) {
                setAutomations([])
                setLoading(false)
                isFetchingRef.current = false
                return
            }

            const results: Automation[] = []

            for (const c of chantiers) {
                const nodes = (c.chantier_nodes as any[]) || []
                if (nodes.length === 0) continue

                // 1. Check strict Launch Node (Play button)
                const playNode = nodes.find((n: any) => n.action_type === 'play')
                if (!playNode || playNode.status !== 'done') continue

                // Calc Progress
                const steps = nodes.filter((n: any) => n.action_type !== 'play' && n.type === 'step')
                const done = steps.filter((n: any) => n.status === 'done').length
                const total = steps.length
                const progress = total === 0 ? 0 : Math.round((done / total) * 100)

                // Find Current Step (First pending step)
                const pendingSteps = steps.filter((n: any) => n.status === 'pending')
                const currentStepNode = pendingSteps.length > 0 ? pendingSteps[0] : null
                const currentStepName = currentStepNode ? currentStepNode.label : (progress === 100 ? 'Terminé' : 'En attente')

                results.push({
                    chantier_id: c.id,
                    chantier_name: c.name,
                    created_at: c.created_at,
                    current_step: currentStepName,
                    progress,
                    status: c.status
                })
            }

            setAutomations(results)
        } catch (err) {
            console.error("Error fetching active automations:", err)
        } finally {
            setLoading(false)
            isFetchingRef.current = false
        }
    }, [supabase])

    useEffect(() => {
        fetchData()

        // Debounce realtime updates
        let timeout: NodeJS.Timeout | null = null
        const debouncedFetch = () => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                fetchData()
            }, 400)
        }

        const channel = supabase
            .channel('dashboard_automations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chantier_nodes'
                },
                debouncedFetch
            )
            .subscribe()

        return () => {
            if (timeout) clearTimeout(timeout)
            supabase.removeChannel(channel)
        }
    }, [fetchData, supabase])

    if (loading) return (
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-[#131B2A] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] backdrop-blur-md flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
    )

    return (
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-[#131B2A] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-2">
                    <Activity className="text-indigo-600 dark:text-indigo-400" size={18} />
                    Automatisations en cours
                </h2>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-0.5 rounded-full">
                    {automations.length} actif{automations.length !== 1 ? 's' : ''}
                </span>
            </div>

            {automations.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    Aucune automatisation active.
                </div>
            ) : (
                <div className="space-y-4">
                    {automations.map((auto) => (
                        <Link
                            key={auto.chantier_id}
                            href={`/dashboard/chantiers/${auto.chantier_id}/suivi`}
                            className="block group"
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0E1524] p-4 transition-all hover:bg-indigo-50/40 dark:hover:bg-[#162032] hover:border-indigo-200 dark:hover:border-slate-700 hover:shadow-sm">

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                                            {auto.chantier_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                                            <PlayCircle size={12} />
                                            Lancé le {new Date(auto.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#131B2A] p-2 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-xs group-hover:border-indigo-300 dark:group-hover:border-indigo-500">
                                        <ArrowRight size={15} className="text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                                            {auto.progress === 100 ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Loader2 size={14} className="animate-spin text-indigo-600 dark:text-indigo-400" />}
                                            {auto.current_step}
                                        </span>
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{auto.progress}%</span>
                                    </div>

                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${auto.progress}%` }}
                                        />
                                    </div>
                                </div>

                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
