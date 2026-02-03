'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createArticle(formData: FormData) {
    const supabase = await createClient()

    // 1. Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non autorisé" }

    // 2. Récupérer les données du formulaire
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const price_ht = parseFloat(formData.get('price_ht') as string)
    let cost_ht = parseFloat(formData.get('cost_ht') as string)
    const stock = parseInt(formData.get('stock') as string) || 0
    const min_stock = parseInt(formData.get('min_stock') as string) || 0
    const supplier = formData.get('supplier') as string || null

    const composantsStr = formData.get('composants') as string
    const composants = composantsStr ? JSON.parse(composantsStr) : []

    // 3. Si c'est un ouvrage (a des composants), on peut recalculer le coût de revient exact (Optionnel mais recommandé)
    if (composants.length > 0) {
        try {
            // On récupère les IDs des composants
            const componentIds = composants.map((c: any) => c.child_article_id)
            const { data: dbArticles } = await supabase.from('articles').select('id, cost_ht').in('id', componentIds)

            if (dbArticles) {
                // On recalcule la somme: (quantité * coût_enfant)
                cost_ht = composants.reduce((acc: number, item: any) => {
                    const article = dbArticles.find(a => a.id === item.child_article_id)
                    return acc + (item.quantity * (article?.cost_ht || 0))
                }, 0)
            }
        } catch (e) {
            console.error("Erreur calcul coût ouvrage", e)
        }
    }

    // 4. Insertion en base de l'article parent
    const { data: newArticle, error } = await supabase.from('articles').insert({
        name,
        category,
        unit,
        price_ht,
        cost_ht,
        stock,
        min_stock,
        supplier,
        created_by: user.id
    }).select().single()

    if (error) {
        console.error(error)
        return { error: "Erreur lors de la création" }
    }

    // 5. Si composants, insertion dans la table de liaison
    if (composants.length > 0 && newArticle) {
        const composantsToInsert = composants.map((c: any) => ({
            parent_article_id: newArticle.id,
            child_article_id: c.child_article_id,
            quantity: c.quantity
        }))

        const { error: compError } = await supabase.from('article_composants').insert(composantsToInsert)
        if (compError) console.error("Erreur insertion composants", compError)
    }

    // 6. Rafraîchir la page pour afficher le nouvel article
    revalidatePath('/dashboard/articles')
    return { success: true }
}

export async function searchArticles(query: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('articles')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)
    return data || []
}

export async function importArticlesAction(articles: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    // Préparer les données
    const preparedData = articles.map(a => ({
        created_by: user.id,
        name: a.name,
        category: a.category || 'fourniture',
        unit: a.unit || 'u',
        price_ht: a.price_ht || 0,
        cost_ht: a.cost_ht || 0
    }))

    // Insertion en masse
    const { error } = await supabase.from('articles').insert(preparedData)

    if (error) {
        console.error("Erreur import articles:", error)
        return { error: "Erreur lors de l'importation en base de données" }
    }

    revalidatePath('/dashboard/articles')
    return { success: true, count: preparedData.length }
}