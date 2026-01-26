'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmptyDevis(chantierId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    // 1. Créer le devis brouillon
    const { data, error } = await supabase
        .from('devis')
        .insert({
            chantier_id: chantierId,
            status: 'brouillon',
            created_by: user.id,
            notes: 'Validité de l\'offre : 30 jours.\nAcompte de 30% à la commande.'
        })
        .select()
        .single()

    if (error) {
        console.error(error)
        return { error: "Impossible de créer le devis" }
    }

    // 2. Rediriger l'utilisateur vers l'éditeur de ce devis
    revalidatePath(`/dashboard/chantiers/${chantierId}`)
    redirect(`/dashboard/devis/${data.id}/edit`)
}

// Ajoute cette fonction à la fin du fichier
export async function addLineFromArticle(devisId: string, articleId: string) {
    const supabase = await createClient()

    // 1. On récupère les infos de l'article source (Le Snapshot)
    const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()

    if (!article) return { error: "Article introuvable" }

    // 2. On détermine la prochaine position (pour mettre la ligne à la fin)
    // (Optionnel pour l'instant, on met 0 par défaut)

    // 3. On insère la ligne dans le devis
    const { error } = await supabase.from('devis_items').insert({
        devis_id: devisId,
        article_id: article.id, // On garde le lien pour les stats
        description: article.name, // SNAPSHOT : On copie le nom
        unit: article.unit,        // SNAPSHOT : On copie l'unité
        unit_price: article.price_ht, // SNAPSHOT : On copie le prix
        cost_price: article.cost_ht,  // SNAPSHOT : On copie le coût
        tva: article.tva || 20, // Default TVA if not present
        quantity: 1 // Par défaut 1
    })

    if (error) {
        console.error(error)
        return { error: "Erreur insertion ligne" }
    }

    revalidatePath(`/dashboard/devis/${devisId}/edit`)
    return { success: true }
}

export async function saveDevis(devisId: string, items: any[]) {
    const supabase = await createClient()

    // 1. On prépare les données à sauvegarder
    // On nettoie les items pour ne garder que ce qui correspond à la table
    const itemsToSave = items.map(item => ({
        id: item.id.length < 10 ? undefined : item.id, // Si ID temporaire (ex: "new_123"), on l'enlève pour laisser Postgres générer l'UUID
        devis_id: devisId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tva: item.tva,
        article_id: item.article_id || null // On garde le lien si dispo
    }))

    // 2. Upsert (Insert ou Update)
    const { error } = await supabase
        .from('devis_items')
        .upsert(itemsToSave, { onConflict: 'id' })

    if (error) {
        console.error("Erreur sauvegarde devis:", error)
        return { error: "Erreur lors de la sauvegarde" }
    }

    revalidatePath(`/dashboard/devis/${devisId}/edit`)
    return { success: true }
}

export async function deleteDevisItem(itemId: string) {
    const supabase = await createClient()
    await supabase.from('devis_items').delete().eq('id', itemId)
    return { success: true }
}