import { createClient } from '@/utils/supabase/server'
import NewChantierModal from '@/components/dashboard/NewChantierModal'
import ChantiersListClient from '@/components/chantiers/ChantiersListClient'

export default async function ChantiersPage() {
    const supabase = await createClient()

    // 1. Exécution en parallèle des chantiers et de la liste des clients
    const [chantiersRes, clientsRes] = await Promise.all([
        supabase
            .from('chantiers')
            .select(`
                *,
                clients(name),
                chantier_nodes(status, type)
            `)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase
            .from('clients')
            .select('id, name')
            .order('name')
    ])

    const chantiers = chantiersRes.data
    const clients = clientsRes.data

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header (Always Fixed) */}
            <div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center justify-between pb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chantiers en cours</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Suivez l'avancement et la rentabilité de vos projets.</p>
                </div>
                {/* On passe la liste des clients au composant client */}
                <NewChantierModal clients={clients || []} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <ChantiersListClient initialChantiers={chantiers || []} />
            </div>
        </div>
    )
}