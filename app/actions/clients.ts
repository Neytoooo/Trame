'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ClientData = {
    name: string
    type: 'particulier' | 'professionnel'
    email?: string
    billing_email?: string
    phone_mobile?: string
    phone_fixe?: string
    address_line1?: string
    address_line2?: string
    city?: string
    zip_code?: string
    siret?: string
    iban?: string
}

export async function createClientAction(data: ClientData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Vous devez être connecté pour créer un client.' }
    }

    const { error } = await supabase
        .from('clients')
        .insert({
            ...data,
            created_by: user.id
        })

    if (error) {
        console.error('Erreur création client:', error)
        return { error: 'Une erreur est survenue lors de la création du client.' }
    }

    revalidatePath('/dashboard/clients')
    return { success: true }
}

export async function updateClientAction(id: string, data: ClientData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non connecté' }

    const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Update client error:', error)
        return { error: 'Erreur lors de la modification.' }
    }

    revalidatePath('/dashboard/clients')
    // On revalide aussi factures/devis car les infos clients y sont affichées (select en relation)
    revalidatePath('/dashboard/factures')
    revalidatePath('/dashboard/devis')
    return { success: true }
}

export async function deleteClientAction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non connecté' }

    // La suppression déclenchera le trigger 'before_client_delete_archive_invoices' (soft delete factures)
    // et le ON DELETE CASCADE pour les chantiers/devis.
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete client error:', error)
        // Check constraint violations specially
        if (error.code === '23503') return { error: "Impossible de supprimer ce client car des données y sont encore liées (Factures/Devis)." }
        return { error: 'Erreur lors de la suppression du client.' }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard/factures')
    revalidatePath('/dashboard/devis')
    return { success: true }
}

export async function importClientsAction(clients: ClientData[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non connecté' }

    // Enrichir avec created_by
    const clientsToInsert = clients.map(c => ({
        ...c,
        created_by: user.id
    }))

    const { data, error } = await supabase
        .from('clients')
        .insert(clientsToInsert)
        .select()

    if (error) {
        console.error('Import clients error:', error)
        return { error: "Erreur lors de l'import des clients." }
    }

    revalidatePath('/dashboard/clients')
    return { success: true, count: data?.length || 0 }
}
