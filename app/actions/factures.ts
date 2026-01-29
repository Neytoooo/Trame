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
        const totalHT = allItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
        const totalTTC = allItems.reduce((acc, item) => acc + (item.quantity * item.unit_price * (1 + (item.tva || 0) / 100)), 0)

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
