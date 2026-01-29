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

            {/* L'ÉDITEUR INTERACTIF */}
            <DevisEditor
                initialItems={enrichedItems}
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
    )
}