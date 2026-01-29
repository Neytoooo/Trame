import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import FactureList from '@/components/factures/FactureList'

export default async function FacturesPage() {
    const supabase = await createClient()

    // Récupérer les factures (si la table existe)
    const { data: factures, error } = await supabase
        .from('factures')
        .select(`
            *,
            factures_items (*),
            chantiers (
                id,
                name,
                clients ( id, name, address_line1, city, zip_code, email, billing_email )
            )
        `)
        .order('date_emission', { ascending: false })

    // Si erreur (table n'existe pas encore), on gère proprement
    if (error && error.code === '42P01') { // undefined_table
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Module Facturation</h1>
                <p className="text-gray-400 mb-6">La table des factures n'a pas encore été créée.</p>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 inline-block text-left text-sm font-mono">
                    <p>Veuillez exécuter le script SQL fourni pour activer ce module.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Factures</h1>
                    <p className="text-gray-400">Suivi des paiements et relances</p>
                </div>

                <Link
                    href="/dashboard/chantiers"
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Nouvelle Facture
                </Link>
            </div>

            <FactureList initialFactures={factures || []} />
        </div>
    )
}
