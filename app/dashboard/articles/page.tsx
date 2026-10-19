import { createClient } from '@/utils/supabase/server'
import ArticleModal from '@/components/dashboard/ArticleModal'
import ArticleImportModal from '@/components/dashboard/ArticleImportModal'
import ImportHelpButton from '@/components/dashboard/ImportHelpButton'
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

    const initialData = (articles && articles.length > 0)
        ? articles
        : BTP_PRESTATIONS_CATALOG.map((a, idx) => ({
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

    return (
        <div className="space-y-6">
            {/* En-tête avec bouton d'action */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bibliothèque de prix</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gérez vos ouvrages, fournitures et main d'œuvre.</p>
                </div>
                <div className="flex gap-3">
                    <ImportHelpButton type="article" />
                    <ArticleImportModal />
                    <ArticleModal />
                </div>
            </div>

            <ArticleList initialArticles={initialData} />
        </div>
    )
}