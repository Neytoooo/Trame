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

    // 2.5 Enrichissement avec les composants (Pour les Ouvrages)
    let enrichedItems = items || []

    if (items && items.length > 0) {
        const parentIds = items.map((i: any) => i.article_id).filter(Boolean)

        if (parentIds.length > 0) {
            // A. Récupérer les liaisons
            const { data: liaisons } = await supabase
                .from('article_composants')
                .select('parent_article_id, child_article_id, quantity')
                .in('parent_article_id', parentIds)

            if (liaisons && liaisons.length > 0) {
                // B. Récupérer les infos des enfants
                const childIds = liaisons.map((l: any) => l.child_article_id)
                const { data: childArticles } = await supabase
                    .from('articles')
                    .select('id, name, unit')
                    .in('id', childIds)

                // C. Mapper le tout
                enrichedItems = items.map((item: any) => {
                    const itemLiaisons = liaisons.filter((l: any) => l.parent_article_id === item.article_id)
                    if (itemLiaisons.length > 0) {
                        const components = itemLiaisons.map((l: any) => {
                            const child = childArticles?.find((c: any) => c.id === l.child_article_id)
                            return {
                                name: child?.name || 'Inconnu',
                                quantity: l.quantity,
                                unit: child?.unit || 'u'
                            }
                        })
                        return { ...item, components }
                    }
                    return item
                })
            }
        }
    }

    // 3. Articles pour le sélecteur (si on le réactive plus tard)
    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, name, category, price_ht, unit')
        .order('name')

    const client = facture.chantiers?.clients

    return (
        <div className="h-[calc(100vh-105px)] flex flex-col gap-2.5 overflow-hidden animate-in fade-in duration-300">

            {/* HEADER NAVIGATION */}
            <div className="flex items-center justify-between shrink-0">
                <Link href={`/dashboard/factures`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] px-3.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white shadow-xs hover:border-slate-300 dark:hover:border-slate-700">
                    <ArrowLeft size={14} />
                    Retour aux factures
                </Link>
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        Facture {facture.type ? `(${facture.type})` : ''}
                    </span>
                    {facture.status === 'payee' && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            Payée
                        </span>
                    )}
                </div>
            </div>

            {/* L'ÉDITEUR PREND LE RELAIS (Prend tout l'espace disponible sans dépasser) */}
            <div className="flex-1 min-h-0">
                <FactureEditor
                    initialItems={enrichedItems}
                    factureId={facture.id}
                    articles={allArticles || []}
                    initialReference={facture.reference}
                    initialStatus={facture.status}
                    initialDateEcheance={facture.date_echeance}
                    initialType={facture.type || 'standard'} // Default to standard if null
                    chantierName={facture.chantiers?.name}
                    client={client}
                    dateEmission={facture.date_emission}
                />
            </div>

        </div>
    )
}
