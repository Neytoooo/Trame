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
    const cost_ht = parseFloat(formData.get('cost_ht') as string)

    // 3. Insertion en base
    const { error } = await supabase.from('articles').insert({
        name,
        category,
        unit,
        price_ht,
        cost_ht,
        created_by: user.id
    })

    if (error) {
        console.error(error)
        return { error: "Erreur lors de la création" }
    }

    // 4. Rafraîchir la page pour afficher le nouvel article
    revalidatePath('/dashboard/articles')
    return { success: true }
}