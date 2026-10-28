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
  notes?: string
  device_info?: string
  created_at: string
}
