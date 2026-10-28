import { createClient } from '@/utils/supabase/server'
import type { Company } from '@/types/company'

export const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Récupère l'ID de l'entreprise (tenant) de l'utilisateur actuellement connecté
 */
export async function getCurrentCompanyId(supabaseClient?: any): Promise<string> {
    try {
        const supabase = supabaseClient || await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !user.email) return DEFAULT_COMPANY_ID

        // 1. Chercher dans authorized_users par email
        try {
            const { data: authRecord } = await supabase
                .from('authorized_users')
                .select('company_id')
                .ilike('email', user.email)
                .maybeSingle()

            if (authRecord?.company_id) {
                return authRecord.company_id
            }
        } catch {
            // Ignorer si colonne absente
        }

        // 2. Chercher si propriétaire d'une entreprise dans companies
        try {
            const { data: ownedCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle()

            if (ownedCompany?.id) {
                return ownedCompany.id
            }
        } catch {
            // Ignorer si table absente
        }

        // 3. Chercher dans company_settings
        try {
            const { data: settings } = await supabase
                .from('company_settings')
                .select('company_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (settings?.company_id) {
                return settings.company_id
            }
        } catch {
            // Ignorer
        }

        // 4. Première entreprise existante
        try {
            const { data: firstCompany } = await supabase
                .from('companies')
                .select('id')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle()

            if (firstCompany?.id) {
                return firstCompany.id
            }
        } catch {
            // Ignorer
        }
    } catch {
        // Fallback store
    }

    return DEFAULT_COMPANY_ID
}

/**
 * Récupère le profil complet de l'entreprise de l'utilisateur connecté
 */
export async function getCurrentCompany(supabaseClient?: any): Promise<Company | null> {
    try {
        const supabase = supabaseClient || await createClient()
        const companyId = await getCurrentCompanyId(supabase)

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .maybeSingle()

        if (!error && data) {
            return data as Company
        }
    } catch {
        // Ignorer
    }

    return null
}
