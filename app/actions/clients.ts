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
