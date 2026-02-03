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

    if (error) {
        console.error("Error fetching nodes for Trello:", error)
        return <div className="p-8 text-white">Erreur de chargement des tâches.</div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tableau de Bord Tâches</h1>
                    <p className="text-gray-400">Gérez l'avancement de vos automatisations via une vue Kanban.</p>
                </div>
            </div>

            <KanbanBoard nodes={nodes || []} />
        </div>
    )
}
