import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import DevisList from '@/components/devis/DevisList'
import AiDevisButton from '@/components/devis/AiDevisButton'

export default async function DevisPage() {
    const supabase = await createClient()

    // Récupérer les devis avec les infos du chantier et du client
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

    // Récupérer les ids des devis liés à l'automation
    const { data: nodes } = await supabase
        .from('chantier_nodes')
        .select('data')
        .eq('action_type', 'quote')

    const linkedDevisIds = nodes?.map((n: any) => n.data?.devis_id).filter(Boolean) || []

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Devis</h1>
                    <p className="text-slate-500 dark:text-gray-400">Gérez vos propositions commerciales</p>
                </div>

                <div className="flex items-center gap-3">
                    <AiDevisButton />
                    
                    <Link
                        href="/dashboard/chantiers"
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Nouveau Devis
                    </Link>
                </div>
            </div>

            <DevisList initialDevis={devis || []} linkedDevisIds={linkedDevisIds} />
        </div>
    )
}
