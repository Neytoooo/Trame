import { createClient } from '@/utils/supabase/server'
import ArticleModal from '@/components/dashboard/ArticleModal'
import ArticleImportModal from '@/components/dashboard/ArticleImportModal'
import ImportHelpButton from '@/components/dashboard/ImportHelpButton'
import RestoreBtpCatalogButton from '@/components/articles/RestoreBtpCatalogButton'
import ArticleList from '@/components/articles/ArticleList'

import { BTP_PRESTATIONS_CATALOG } from '@/lib/btpCatalog'

export default async function ArticlesPage() {
    const supabase = await createClient()

    // Récupération des articles
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    const dbArticles = articles || []
    const existingNames = new Set(dbArticles.map(a => a.name?.trim().toLowerCase()))
    const existingRefs = new Set(dbArticles.map(a => a.reference?.trim().toLowerCase()).filter(Boolean))

    const missingCatalog = BTP_PRESTATIONS_CATALOG.filter(a => {
        const n1 = a.name.trim().toLowerCase()
        const n2 = `${a.name}\n${a.complement}`.trim().toLowerCase()
        const ref = (a.reference || '').trim().toLowerCase()
        return !existingNames.has(n1) && !existingNames.has(n2) && (!ref || !existingRefs.has(ref))
    }).map((a, idx) => ({
        id: `btp_demo_${idx}`,
        name: `${a.name}\n${a.complement}`,
        category: a.category,
        unit: a.unit,
        price_ht: a.price_ht,
        cost_ht: a.cost_ht,
        reference: a.reference,
        tva: a.tva,
        stock: 50,
        min_stock: 10,
        supplier: `${a.metier} - ${a.famille}`,
        is_catalog_template: true
    }))

    const initialData = [...dbArticles, ...missingCatalog]

    return (
        <div className="h-full flex flex-col overflow-hidden space-y-3 animate-in fade-in duration-300">
            {/* En-tête avec bouton d'action (Always Fixed) */}
            <div className="shrink-0 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bibliothèque de prix</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez vos ouvrages, fournitures et main d'œuvre.</p>
                </div>
                <div className="flex gap-3">
                    <RestoreBtpCatalogButton />
                    <ImportHelpButton type="article" />
                    <ArticleImportModal />
                    <ArticleModal />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <ArticleList initialArticles={initialData} />
            </div>
        </div>
    )
}