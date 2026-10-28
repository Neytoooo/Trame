import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Calendar, FileText, Camera } from 'lucide-react'
import Link from 'next/link'
import DevisEditor from '@/components/devis/DevisEditor'
import { getMobileDevisById } from '@/lib/mobileDevisStore'

export const dynamic = 'force-dynamic'

export default async function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Récupérer le Devis + Client + Chantier depuis Supabase
    let devisData: any = null
    let rawItems: any[] = []

    try {
        const { data: dbDevis } = await supabase
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

        if (dbDevis) {
            devisData = dbDevis

            // Récupérer les lignes depuis la base
            const { data: items } = await supabase
                .from('devis_items')
                .select('*')
                .eq('devis_id', id)
                .order('position', { ascending: true })

            if (items) rawItems = items
        }
    } catch (e) {
        // Fallback store mobile
    }

    // Fallback store mobile si non encore synchronisé ou créé en mode local
    if (!devisData) {
        const mob = getMobileDevisById(id)
        if (mob) {
            devisData = {
                id: mob.id,
                reference: mob.reference,
                name: mob.name,
                status: mob.status,
                total_ht: mob.total_ht,
                date_emission: mob.created_at,
                chantiers: {
                    id: mob.chantiers?.id || 'ch-mob',
                    name: mob.chantiers?.name || 'Chantier Mobile',
                    clients: mob.chantiers?.clients || { id: 'cl-mob', name: 'Client Mobile' }
                }
            }
            rawItems = (mob.items || []).map((it, idx) => {
                const isImg = (it as any).item_type === 'image' || Boolean((it as any).image_url) || Boolean((it as any).details?.is_image)
                return {
                    id: it.id || `item-${idx}`,
                    devis_id: mob.id,
                    description: it.description,
                    quantity: isImg ? 0 : it.quantity,
                    unit: isImg ? '' : it.unit,
                    unit_price: isImg ? 0 : it.unit_price,
                    cost_price: it.cost_price || 0,
                    tva: isImg ? 0 : (it.tva || 10),
                    position: idx,
                    item_type: isImg ? 'image' : (it.item_type || 'item'),
                    image_url: (it as any).image_url || (it as any).details?.image_url || '',
                    caption: (it as any).caption || (it as any).details?.caption || '',
                    details: (it as any).details || (isImg ? {
                        is_image: true,
                        image_url: (it as any).image_url || '',
                        caption: (it as any).caption || it.description || ''
                    } : {})
                }
            })
        }
    }

    if (!devisData) return notFound()

    // 2.5 Enrichissement avec les composants (Pour les Ouvrages)
    let enrichedItems = rawItems || []

    if (rawItems && rawItems.length > 0) {
        const parentIds = rawItems.map(i => i.article_id).filter(Boolean)

        if (parentIds.length > 0) {
            try {
                const { data: liaisons } = await supabase
                    .from('article_composants')
                    .select('parent_article_id, child_article_id, quantity')
                    .in('parent_article_id', parentIds)

                if (liaisons && liaisons.length > 0) {
                    const childIds = liaisons.map(l => l.child_article_id)
                    const { data: childArticles } = await supabase
                        .from('articles')
                        .select('id, name, unit')
                        .in('id', childIds)

                    enrichedItems = rawItems.map(item => {
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
            } catch {
                // Ignore
            }
        }
    }

    // 3. Récupérer TOUS les articles de la bibliothèque pour le sélecteur
    let allArticles: any[] = []
    try {
        const { data } = await supabase
            .from('articles')
            .select('id, name, category, price_ht, unit')
            .order('name')
        if (data) allArticles = data
    } catch {
        // Ignore
    }

    const client = devisData.chantiers?.clients

    // Déballage des métadonnées BTP
    const mappedItems = enrichedItems.map(item => {
        const d = (item.details && typeof item.details === 'object' && !Array.isArray(item.details)) ? item.details : {}
        const isImage = d.is_image === true || item.item_type === 'image'
        const isSubSection = d.is_sub_section === true || item.item_type === 'sub_section'
        const restoredType = isImage ? 'image' : (isSubSection ? 'sub_section' : item.item_type)
        return {
            ...item,
            item_type: restoredType,
            image_url: d.image_url || item.image_url || '',
            reference: d.reference || '',
            complement: d.complement || '',
            discount_pct: d.discount_pct || 0,
            cost_mat: d.cost_mat || 0,
            cost_mo: d.cost_mo || 0,
            cost_fg_pct: d.cost_fg_pct || 0,
            cost_total: d.cost_total || 0,
            margin: d.margin || 0,
            margin_pct: d.margin_pct || 0,
            dont_totalize: isImage ? true : Boolean(d.dont_totalize),
            copy_to_schedule: Boolean(d.copy_to_schedule),
            billed_pct: d.billed_pct || 100,
            commercial: d.commercial,
            technicien: d.technicien,
            details: Array.isArray(d.calcLines) ? d.calcLines : (Array.isArray(item.details) ? item.details : [])
        }
    })

    const chantierId = devisData.chantiers?.id || 'chantiers'

    return (
        <div className="h-full flex flex-col gap-2.5 overflow-hidden animate-in fade-in duration-300">
            {/* HEADER NAVIGATION */}
            <div className="flex items-center justify-between shrink-0">
                <Link
                    href={`/dashboard/chantiers/${chantierId}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2A] px-3.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                >
                    <ArrowLeft size={14} />
                    Retour au chantier
                </Link>

                <div className="flex items-center gap-2">
                    {devisData.reference && (
                        <Link
                            href={`/dashboard/depot?devis=${encodeURIComponent(devisData.reference)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/30 transition-all cursor-pointer shadow-xs"
                            title="Consulter les photos du Dépôt rattachées à ce devis"
                        >
                            <Camera size={13} />
                            <span>Photos du Dépôt ({devisData.reference})</span>
                        </Link>
                    )}

                    <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                        Mode Édition Pro BTP
                    </span>
                </div>
            </div>

            {/* L'ÉDITEUR INTERACTIF */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DevisEditor
                    initialItems={mappedItems}
                    devisId={devisData.id}
                    articles={allArticles}
                    initialName={devisData.name || ''}
                    initialStatus={devisData.status || 'brouillon'}
                    reference={devisData.reference}
                    dateEmission={devisData.date_emission}
                    chantierName={devisData.chantiers?.name || 'Chantier'}
                    client={client}
                />
            </div>
        </div>
    )
}
