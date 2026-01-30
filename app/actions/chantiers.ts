'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChantier(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    // On récupère les champs
    const name = formData.get('name') as string
    const client_id = formData.get('client_id') as string
    const status = formData.get('status') as string
    const address = formData.get('address') as string
    const date_debut = formData.get('date_debut') as string || null

    const { error } = await supabase.from('chantiers').insert({
        name,
        client_id,
        status,
        address_line1: address,
        date_debut,
        created_by: user.id
    })

    if (error) {
        console.error("Erreur insertion chantier:", error)
        return { error: "Impossible de créer le chantier" }
    }

    revalidatePath('/dashboard/chantiers')
    return { success: true }
}

export async function updateChantierStatus(id: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    const { error } = await supabase
        .from('chantiers')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error("Update status error:", error)
        return { error: "Erreur update status" }
    }

    revalidatePath(`/dashboard/chantiers`)
    revalidatePath(`/dashboard/chantiers/${id}`)
    return { success: true }
}