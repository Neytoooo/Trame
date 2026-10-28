export interface StoredIntervention {
    id: string
    title: string
    chantierName: string
    clientName: string
    address: string
    technicien: string
    zone: string
    date: string // Format "YYYY-MM-DD"
    startTime: string // "08:30"
    endTime: string   // "11:00"
    color: 'rose' | 'blue' | 'purple' | 'emerald' | 'amber' | 'indigo'
    status: 'planifie' | 'en_cours' | 'termine'
    notes?: string
    chantier_id?: string | null
    client_id?: string | null
    user_id?: string | null
    company_id?: string | null
    created_at?: string
    updated_at?: string
}

// Helper: Formatter une date en "YYYY-MM-DD" en heure locale
export function formatDateKey(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Helper: Obtenir le Lundi de la semaine pour une date donnée
export function getMondayOfWeek(d: Date): Date {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
}
