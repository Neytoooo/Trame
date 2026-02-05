import { createClient } from '@/utils/supabase/server'
import { createEmptyDevis } from '@/app/actions/devis'
import { notFound } from 'next/navigation'
import ChantierDashboard from '@/components/chantiers/ChantierDashboard'

// Cette fonction reçoit l'ID depuis l'URL (ex: /dashboard/chantiers/123-abc)
export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. On récupère le chantier ET le client associé
    const { data: chantier, error } = await supabase
        .from('chantiers')
        .select('*, clients(*)') // La magie de Supabase : on récupère tout le client lié
        .eq('id', id)
        .single()
    // 2. On récupère les devis associés au chantier
    const { data: devisList } = await supabase
        .from('devis')
        .select('*')
        .eq('chantier_id', id)
        .order('created_at', { ascending: false })

    // 3. On récupère les factures associées au chantier
    const { data: facturesList } = await supabase
        .from('factures')
        .select('*')
        .eq('chantier_id', id)
        .order('created_at', { ascending: false })

    // 4. On récupère les nodes du workflow pour savoir quels devis sont pilotés par l'automation
    const { data: nodes } = await supabase
        .from('chantier_nodes')
        .select('data')
        .eq('chantier_id', id)
        .eq('action_type', 'quote')

    const linkedDevisIds = new Set(nodes?.map((n: any) => n.data?.devis_id).filter(Boolean))

    if (error || !chantier) {
        return notFound() // Affiche une page 404 si l'ID n'existe pas
    }

    return (
        <ChantierDashboard
            chantier={chantier}
            devisList={devisList || []}
            facturesList={facturesList || []}
            linkedDevisIds={linkedDevisIds}
            createEmptyDevisAction={createEmptyDevis}
        />
    )
}