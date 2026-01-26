import { createClient } from '@/utils/supabase/server'
import { Search, Filter, Package, Hammer, Truck } from 'lucide-react'
import ArticleModal from '@/components/dashboard/ArticleModal'

export default async function ArticlesPage() {
    const supabase = await createClient()

    // Récupération des articles (vide pour l'instant)
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
                <ArticleModal />
            </div>

            {/* Barre de recherche et filtres (Style Glass) */}
            <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (ex: Placo, Peinture, Heure...)"
                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10">
                    <Filter size={18} />
                    Filtres
                </button>
            </div>

            {/* Liste des articles (Tableau moderne) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase text-gray-300">
                        <tr>
                            <th className="px-6 py-4 font-medium">Désignation</th>
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Unité</th>
                            <th className="px-6 py-4 font-medium text-right">Prix Vente HT</th>
                            <th className="px-6 py-4 font-medium text-right">Déboursé</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {articles && articles.length > 0 ? (
                            articles.map((article) => (
                                <tr key={article.id} className="transition-colors hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-white">{article.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium 
                      ${article.category === 'main_doeuvre' ? 'bg-purple-500/10 text-purple-400' :
                                                article.category === 'fourniture' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                            {article.category === 'main_doeuvre' && <Hammer size={12} />}
                                            {article.category === 'fourniture' && <Package size={12} />}
                                            {article.category === 'engin' && <Truck size={12} />}
                                            {article.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{article.unit}</td>
                                    <td className="px-6 py-4 text-right font-medium text-emerald-400">{article.price_ht} €</td>
                                    <td className="px-6 py-4 text-right text-gray-500">{article.cost_ht} €</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <p className="text-gray-500">Votre bibliothèque est vide.</p>
                                    <p className="text-xs text-gray-600">Commencez par ajouter de la main d'œuvre ou des matériaux.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}