'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateRdvInput {
    chantier_id: string
    client_id: string
    title: string
    notes?: string
    date_start: string
    date_end: string
    user_id?: string
}

/**
 * Créer un nouveau rendez-vous BTP (visite technique, métré, diagnostic)
 */
export async function createRdv(input: CreateRdvInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('rendez_vous')
        .insert({
            chantier_id: input.chantier_id,
            client_id: input.client_id,
            title: input.title,
            notes: input.notes,
            date_start: input.date_start,
            date_end: input.date_end,
            user_id: input.user_id || user?.id,
            status: 'planifie',
            relance_active: true
        })
        .select()
        .single()

    if (error) {
        console.error("Erreur création RDV:", error)
        return { error: error.message }
    }

    revalidatePath(`/dashboard/chantiers/${input.chantier_id}`)
    revalidatePath('/dashboard/planning')
    return { success: true, rdv: data }
}

/**
 * Valider le rendez-vous (Statut -> 'Effectué')
 * Déclenche le compte à rebours pour la rédaction du devis
 */
export async function markRdvAsEffectue(rdvId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('rendez_vous')
        .update({
            status: 'effectue',
            relance_active: true // Active la surveillance préventive de devis
        })
        .eq('id', rdvId)
        .select()
        .single()

    if (error) {
        console.error("Erreur validation RDV:", error)
        return { error: error.message }
    }

    if (data?.chantier_id) {
        revalidatePath(`/dashboard/chantiers/${data.chantier_id}`)
    }
    revalidatePath('/dashboard/planning')
    return { success: true, rdv: data }
}

/**
 * Lier manuellement ou automatiquement un devis à un RDV
 * Éteint immédiatement la relance préventive
 */
export async function linkDevisToRdv(rdvId: string, devisId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('rendez_vous')
        .update({
            devis_id: devisId,
            relance_active: false
        })
        .eq('id', rdvId)
        .select()
        .single()

    if (error) {
        console.error("Erreur liaison Devis-RDV:", error)
        return { error: error.message }
    }

    // Archiver la notification correspondante
    await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('type', 'relance_devis_post_rdv')
        .contains('data', { rdv_id: rdvId })

    return { success: true, rdv: data }
}

/**
 * Récupérer les RDV d'un chantier
 */
export async function fetchRdvsByChantier(chantierId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('rendez_vous')
        .select(`
            *,
            devis ( id, reference, status, total_ht ),
            clients ( id, name )
        `)
        .eq('chantier_id', chantierId)
        .order('date_start', { ascending: false })

    if (error) {
        console.error("Erreur récupération RDV chantier:", error)
        return []
    }

    return data || []
}
