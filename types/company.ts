export interface Company {
    id: string
    name: string
    siret?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    logo_url?: string | null
    owner_id?: string | null
    created_at: string
    updated_at: string
}

export interface TenantContext {
    companyId: string
    companyName: string
    isOwner: boolean
}
