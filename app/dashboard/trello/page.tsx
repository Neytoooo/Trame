'use server'

import { createClient } from '@/utils/supabase/server'
import KanbanBoard from '@/components/trello/KanbanBoard'

export default async function TrelloPage() {
    const supabase = await createClient()

    // Fetch all nodes along with their chantier info
    // We filter out 'start' nodes or irrelevant ones if needed
    const { data: nodes, error } = await supabase
        .from('chantier_nodes')
        .select(`
            *,
            chantiers (
                id,
                name
            )
        `)
        .neq('type', 'start') // Hide start nodes
        .in('action_type', [
            'quote',
            'invoice',
            'setup',
            'site_visit',
            'client_choice',
            'cleaning',
            'material_order',
            'reception_report',
            'photo_report'
        ])
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error("Error fetching nodes for Trello:", error)
        return <div className="p-8 text-white">Erreur de chargement des tâches.</div>
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between pb-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tableau de Bord Tâches</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez l'avancement de vos interventions via une vue Kanban interactive.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <KanbanBoard nodes={nodes || []} />
            </div>
        </div>
    )
}
