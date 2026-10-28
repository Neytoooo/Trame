export interface ExtractedDevisItem {
  id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  cost_price?: number
  tva: number
}

export interface ExtractedDevisData {
  client_name: string
  client_phone?: string | null
  client_address?: string | null
  project_name: string
  notes?: string | null
  items: ExtractedDevisItem[]
}

export interface CreatedDevisSummary {
  id: string
  reference: string
  projectName: string
  clientName: string
  totalHT: number
  itemsCount: number
  webEditUrl: string
  created_at?: string
  status?: string
}
