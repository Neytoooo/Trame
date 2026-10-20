import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import PillButton from '@/components/ui/PillButton'
import DevisList from '@/components/devis/DevisList'
import AiDevisButton from '@/components/devis/AiDevisButton'

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

    // 2. Cibler uniquement les nodes des chantiers concernés (évite le scan complet de la table)
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Devis</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez vos propositions commerciales et chiffrages BTP.</p>
                </div>

                <div className="flex items-center gap-3">
                    <AiDevisButton />
                    
                    <PillButton
                        href="/dashboard/chantiers"
                        icon={<Plus size={14} />}
                    >
                        Nouveau Devis
                    </PillButton>
                </div>
            </div>

            <DevisList initialDevis={devis || []} linkedDevisIds={linkedDevisIds} />
        </div>
    )
}
