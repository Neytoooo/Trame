import { createClient } from '@/utils/supabase/server'
import NewChantierModal from '@/components/dashboard/NewChantierModal'
import ChantiersListClient from '@/components/chantiers/ChantiersListClient'

export default async function ChantiersPage() {
    const supabase = await createClient()

    // 1. On récupère les chantiers ET le nom du client associé (Jointure) ET les nœuds pour le calcul (limite 10)
    const { data: chantiers } = await supabase
        .from('chantiers')
        .select(`
            *,
            clients(name),
            chantier_nodes(status, type)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    // 2. On récupère la liste simple des clients pour le formulaire
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chantiers en cours</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Suivez l'avancement et la rentabilité de vos projets.</p>
                </div>
                {/* On passe la liste des clients au composant client */}
                <NewChantierModal clients={clients || []} />
            </div>

            <ChantiersListClient initialChantiers={chantiers || []} />
        </div>
    )
}