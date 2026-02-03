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

    // 2. AUTOMATION : Check for "Quote" step in the graph and validate it
    const { data: nodes } = await supabase
        .from('chantier_nodes')
        .select('*')
        .eq('chantier_id', chantierId)
        .eq('action_type', 'quote') // Look for 'Create Quote' nodes
        .eq('status', 'pending')

    if (nodes && nodes.length > 0) {
        const targetNode = nodes[0] // Take the first pending quote node

        // Check if "Lancement" is done (Safety check, optional)
        const { data: playNode } = await supabase
            .from('chantier_nodes')
            .select('*')
            .eq('chantier_id', chantierId)
            .eq('action_type', 'play')
            .single()

        // Only validate if Lancement is done OR if there is no Lancement node (flexibility)
        if (!playNode || playNode.status === 'done') {
            console.log(`🤖 Auto-validating Quote Node ${targetNode.id}`)

            // Mark as done
            await supabase.from('chantier_nodes').update({ status: 'done' }).eq('id', targetNode.id)

            // Trigger successors
            // We import dynamically or top-level. Since this is a server action calling another server action...
            // It's better to verify import.
            try {
                const { triggerNodeAutomation } = await import('./triggerNodeAutomation')
                await triggerNodeAutomation(targetNode.id, chantierId)
            } catch (err) {
                console.error("Automation Trigger Error:", err)
            }
        }
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

        // AUTOMATION: If status changed (e.g. to 'en_attente' or 'validate'), trigger graph step
        if (devisData.status && devisData.status !== 'brouillon') {
            // Fetch chantier_id from devis
            const { data: devis } = await supabase.from('devis').select('chantier_id').eq('id', devisId).single()

            if (devis) {
                const chantierId = devis.chantier_id
                // Check for pending "Create Quote" node
                const { data: nodes } = await supabase
                    .from('chantier_nodes')
                    .select('*')
                    .eq('chantier_id', chantierId)
                    .eq('action_type', 'quote')
                    .eq('status', 'pending')
                    .limit(1)

                if (nodes && nodes.length > 0) {
                    const targetNode = nodes[0]

                    // Verify "Lancement"
                    const { data: playNode } = await supabase
                        .from('chantier_nodes')
                        .select('status')
                        .eq('chantier_id', chantierId)
                        .eq('action_type', 'play')
                        .single()

                    if (!playNode || playNode.status === 'done') {
                        console.log(`🤖 Auto-validating Quote Node ${targetNode.id} due to status '${devisData.status}'`)

                        // Mark Done
                        await supabase.from('chantier_nodes').update({ status: 'done' }).eq('id', targetNode.id)

                        // Trigger Successors
                        try {
                            const { triggerNodeAutomation } = await import('./triggerNodeAutomation')
                            // We don't await this to keep UI responsive? Or maybe we do to ensure log? 
                            // Let's await it but catch errors safely.
                            await triggerNodeAutomation(targetNode.id, chantierId)
                        } catch (e) {
                            console.error("Auto-Trigger Failed:", e)
                        }
                    }
                }
            }
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