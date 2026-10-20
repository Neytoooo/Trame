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

    // 2.5 Enrichissement avec les composants (Pour les Ouvrages)
    let enrichedItems = items || []

    if (items && items.length > 0) {
        const parentIds = items.map(i => i.article_id).filter(Boolean)

        if (parentIds.length > 0) {
            // A. Récupérer les liaisons
            const { data: liaisons } = await supabase
                .from('article_composants')
                .select('parent_article_id, child_article_id, quantity')
                .in('parent_article_id', parentIds)

            if (liaisons && liaisons.length > 0) {
                // B. Récupérer les infos des enfants
                const childIds = liaisons.map(l => l.child_article_id)
                const { data: childArticles } = await supabase
                    .from('articles')
                    .select('id, name, unit')
                    .in('id', childIds)

                // C. Mapper le tout
                enrichedItems = items.map(item => {
                    const itemLiaisons = liaisons.filter(l => l.parent_article_id === item.article_id)
                    if (itemLiaisons.length > 0) {
                        const components = itemLiaisons.map(l => {
                            const child = childArticles?.find(c => c.id === l.child_article_id)
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

    // 3. NOUVEAU : Récupérer TOUS les articles de la bibliothèque pour le sélecteur
    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, name, category, price_ht, unit') // On prend juste ce qu'il faut
        .order('name')

    const client = devis.chantiers?.clients

    // Déballage des métadonnées BTP
    const mappedItems = enrichedItems.map(item => {
        const d = (item.details && typeof item.details === 'object' && !Array.isArray(item.details)) ? item.details : {}
        return {
            ...item,
            reference: d.reference || '',
            complement: d.complement || '',
            discount_pct: d.discount_pct || 0,
            cost_mat: d.cost_mat || 0,
            cost_mo: d.cost_mo || 0,
            cost_fg_pct: d.cost_fg_pct || 0,
            cost_total: d.cost_total || 0,
            margin: d.margin || 0,
            margin_pct: d.margin_pct || 0,
            dont_totalize: Boolean(d.dont_totalize),
            copy_to_schedule: Boolean(d.copy_to_schedule),
            billed_pct: d.billed_pct || 100,
            commercial: d.commercial,
            technicien: d.technicien,
            details: Array.isArray(d.calcLines) ? d.calcLines : (Array.isArray(item.details) ? item.details : [])
        }
    })

    return (
        <div className="h-[calc(100vh-105px)] flex flex-col gap-2.5 overflow-hidden animate-in fade-in duration-300">

            {/* HEADER NAVIGATION */}
            <div className="flex items-center justify-between shrink-0">
                <Link href={`/dashboard/chantiers/${devis.chantiers.id}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] px-3.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white shadow-xs hover:border-slate-300 dark:hover:border-slate-700">
                    <ArrowLeft size={14} />
                    Retour au chantier
                </Link>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Mode Édition Pro BTP
                </span>
            </div>

            {/* L'ÉDITEUR INTERACTIF (Prend tout l'espace restant sans dépasser) */}
            <div className="flex-1 min-h-0">
                <DevisEditor
                    initialItems={mappedItems}
                    devisId={devis.id}
                    articles={allArticles || []}
                    initialName={devis.name || ''}
                    initialStatus={devis.status || 'brouillon'}
                    // Nouvelles props pour le Header intégré
                    reference={devis.reference}
                    dateEmission={devis.date_emission}
                    chantierName={devis.chantiers.name}
                    client={client}
                />
            </div>

        </div>
    )
}