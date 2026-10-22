'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmptyDevis(chantierId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    // Vérifier si le profil existe car created_by référence public.profiles(id)
    let profileId: string | null = null
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

    if (profile) {
        profileId = profile.id
    } else {
        // Tenter d'insérer le profil s'il n'existe pas encore
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Utilisateur',
                last_name: user.user_metadata?.last_name || '',
                role: 'admin'
            })
        if (!profileError) {
            profileId = user.id
        } else {
            console.warn("Profil introuvable, insertion avec created_by NULL pour respecter la contrainte FK:", profileError)
            profileId = null // created_by est nullable dans public.devis
        }
    }

    const ref = `DEV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

    // 1. Créer le devis brouillon
    const { data, error } = await supabase
        .from('devis')
        .insert({
            chantier_id: chantierId,
            reference: ref,
            name: `Devis ${ref}`,
            status: 'brouillon',
            total_ht: 0,
            created_by: profileId,
            notes: 'Validité de l\'offre : 30 jours.\nAcompte de 30% à la commande.'
        })
        .select()
        .single()

    if (error) {
        console.error("Erreur création devis:", error)
        return { error: "Impossible de créer le devis : " + error.message }
    }

    // 2. Auto-résolution des relances : Lier les RDV effectués du chantier en attente de devis
    try {
        await supabase
            .from('rendez_vous')
            .update({
                devis_id: data.id,
                relance_active: false
            })
            .eq('chantier_id', chantierId)
            .eq('status', 'effectue')
            .is('devis_id', null)

        await supabase
            .from('notifications')
            .update({ status: 'archived' })
            .eq('type', 'relance_devis_post_rdv')
            .contains('data', { chantier_id: chantierId })
    } catch (relanceErr) {
        // Non-bloquant si la table rendez_vous n'est pas encore migrée
        console.warn("Liaison RDV-Devis différée:", relanceErr)
    }

    // 3. Rediriger l'utilisateur vers l'éditeur de ce devis
    revalidatePath(`/dashboard/chantiers/${chantierId}`)
    revalidatePath('/dashboard/devis')
    redirect(`/dashboard/devis/${data.id}/edit`)
}

export async function createQuickChantierAndDevis(chantierName: string, clientId?: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    // 1. Créer le chantier
    const payload: any = {
        name: chantierName.trim() || 'Nouveau Chantier',
        status: 'etude',
        created_by: user.id
    }
    if (clientId && clientId.length === 36) {
        payload.client_id = clientId
    }

    const { data: chantier, error: chErr } = await supabase
        .from('chantiers')
        .insert(payload)
        .select()
        .single()

    if (chErr || !chantier) {
        console.error("Erreur création chantier:", chErr)
        return { error: "Erreur création chantier : " + (chErr?.message || '') }
    }

    // 2. Créer le devis associé
    return await createEmptyDevis(chantier.id)
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

    // 2. On insère la ligne dans le devis
    const { error } = await supabase.from('devis_items').insert({
        devis_id: devisId,
        article_id: article.id, // On garde le lien pour les stats
        description: article.name || 'Article sans nom', // SNAPSHOT : On copie le nom
        unit: article.unit || 'u',        // SNAPSHOT : On copie l'unité
        unit_price: Number(article.price_ht) || 0, // SNAPSHOT : On copie le prix
        cost_price: Number(article.cost_ht) || 0,  // SNAPSHOT : On copie le coût
        tva: Number(article.tva) || 20, // Default TVA if not present
        quantity: 1, // Par défaut 1
        item_type: 'item'
    })

    if (error) {
        console.error("Erreur insertion devis_item:", error)
        return { error: "Erreur insertion ligne : " + error.message }
    }

    revalidatePath(`/dashboard/devis/${devisId}/edit`)
    return { success: true }
}

export async function saveDevis(devisId: string, items: any[], devisData?: { name?: string, status?: string }) {
    const supabase = await createClient()

    // 0. Update devis metadata if provided
    if (devisData) {
        const updatePayload: Record<string, any> = {}
        if (devisData.name !== undefined) updatePayload.name = devisData.name
        if (devisData.status !== undefined && devisData.status !== null) updatePayload.status = devisData.status

        if (Object.keys(updatePayload).length > 0) {
            const { error: devisError } = await supabase
                .from('devis')
                .update(updatePayload)
                .eq('id', devisId)

            if (devisError) {
                console.error("Erreur update devis:", devisError)
                return { error: "Erreur lors de la mise à jour des infos du devis : " + devisError.message }
            }

            // AUTOMATION: TRIGGER GLOBAL INTEGRITY CHECK
            const { data: devis } = await supabase.from('devis').select('chantier_id').eq('id', devisId).single()
            if (devis && devis.chantier_id) {
                const { checkWorkflowIntegrity } = await import('./workflowEngine')
                await checkWorkflowIntegrity(devis.chantier_id)
            }
        }
    }

    // Fonction d'assainissement conforme aux contraintes de public.devis_items
    const sanitizeItem = (item: any, globalIndex: number) => {
        // La contrainte CHECK autorise uniquement 'item' ou 'section'
        const isSubSection = item.item_type === 'sub_section' || item.details?.is_sub_section === true
        const isImage = item.item_type === 'image' || item.details?.is_image === true || Boolean(item.image_url)
        const dbItemType = (item.item_type === 'section' || isSubSection || isImage) ? 'section' : 'item'

        // article_id doit être un UUID valide ou null
        const isValidUuid = item.article_id && typeof item.article_id === 'string' && item.article_id.length === 36
        const articleId = isValidUuid ? item.article_id : null
        const imageUrl = item.image_url || item.details?.image_url || ''

        return {
            devis_id: devisId,
            description: item.description || (isImage ? 'Photo / Constat chantier' : (dbItemType === 'section' ? 'Section' : 'Ligne sans désignation')),
            quantity: isImage ? 0 : (Number(item.quantity) || 0),
            unit: isImage ? '' : (item.unit || 'u'),
            unit_price: isImage ? 0 : (Number(item.unit_price) || 0),
            cost_price: isImage ? 0 : (Number(item.cost_price || item.cost_mat || item.cost_total) || 0),
            tva: isImage ? 0 : (item.tva !== undefined ? Number(item.tva) : 20),
            position: globalIndex,
            article_id: articleId,
            details: {
                reference: item.reference || '',
                complement: item.complement || '',
                is_image: isImage,
                image_url: imageUrl,
                caption: item.caption || item.details?.caption || item.description || '',
                discount_pct: Number(item.discount_pct) || 0,
                cost_mat: Number(item.cost_mat) || 0,
                cost_mo: Number(item.cost_mo) || 0,
                cost_fg_pct: Number(item.cost_fg_pct) || 0,
                cost_total: Number(item.cost_total) || 0,
                margin: Number(item.margin) || 0,
                margin_pct: Number(item.margin_pct) || 0,
                dont_totalize: isImage ? true : Boolean(item.dont_totalize),
                copy_to_schedule: Boolean(item.copy_to_schedule),
                billed_pct: Number(item.billed_pct) || 0,
                commercial: item.commercial || '',
                technicien: item.technicien || '',
                is_sub_section: isSubSection,
                calcLines: Array.isArray(item.details) ? item.details : item.details?.calcLines || []
            },
            item_type: dbItemType
        }
    }

    // Associer à chaque item sa position globale dans la liste réordonnée par l'utilisateur
    const indexedItems = items.map((item: any, globalIndex: number) => ({
        ...item,
        _globalIndex: globalIndex
    }))

    // Séparer les nouveaux items des items existants
    const newItems = indexedItems.filter((item: any) => !item.id || item.id.toString().startsWith('new_'))
    const existingItems = indexedItems.filter((item: any) => item.id && !item.id.toString().startsWith('new_'))

    const errors: any[] = []

    // 1. Insertion des nouveaux items
    if (newItems.length > 0) {
        const itemsToInsert = newItems.map((item: any) => sanitizeItem(item, item._globalIndex))
        const { error: insertError } = await supabase.from('devis_items').insert(itemsToInsert)
        if (insertError) {
            console.error("Erreur insertion devis_items:", insertError)
            errors.push(insertError)
        }
    }

    // 2. Mise à jour des items existants
    if (existingItems.length > 0) {
        const itemsToUpdate = existingItems.map((item: any) => ({
            id: item.id,
            ...sanitizeItem(item, item._globalIndex)
        }))
        const { error: upsertError } = await supabase.from('devis_items').upsert(itemsToUpdate, { onConflict: 'id' })
        if (upsertError) {
            console.error("Erreur upsert devis_items:", upsertError)
            errors.push(upsertError)
        }
    }

    if (errors.length > 0) {
        return { error: "Erreur lors de la sauvegarde des lignes : " + errors[0].message }
    }

    // --- RECALCUL DES TOTAUX (UNIQUEMENT TOTAL_HT DANS DEVIS) ---
    const { data: allItems } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', devisId)

    let totalHT = 0
    if (allItems) {
        allItems.forEach(item => {
            if (item.item_type === 'section' || item.details?.is_sub_section) return
            if (item.details?.dont_totalize) return

            const qty = Number(item.quantity) || 0
            const price = Number(item.unit_price) || 0
            const discount = Number(item.details?.discount_pct) || 0

            const lineHT = qty * price * (1 - discount / 100)
            totalHT += lineHT
        })
    }

    // Mise à jour du devis avec le total_ht UNIQUEMENT (total_ttc n'existe pas dans la table devis)
    const { error: updateHtError } = await supabase.from('devis').update({
        total_ht: Math.round(totalHT * 100) / 100
    }).eq('id', devisId)

    if (updateHtError) {
        console.error("Erreur mise à jour total_ht devis:", updateHtError)
    }

    revalidatePath(`/dashboard/devis/${devisId}/edit`)
    revalidatePath('/dashboard/devis')

    // AUTOMATION: TRIGGER GLOBAL INTEGRITY CHECK
    // Ensure we trigger it after ANY save (items or metadata) so stock checks are refreshed.
    try {
        const { data: devis } = await supabase.from('devis').select('chantier_id').eq('id', devisId).single()
        if (devis && devis.chantier_id) {
            const { checkWorkflowIntegrity } = await import('./workflowEngine')
            await checkWorkflowIntegrity(devis.chantier_id)
        }
    } catch (engineErr) {
        console.warn("Workflow check non-bloquant:", engineErr)
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

    // 1. Délier les dépendances FK éventuelles (factures, rendez_vous)
    try {
        await supabase.from('factures').update({ devis_id: null }).eq('devis_id', devisId)
        await supabase.from('rendez_vous').update({ devis_id: null }).eq('devis_id', devisId)
    } catch (e) {
        // Table ou colonne facultative
    }

    // 2. Supprimer les lignes devis_items
    await supabase.from('devis_items').delete().eq('devis_id', devisId)

    // 3. Supprimer le devis
    const { error } = await supabase.from('devis').delete().eq('id', devisId)

    if (error) {
        console.error("Erreur suppression devis:", error)
        return { error: "Impossible de supprimer le devis : " + error.message }
    }

    revalidatePath('/dashboard/devis')
    return { success: true }
}

export async function fetchDevisAction(offset: number, search: string) {
    const supabase = await createClient()
    const limit = 10

    let query = supabase
        .from('devis')
        .select(`
            *,
            chantiers (
                id,
                name,
                clients ( id, name )
            )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Wait, searching in relations like chantiers.clients.name is not supported by default ilike on the main table without postgrest view.
    // We will search by reference and name on the devis table.
    if (search) {
        query = query.or(`reference.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching devis:', error)
        return []
    }

    return data || []
}