import { createClient } from '@/utils/supabase/server'
import DevisList from '@/components/devis/DevisList'
import AiDevisButton from '@/components/devis/AiDevisButton'
import NewDevisButton from '@/components/devis/NewDevisButton'

export default async function DevisPage() {
    const supabase = await createClient()

    // 1. Récupération des 10 premiers devis
    const { data: devis } = await supabase
        .from('devis')
        .select(`
            *,
            chantiers (
                id,
                name,
                clients ( id, name )
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    // 2. Récupérer la liste des chantiers pour la création rapide
    const { data: chantiers } = await supabase
        .from('chantiers')
        .select('id, name, clients ( name )')
        .order('created_at', { ascending: false })

    const formattedChantiers = (chantiers || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        clientName: c.clients?.name
    }))

    // 3. Récupérer les clients pour création éventuelle
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

    // 4. Cibler uniquement les nodes des chantiers concernés (évite le scan complet de la table)
    const chantierIds = Array.from(new Set(devis?.map((d: any) => d.chantiers?.id).filter(Boolean)))
    let linkedDevisIds: string[] = []

    if (chantierIds.length > 0) {
        const { data: nodes } = await supabase
            .from('chantier_nodes')
            .select('data')
            .in('chantier_id', chantierIds)
            .eq('action_type', 'quote')

        linkedDevisIds = nodes?.map((n: any) => n.data?.devis_id).filter(Boolean) || []
    }

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header (Always Fixed) */}
            <div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Devis</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez vos propositions commerciales et chiffrages BTP.</p>
                </div>

                <div className="flex items-center gap-3">
                    <AiDevisButton />
                    
                    <NewDevisButton
                        chantiers={formattedChantiers}
                        clients={clients || []}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <DevisList initialDevis={devis || []} linkedDevisIds={linkedDevisIds} />
            </div>
        </div>
    )
}
