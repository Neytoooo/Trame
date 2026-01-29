import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import DevisList from '@/components/devis/DevisList'

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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Devis</h1>
                    <p className="text-gray-400">Gérez vos propositions commerciales</p>
                </div>

                {/* On ne peut pas créer un devis sans chantier pour l'instant, 
                    donc on redirige vers la liste des chantiers ou on ouvre un modal de sélection de chantier.
                    Pour faire simple : Bouton vers chantiers */}
                <Link
                    href="/dashboard/chantiers"
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Nouveau Devis
                </Link>
            </div>

            <DevisList initialDevis={devis || []} />
        </div>
    )
}
