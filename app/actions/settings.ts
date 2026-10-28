'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentCompanyId } from '@/lib/company'

export async function getCompanySettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const companyId = await getCurrentCompanyId(supabase)

    // Tenter de récupérer les paramètres de l'entreprise si company_id est disponible
    if (companyId) {
        try {
            const { data: byCompany } = await supabase
                .from('company_settings')
                .select('*')
                .eq('company_id', companyId)
                .maybeSingle()
            if (byCompany) return byCompany
        } catch {
            // Ignorer si la colonne company_id n'existe pas encore
        }
    }

    const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    return data
}

export async function saveCompanySettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non connecté" }

    // Logo Upload Logic
    const logoFile = formData.get('logo') as File
    let logoUrl = null
    const removeLogo = formData.get('remove_logo') === 'true'

    if (logoFile && logoFile.size > 0 && logoFile.name !== 'undefined') {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('company-assets')
            .upload(fileName, logoFile, {
                upsert: true
            })

        if (uploadError) {
            console.error('Erreur upload logo:', uploadError)
        } else {
            const { data: { publicUrl } } = supabase
                .storage
                .from('company-assets')
                .getPublicUrl(fileName)
            logoUrl = publicUrl
        }
    }

    const companyId = await getCurrentCompanyId(supabase)

    const data: any = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        siret: formData.get('siret') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        footer_text: formData.get('footer_text') as string,
        user_id: user.id
    }

    if (companyId) {
        data.company_id = companyId
    }

    if (logoUrl) {
        data.logo_url = logoUrl
    } else if (removeLogo) {
        data.logo_url = null
    }

    // Upsert (Insert or Update) based on user_id
    let { error } = await supabase
        .from('company_settings')
        .upsert(data, { onConflict: 'user_id' })

    if (error && (error.code === 'PGRST204' || error.message?.includes('company_id'))) {
        const { company_id, ...fallbackData } = data
        const retry = await supabase
            .from('company_settings')
            .upsert(fallbackData, { onConflict: 'user_id' })
        error = retry.error
    }

    if (error) {
        console.error("Erreur save settings:", error)
        return { error: "Erreur lors de la sauvegarde" }
    }

    // Synchronisation avec la table companies (si existante)
    if (companyId) {
        try {
            await supabase
                .from('companies')
                .update({
                    name: data.name,
                    siret: data.siret,
                    address: data.address,
                    email: data.email,
                    phone: data.phone,
                    ...(logoUrl ? { logo_url: logoUrl } : (removeLogo ? { logo_url: null } : {}))
                })
                .eq('id', companyId)
        } catch {
            // Silencieux si la table companies n'existe pas encore
        }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
