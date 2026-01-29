import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Calendar, FileText, FileCheck } from 'lucide-react'
import Link from 'next/link'
import FactureEditor from '@/components/factures/FactureEditor'

export default async function EditFacturePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Récupérer la Facture + Client + Chantier
    const { data: facture, error } = await supabase
        .from('factures')
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

    if (error || !facture) return notFound()

    // 2. Récupérer les lignes de la facture
    const { data: items } = await supabase
        .from('factures_items')
        .select('*')
        .eq('facture_id', id)
        .order('created_at', { ascending: true })

    // 3. Articles pour le sélecteur (si on le réactive plus tard)
    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, name, category, price_ht, unit')
        .order('name')

    const client = facture.chantiers?.clients

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* HEADER NAVIGATION */}
            <div className="flex items-center justify-between">
                <Link href={`/dashboard/factures`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    Retour aux factures
                </Link>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                        Facture
                    </span>
                    {facture.status === 'payee' && (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/20 uppercase tracking-wide">
                            Payée
                        </span>
                    )}
                </div>
            </div>

            {/* EN-TÊTE FACTURE */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Côté Gauche : Titre et Chantier */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {facture.reference || 'Facture Provisoire'}
                    </h1>
                    <p className="flex items-center gap-2 text-gray-400">
                        <FileText size={16} />
                        Chantier : <span className="text-gray-300">{facture.chantiers.name}</span>
                    </p>
                </div>

                {/* Côté Droit : Info Client */}
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
                        Date d'émission : {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            </div>

            {/* L'ÉDITEUR PREND LE RELAIS */}
            <FactureEditor
                initialItems={items || []}
                factureId={facture.id}
                articles={allArticles || []}
                initialReference={facture.reference}
                initialStatus={facture.status}
                initialDateEcheance={facture.date_echeance}
            />

        </div>
    )
}
