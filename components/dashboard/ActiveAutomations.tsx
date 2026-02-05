'use client'

import { useState, useEffect } from 'react'
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
    const supabase = createClient()
    const [automations, setAutomations] = useState<Automation[]>([])
    const [loading, setLoading] = useState(true)

    // Data Fetching
    const fetchData = async () => {
        // Fetch active chantiers
        const { data: chantiers } = await supabase
            .from('chantiers')
            .select('*')
            .eq('status', 'en_cours')

        if (!chantiers || chantiers.length === 0) {
            setAutomations([])
            setLoading(false)
            return
        }

        // For each chantier, fetch nodes to calculate progress and current step
        const proms = chantiers.map(async (c) => {
            const { data: nodes } = await supabase
                .from('chantier_nodes')
                .select('*')
                .eq('chantier_id', c.id)

            if (!nodes || nodes.length === 0) return null

            // 1. Check strict Launch Node (Play button)
            const playNode = nodes.find((n: any) => n.action_type === 'play')

            // STRICT FILTER: If no Launch node OR Launch node not done, we hide it.
            if (!playNode || playNode.status !== 'done') return null

            // Calc Progress (Exclude 'play' node from steps count to avoid skewing)
            const steps = nodes.filter((n: any) => n.action_type !== 'play' && n.type === 'step')

            const done = steps.filter((n: any) => n.status === 'done').length
            const total = steps.length
            const progress = total === 0 ? 0 : Math.round((done / total) * 100)

            // Find Current Step (First pending step)
            const pendingSteps = steps.filter((n: any) => n.status === 'pending')
            const currentStepNode = pendingSteps.length > 0 ? pendingSteps[0] : null
            const currentStepName = currentStepNode ? currentStepNode.label : (progress === 100 ? 'Terminé' : 'En attente')

            return {
                chantier_id: c.id,
                chantier_name: c.name,
                created_at: c.created_at,
                current_step: currentStepName,
                progress,
                status: c.status
            }
        })

        const results = await Promise.all(proms)
        // Set automations filtering out nulls
        setAutomations(results.filter((r): r is Automation => r !== null))
        setLoading(false)
    }

    useEffect(() => {
        fetchData()

        // Realtime Subscription
        // Listen to ALL node changes. 
        // Note: This listens to global changes on 'chantier_nodes'. 
        // Ideally we filter by the list of chantier IDs, but "in" filter isn't supported in realtime string syntax easily on all chantiers.
        // But since we are on dashboard, user cares about THEIR chantiers.
        // RLS will filter events so we only receive events for chantiers we can see.
        const channel = supabase
            .channel('dashboard_automations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chantier_nodes'
                },
                () => {
                    // Refresh data on any node change
                    // Could be optimized to only update specific entry but refetch is safer for consistency
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (loading) return (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-[#111827] dark:border-white/5 flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    )

    return (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-[#111827] dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-blue-500" size={20} />
                    Automatisations en cours
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                    {automations.length} actif{automations.length !== 1 ? 's' : ''}
                </span>
            </div>

            {automations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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
                            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10">

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {auto.chantier_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <PlayCircle size={12} />
                                            Lancé le {new Date(auto.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-black/20 p-2 rounded-full border border-gray-100 dark:border-white/10">
                                        <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                            {auto.progress === 100 ? <CheckCircle2 size={14} className="text-green-500" /> : <Loader2 size={14} className="animate-spin text-blue-500" />}
                                            {auto.current_step}
                                        </span>
                                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{auto.progress}%</span>
                                    </div>

                                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
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
