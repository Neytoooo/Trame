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

    // 3. Rediriger l'utilisateur vers l'éditeur de ce devis
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

export async function saveDevis(devisId: string, items: any[], devisData?: { name?: string, status?: string }) {
    const supabase = await createClient()

    // 0. Update devis metadata if provided
    if (devisData) {
        const { error: devisError } = await supabase
            .from('devis')
            .update(devisData)
            .eq('id', devisId)

        if (devisError) {
            console.error("Erreur update devis:", devisError)
            return { error: "Erreur lors de la mise à jour des infos du devis" }
        }

        // AUTOMATION: TRIGGER GLOBAL INTEGRITY CHECK
        // Whenever a Devis is updated (status or items), we re-evaluate the whole graph.
        const { data: devis } = await supabase.from('devis').select('chantier_id').eq('id', devisId).single()
        if (devis) {
            console.log(`🚀 [WORKFLOW ENGINE] Devis updated. Running integrity check...`)
            const { checkWorkflowIntegrity } = await import('./workflowEngine')
            await checkWorkflowIntegrity(devis.chantier_id)
        }
    }

    // Séparer les nouveaux items des items existants
    const newItems = items.filter((item: any) => item.id.toString().startsWith('new_'))
    const existingItems = items.filter((item: any) => !item.id.toString().startsWith('new_'))

    const promises = []

    // 1. Insertion des nouveaux items (sans ID, Postgres le génère)
    if (newItems.length > 0) {
        const itemsToInsert = newItems.map((item: any) => ({
            devis_id: devisId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tva: item.tva,
            article_id: item.article_id || null,
            details: item.details || [],
            item_type: item.item_type || 'item'
        }))
        // @ts-ignore
        promises.push(supabase.from('devis_items').insert(itemsToInsert))
    }

    // 2. Mise à jour des items existants (avec ID)
    if (existingItems.length > 0) {
        const itemsToUpdate = existingItems.map((item: any) => ({
            id: item.id,
            devis_id: devisId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tva: item.tva,
            article_id: item.article_id || null,
            details: item.details || [],
            item_type: item.item_type || 'item'
        }))
        promises.push(supabase.from('devis_items').upsert(itemsToUpdate, { onConflict: 'id' }))
    }

    const results = await Promise.all(promises)

    // Vérifier s'il y a des erreurs
    const errors = results.filter(r => r.error).map(r => r.error)
    if (errors.length > 0) {
        console.error("Erreur sauvegarde devis:", errors)
        return { error: "Erreur lors de la sauvegarde" }
    }

    // --- RECALCUL DES TOTAUX ---
    // On ré-assemble tous les items (nouveaux + anciens mis à jour) pour le calcul du total
    // Pour être sûr, on refetch tout
    const { data: allItems } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', devisId)

    let totalHT = 0
    let totalTTC = 0

    if (allItems) {
        allItems.forEach(item => {
            const qty = Number(item.quantity) || 0
            const price = Number(item.unit_price) || 0
            const tva = Number(item.tva) || 0

            const lineHT = qty * price
            const lineTTC = lineHT * (1 + tva / 100)

            totalHT += lineHT
            totalTTC += lineTTC
        })
    }

    // Mise à jour du devis avec les nouveaux totaux
    await supabase.from('devis').update({
        total_ht: Math.round(totalHT * 100) / 100,
        total_ttc: Math.round(totalTTC * 100) / 100
    }).eq('id', devisId)

    revalidatePath(`/dashboard/devis/${devisId}/edit`)

    // AUTOMATION: TRIGGER GLOBAL INTEGRITY CHECK
    // Ensure we trigger it after ANY save (items or metadata) so stock checks are refreshed.
    const { data: devis } = await supabase.from('devis').select('chantier_id').eq('id', devisId).single()
    if (devis && devis.chantier_id) {
        // Dynamic import to avoid circular dependency if any
        const { checkWorkflowIntegrity } = await import('./workflowEngine')
        // Run in background (fire & forget-ish, but await is safer for sequence)
        console.log(`🚀 [WORKFLOW TRIGGER] Devis Saved. Triggering integrity check for Chantier ${devis.chantier_id}`)
        await checkWorkflowIntegrity(devis.chantier_id)
    }

    return { success: true }
}

export async function deleteDevisItem(itemId: string) {
    const supabase = await createClient()
    await supabase.from('devis_items').delete().eq('id', itemId)
    return { success: true }
}

export async function deleteDevis(devisId: string) {
    const supabase = await createClient()

    // 1. Supprimer les lignes (si pas de cascade)
    await supabase.from('devis_items').delete().eq('devis_id', devisId)

    // 2. Supprimer le devis
    const { error } = await supabase.from('devis').delete().eq('id', devisId)

    if (error) {
        console.error("Erreur suppression devis:", error)
        return { error: "Impossible de supprimer le devis" }
    }

    revalidatePath('/dashboard/devis')
    return { success: true }
}