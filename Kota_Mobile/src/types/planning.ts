export type InterventionStatus = 'planifie' | 'en_cours' | 'termine'

export interface Intervention {
  id: string
  title: string
  chantierName: string
  clientName: string
  address: string
  technicien: string
  zone: string
  date: string // "YYYY-MM-DD"
  startTime: string // "08:30"
  endTime: string   // "11:00"
  color: 'rose' | 'blue' | 'purple' | 'emerald' | 'amber' | 'indigo'
  status: InterventionStatus
  notes?: string
  chantier_id?: string | null
  client_id?: string | null
}
