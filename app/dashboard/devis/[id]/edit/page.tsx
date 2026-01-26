import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import DevisEditor from '@/components/devis/DevisEditor'

export default async function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Récupérer le Devis + Client + Chantier
    const { data: devis, error } = await supabase
        .from('devis')
        .select(`
      *,
      chantiers (
        id,
        name,
        clients ( id, name, address_line1, city, zip_code )
      )
    `)
        .eq('id', id)
        .single()

    if (error || !devis) return notFound()

    // 2. Récupérer les lignes du devis (Vide au début)
    const { data: items } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', id)
        .order('position', { ascending: true })

    // 3. NOUVEAU : Récupérer TOUS les articles de la bibliothèque pour le sélecteur
    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, name, category, price_ht, unit') // On prend juste ce qu'il faut
        .order('name')

    const client = devis.chantiers?.clients

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* HEADER NAVIGATION */}
            <div className="flex items-center justify-between">
                <Link href={`/dashboard/chantiers/${devis.chantiers.id}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    Retour au chantier
                </Link>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 border border-orange-500/20 uppercase tracking-wide">
                    Mode Édition
                </span>
            </div>

            {/* EN-TÊTE DU DEVIS (Style Facture Papier Moderne) */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Côté Gauche : Titre et Chantier */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Devis #{devis.reference || 'PROVISOIRE'}</h1>
                    <p className="flex items-center gap-2 text-gray-400">
                        <FileText size={16} />
                        Chantier : <span className="text-gray-300">{devis.chantiers.name}</span>
                    </p>
                </div>

                {/* Côté Droit : Info Client (Card) */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                            <User size={16} />
                        </div>
                        <div>
                            <p className="font-semibold text-white">{client?.name}</p>
                            <p className="text-sm text-gray-400">{client?.address_line1}</p>
                            <p className="text-sm text-gray-400">{client?.zip_code} {client?.city}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-gray-500">
                        <Calendar size={12} />
                        Date d'émission : {new Date(devis.date_emission).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            </div>

            {/* L'ÉDITEUR INTERACTIF */}
            <DevisEditor
                initialItems={items || []}
                devisId={devis.id}
                articles={allArticles || []}
            />

        </div>
    )
}