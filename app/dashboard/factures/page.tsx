import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import PillButton from '@/components/ui/PillButton'
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
        .limit(10)

    const { data: companySettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single()

    // Si erreur (table n'existe pas encore), on gère proprement
    if (error && error.code === '42P01') { // undefined_table
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Module Facturation</h1>
                <p className="text-slate-500 dark:text-gray-400 mb-6">La table des factures n'a pas encore été créée.</p>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 inline-block text-left text-sm font-mono">
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Factures</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Suivi des règlements, acomptes et situations de travaux.</p>
                </div>

                <PillButton
                    href="/dashboard/chantiers"
                    icon={<Plus size={14} />}
                >
                    Nouvelle Facture
                </PillButton>
            </div>

            <FactureList initialFactures={factures || []} companySettings={companySettings} />
        </div>
    )
}
