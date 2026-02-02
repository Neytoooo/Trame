import { createClient } from '@/utils/supabase/server'
import ArticleModal from '@/components/dashboard/ArticleModal'
import ArticleImportModal from '@/components/dashboard/ArticleImportModal'
import ImportHelpButton from '@/components/dashboard/ImportHelpButton'
import ArticleList from '@/components/articles/ArticleList'

export default async function ArticlesPage() {
    const supabase = await createClient()

    // Récupération des articles
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* En-tête avec bouton d'action */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bibliothèque de prix</h1>
                    <p className="text-gray-400">Gérez vos ouvrages, fournitures et main d'œuvre.</p>
                </div>
                <div className="flex gap-3">
                    <ImportHelpButton type="article" />
                    <ArticleImportModal />
                    <ArticleModal />
                </div>
            </div>

            <ArticleList initialArticles={articles || []} />
        </div>
    )
}