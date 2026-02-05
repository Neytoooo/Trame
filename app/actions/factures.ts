'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmptyFacture(chantierId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    // 1. Créer la facture brouillon
    const { data, error } = await supabase
        .from('factures')
        .insert({
            chantier_id: chantierId,
            status: 'en_attente',
            reference: `F-${Date.now().toString().slice(-6)}`, // Simple auto-ref logic for now
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error(error)
        return { error: "Impossible de créer la facture" }
    }

    revalidatePath(`/dashboard/chantiers/${chantierId}`)
    redirect(`/dashboard/factures/${data.id}/edit`)
}

export async function saveFacture(factureId: string, items: any[], factureData?: { status?: string, date_echeance?: string }) {
    const supabase = await createClient()

    // 0. Update facture metadata if provided
    if (factureData) {
        const { error: factureError } = await supabase
            .from('factures')
            .update(factureData)
            .eq('id', factureId)

        if (factureError) {
            console.error("Erreur update facture:", factureError)
            return { error: "Erreur lors de la mise à jour des infos de la facture" }
        }

        // AUTOMATION: TRIGGER GLOBAL INTEGRITY CHECK
        // Whenever a Facture is updated (status or items), we re-evaluate the whole graph.
        const { data: facture } = await supabase.from('factures').select('chantier_id').eq('id', factureId).single()
        if (facture) {
            console.log(`🚀 [WORKFLOW ENGINE] Facture updated. Running integrity check...`)
            const { checkWorkflowIntegrity } = await import('./workflowEngine')
            await checkWorkflowIntegrity(facture.chantier_id)
        }
    }

    // Séparer les nouveaux items des items existants
    const newItems = items.filter(item => item.id.startsWith('new_'))
    const existingItems = items.filter(item => !item.id.startsWith('new_'))

    const promises = []

    // 1. Insertion des nouveaux items
    if (newItems.length > 0) {
        const itemsToInsert = newItems.map(item => ({
            facture_id: factureId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tva: item.tva,
            article_id: item.article_id || null
        }))
        // @ts-ignore
        promises.push(supabase.from('factures_items').insert(itemsToInsert))
    }

    // 2. Mise à jour des items existants
    if (existingItems.length > 0) {
        const itemsToUpdate = existingItems.map(item => ({
            id: item.id,
            facture_id: factureId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tva: item.tva,
            article_id: item.article_id || null
        }))
        promises.push(supabase.from('factures_items').upsert(itemsToUpdate, { onConflict: 'id' }))
    }

    const results = await Promise.all(promises)

    const errors = results.filter(r => r.error).map(r => r.error)
    if (errors.length > 0) {
        console.error("Erreur sauvegarde facture:", errors)
        return { error: "Erreur lors de la sauvegarde" }
    }

    // 3. Recalculer les totaux
    const { data: allItems } = await supabase
        .from('factures_items')
        .select('*')
        .eq('facture_id', factureId)

    if (allItems) {
        // Logique standard ou Situation (avec progress_percentage)
        const totalHT = allItems.reduce((acc, item) => {
            const progress = item.progress_percentage !== undefined ? item.progress_percentage : 100
            const amount = item.quantity * item.unit_price * (progress / 100)
            return acc + amount
        }, 0)

        const totalTTC = allItems.reduce((acc, item) => {
            const progress = item.progress_percentage !== undefined ? item.progress_percentage : 100
            const amount = item.quantity * item.unit_price * (progress / 100)
            return acc + (amount * (1 + (item.tva || 0) / 100))
        }, 0)

        await supabase.from('factures').update({
            total_ht: totalHT,
            total_ttc: totalTTC
        }).eq('id', factureId)
    }

    revalidatePath(`/dashboard/factures/${factureId}/edit`)
    return { success: true }
}

export async function deleteFactureItem(itemId: string) {
    const supabase = await createClient()
    await supabase.from('factures_items').delete().eq('id', itemId)
    return { success: true }
}

export async function convertDevisToFacture(devisId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    // 1. Récupérer le devis et ses lignes
    const { data: devis, error: devisError } = await supabase
        .from('devis')
        .select('*, devis_items(*)')
        .eq('id', devisId)
        .single()

    if (devisError || !devis) return { error: "Devis introuvable" }

    // 2. Créer la facture (ou récupérer l'existante)
    const newRef = devis.reference ? `F-${devis.reference}` : `F-${Date.now().toString().slice(-6)}`

    // Vérifier si une facture existe déjà pour cette référence (pour éviter les doublons)
    if (devis.reference) {
        const { data: existingFacture } = await supabase
            .from('factures')
            .select('id')
            .eq('reference', newRef)
            .single()

        if (existingFacture) {
            // Si elle existe, on redirige vers elle sans en créer une nouvelle
            // On peut éventuellement mettre à jour le statut, mais le user a dit "pas créer plusieurs sauf si info diff"
            // Ici on assume qu'on retourne l'existante.
            return { success: true, factureId: existingFacture.id }
        }
    }

    const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
            chantier_id: devis.chantier_id,
            status: 'en_attente',
            reference: newRef,
            created_by: user.id,
            // On pourrait copier les dates idoine si besoin
        })
        .select()
        .single()

    if (factureError) {
        console.error(factureError)
        return { error: "Erreur création facture" }
    }

    // 3. Copier les lignes et calculer les totaux
    let totalHT = 0
    let totalTTC = 0

    if (devis.devis_items && devis.devis_items.length > 0) {
        const itemsToInsert = devis.devis_items.map((item: any) => {
            totalHT += (item.quantity * item.unit_price)
            totalTTC += (item.quantity * item.unit_price * (1 + (item.tva || 20) / 100))

            return {
                facture_id: facture.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                tva: item.tva,
                article_id: item.article_id
            }
        })

        const { error: itemsError } = await supabase.from('factures_items').insert(itemsToInsert)
        if (itemsError) console.error("Erreur copie items", itemsError)

        // Mise à jour des totaux de la facture
        await supabase.from('factures').update({
            total_ht: totalHT,
            total_ttc: totalTTC
        }).eq('id', facture.id)
    }

    // 4. Mettre à jour le statut du devis
    await supabase.from('devis').update({ status: 'en_attente_approbation' }).eq('id', devisId)

    revalidatePath(`/dashboard/devis`)
    revalidatePath(`/dashboard/factures`)

    // On retourne l'ID pour rediriger
    return { success: true, factureId: facture.id }
}

export async function createAcompte(devisId: string, percentage: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    // 1. Get Devis
    const { data: devis } = await supabase.from('devis').select('*').eq('id', devisId).single()
    if (!devis) return { error: "Devis introuvable" }

    // 2. Create Facture Acompte
    const ref = `AC-${Date.now().toString().slice(-6)}` // Simple ref gen
    const { data: facture, error } = await supabase.from('factures').insert({
        chantier_id: devis.chantier_id,
        devis_id: devisId,
        status: 'en_attente',
        type: 'acompte',
        reference: ref,
        created_by: user.id
    }).select().single()

    if (error) return { error: "Erreur création acompte" }

    // 3. Create Item
    const amount = (devis.total_ttc || 0) * (percentage / 100)
    // Note: Acomptes are often treated as "Non soumis à TVA" on the deposit itself until actual invoice, 
    // BUT typically we show the amount TTC. 
    // To keep simple: 1 item, Qty 1, Price = Amount TTC, TVA = 0 (or simply handle as HT for logic).
    // Better usually: HT amount line with correct Taxes.
    // Let's go simple: 1 line "Acompte X%", Qty 1, Price = Total HT * %, TVA = Same avg or just 20%.

    // Let's use logic: Total HT * %
    const amountHT = (devis.total_ht || 0) * (percentage / 100)

    await supabase.from('factures_items').insert({
        facture_id: facture.id,
        description: `Acompte de ${percentage}% sur le devis ${devis.reference || ''}`,
        quantity: 1,
        unit: 'forfait',
        unit_price: amountHT,
        tva: 20, // Default 20 for now, or fetch from devis items avg?
        progress_percentage: 100 // Fully billed line
    })

    // Update totals
    await supabase.from('factures').update({
        total_ht: amountHT,
        total_ttc: (devis.total_ttc || 0) * (percentage / 100)
    }).eq('id', facture.id)

    revalidatePath('/dashboard/factures')
    return { success: true, factureId: facture.id }
}

export async function createSituation(devisId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    // 1. Get Devis & Items
    const { data: devis } = await supabase.from('devis').select('*, devis_items(*)').eq('id', devisId).single()
    if (!devis) return { error: "Devis introuvable" }

    // 2. Check previous situations to increment index
    const { count } = await supabase.from('factures')
        .select('*', { count: 'exact', head: true })
        .eq('devis_id', devisId)
        .eq('type', 'situation')

    const nextIndex = (count || 0) + 1
    const ref = `S${nextIndex}-${devis.reference || 'DEVIS'}`

    // 3. Create Facture Situation
    const { data: facture, error } = await supabase.from('factures').insert({
        chantier_id: devis.chantier_id,
        devis_id: devisId,
        status: 'en_attente',
        type: 'situation',
        situation_index: nextIndex,
        reference: ref,
        created_by: user.id
    }).select().single()

    if (error) return { error: "Erreur création situation" }

    // 4. Copy Items with 0% progress initially (or 100% if user prefers pre-fill, let's do 0 for "what have we done this month?")
    // Actually, usually situations are cumulative. "Total realized: 50%".
    // For V1 user asked: "Facturer l'avancement ligne par ligne".
    // Let's init at 0% progress for this invoice.
    if (devis.devis_items) {
        const itemsToInsert = devis.devis_items.map((item: any) => ({
            facture_id: facture.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tva: item.tva,
            article_id: item.article_id,
            progress_percentage: 0 // Init at 0
        }))
        await supabase.from('factures_items').insert(itemsToInsert)
    }

    // Update totals (starts at 0)
    await supabase.from('factures').update({ total_ht: 0, total_ttc: 0 }).eq('id', facture.id)

    revalidatePath('/dashboard/factures')
    return { success: true, factureId: facture.id }
}

export async function deleteFacture(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('factures')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Erreur lors de la suppression (soft) de la facture:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/factures')
    return { success: true }
}

export async function restoreFacture(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('factures')
        .update({ deleted_at: null })
        .eq('id', id)

    if (error) {
        console.error('Erreur lors de la restauration de la facture:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/factures')
    return { success: true }
}

export async function deleteFacturePermanently(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erreur lors de la suppression définitive de la facture:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/factures')
    return { success: true }
}
