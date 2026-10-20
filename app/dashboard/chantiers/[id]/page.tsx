import { createClient } from '@/utils/supabase/server'
import { createEmptyDevis } from '@/app/actions/devis'
import { notFound } from 'next/navigation'
import ChantierDashboard from '@/components/chantiers/ChantierDashboard'

// Cette fonction reçoit l'ID depuis l'URL (ex: /dashboard/chantiers/123-abc)
export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Exécution en parallèle des 4 requêtes du chantier
    const [chantierRes, devisRes, facturesRes, nodesRes] = await Promise.all([
        supabase
            .from('chantiers')
            .select('*, clients(*)')
            .eq('id', id)
            .single(),
        supabase
            .from('devis')
            .select('*')
            .eq('chantier_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('factures')
            .select('*')
            .eq('chantier_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('chantier_nodes')
            .select('data')
            .eq('chantier_id', id)
            .eq('action_type', 'quote')
    ])

    const chantier = chantierRes.data
    const error = chantierRes.error
    const devisList = devisRes.data
    const facturesList = facturesRes.data
    const nodes = nodesRes.data

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