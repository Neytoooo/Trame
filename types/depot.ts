export type DepotPhotoCategory = 
    | 'constat' 
    | 'avant_travaux' 
    | 'en_cours' 
    | 'apres_travaux' 
    | 'releve_technique' 
    | 'autre'

export interface DepotPhoto {
    id: string
    title: string
    devis_id: string | null
    devis_reference: string | null
    chantier_id: string | null
    chantier_name: string
    client_name: string
    category: DepotPhotoCategory
    image_url: string
    thumbnail_url?: string
    notes?: string
    file_size?: number
    device_info?: string
    created_at: string
    updated_at: string
    created_by?: string | null
    company_id?: string
}

export interface DepotStats {
    totalPhotos: number
    linkedToDevisCount: number
    uniqueDevisCount: number
    lastUploadedAt: string | null
}
