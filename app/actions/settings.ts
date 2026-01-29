'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCompanySettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    return data
}

export async function saveCompanySettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    const data = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        siret: formData.get('siret') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        footer_text: formData.get('footer_text') as string,
        user_id: user.id
    }

    // Upsert (Insert or Update) based on user_id
    const { error } = await supabase
        .from('company_settings')
        .upsert(data, { onConflict: 'user_id' })

    if (error) {
        console.error("Erreur save settings:", error)
        return { error: "Erreur lors de la sauvegarde" }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
