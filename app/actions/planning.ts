'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentCompanyId } from '@/lib/company'
import { getStoredUsers } from '@/lib/authorizedUsersStore'
import {
    getStoredInterventions,
    addStoredIntervention,
    updateStoredInterventionStatus,
    deleteStoredIntervention,
    StoredIntervention
} from '@/lib/planningStore'

export interface PlanningChantierOption {
    id: string
    name: string
    address: string
    clientName: string
    clientId?: string
}

export interface PlanningTeamMemberOption {
    id: string
    name: string
    role: string
    email: string
}

/**
 * Récupère toutes les données nécessaires au planning :
 * - Interventions synchronisées (Supabase / Store persistant)
 * - Liste des chantiers réels de l'entreprise
 * - Liste des techniciens / collaborateurs réels de l'entreprise
 */
export async function getPlanningDataAction(): Promise<{
    success: boolean
    interventions: StoredIntervention[]
    chantiers: PlanningChantierOption[]
    teamMembers: PlanningTeamMemberOption[]
    error?: string
}> {
    const supabase = await createClient()
    const companyId = await getCurrentCompanyId(supabase)

    // 1. Récupérer les chantiers réels
    let chantiers: PlanningChantierOption[] = []
    try {
        let chantiersQuery = supabase
            .from('chantiers')
            .select('id, name, address_line1, city, client_id, clients(id, name)')
            .order('name', { ascending: true })

        if (companyId) {
            chantiersQuery = chantiersQuery.eq('company_id', companyId)
        }

        const { data: dbChantiers, error: chantiersError } = await chantiersQuery

        if (!chantiersError && dbChantiers && dbChantiers.length > 0) {
            chantiers = dbChantiers.map((c: any) => ({
                id: c.id,
                name: c.name || 'Chantier sans nom',
                address: [c.address_line1, c.city].filter(Boolean).join(', ') || 'Adresse non renseignée',
                clientName: c.clients?.name || 'Client',
                clientId: c.client_id || c.clients?.id
            }))
        }
    } catch (e) {
        console.warn('Erreur récupération chantiers pour planning:', e)
    }

    // Si aucun chantier en base, proposer des chantiers types
    if (chantiers.length === 0) {
        chantiers = [
            { id: 'ch-jasmin', name: 'RESIDENCE LES JASMINS', address: '32 Rue Paul Cézanne, 78300 Poissy', clientName: 'Syndic LAMY Poissy' },
            { id: 'ch-paris', name: '76 AVENUE DE PARIS', address: '76 Avenue de Paris, 94160 Saint-Mandé', clientName: 'Cabinet BARBEY Immobilier' },
            { id: 'ch-plein-air', name: 'RESIDENCE PLEIN AIR', address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine', clientName: 'FONCIA Rives de Seine' }
        ]
    }

    // 2. Récupérer les collaborateurs réels
    let teamMembers: PlanningTeamMemberOption[] = []
    try {
        let usersQuery = supabase
            .from('authorized_users')
            .select('id, first_name, last_name, role, email')
            .neq('status', 'suspendu')

        if (companyId) {
            usersQuery = usersQuery.eq('company_id', companyId)
        }

        const { data: dbUsers, error: usersError } = await usersQuery

        if (!usersError && dbUsers && dbUsers.length > 0) {
            teamMembers = dbUsers.map((u: any) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
                return {
                    id: u.id,
                    name,
                    role: u.role || 'technicien',
                    email: u.email
                }
            })
        }
    } catch (e) {
        console.warn('Erreur récupération techniciens pour planning:', e)
    }

    // Fallback store local si base non initialisée
    if (teamMembers.length === 0) {
        const storedUsers = getStoredUsers()
        teamMembers = storedUsers.filter(u => u.status !== 'suspendu').map(u => ({
            id: u.id,
            name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
            role: u.role,
            email: u.email
        }))
    }

    // 3. Récupérer les interventions (rendez-vous Supabase + fallback store)
    let interventions: StoredIntervention[] = []
    try {
        let rdvQuery = supabase
            .from('rendez_vous')
            .select(`
                id,
                title,
                notes,
                date_start,
                date_end,
                status,
                chantier_id,
                client_id,
                user_id,
                chantiers(name, address_line1, city),
                clients(name)
            `)
            .order('date_start', { ascending: true })

        if (companyId) {
            rdvQuery = rdvQuery.eq('company_id', companyId)
        }

        const { data: dbRdvs, error: rdvError } = await rdvQuery

        if (!rdvError && dbRdvs && dbRdvs.length > 0) {
            interventions = dbRdvs.map((r: any) => {
                const dStart = new Date(r.date_start)
                const dEnd = new Date(r.date_end)

                const dateStr = dStart.toISOString().split('T')[0]
                const startTime = dStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
                const endTime = dEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })

                // Résoudre le nom du technicien
                const matchedUser = teamMembers.find(t => t.id === r.user_id)
                const techName = matchedUser?.name || 'Technicien assigné'

                const ch = r.chantiers
                const chName = ch?.name || 'Chantier'
                const chAddress = [ch?.address_line1, ch?.city].filter(Boolean).join(', ') || 'Adresse chantier'
                const clName = r.clients?.name || 'Client'

                const mappedStatus: 'planifie' | 'en_cours' | 'termine' =
                    r.status === 'effectue' ? 'termine' : (r.status === 'en_cours' ? 'en_cours' : 'planifie')

                return {
                    id: r.id,
                    title: r.title,
                    chantierName: chName,
                    clientName: clName,
                    address: chAddress,
                    technicien: techName,
                    zone: 'Île-de-France',
                    date: dateStr,
                    startTime,
                    endTime,
                    color: 'indigo',
                    status: mappedStatus,
                    notes: r.notes || '',
                    chantier_id: r.chantier_id,
                    client_id: r.client_id,
                    user_id: r.user_id
                }
            })
        }
    } catch (e) {
        console.warn('Erreur lecture rendez_vous Supabase:', e)
    }

    // Si aucune intervention en base Supabase, utiliser le store persistant calé sur la date du jour
    if (interventions.length === 0) {
        interventions = getStoredInterventions()
    }

    return {
        success: true,
        interventions,
        chantiers,
        teamMembers
    }
}

/**
 * Crée une nouvelle intervention planifiée
 */
export async function createPlanningInterventionAction(payload: {
    title: string
    chantierName: string
    clientName?: string
    address?: string
    technicien: string
    zone?: string
    date: string // "YYYY-MM-DD"
    startTime: string // "HH:MM"
    endTime: string // "HH:MM"
    color?: 'rose' | 'blue' | 'purple' | 'emerald' | 'amber'
    notes?: string
    chantier_id?: string | null
    client_id?: string | null
    user_id?: string | null
}): Promise<{ success: boolean; intervention?: StoredIntervention; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const companyId = await getCurrentCompanyId(supabase)

    // 1. Sauvegarde immédiate dans le store persistant local
    const saved = addStoredIntervention({
        title: payload.title,
        chantierName: payload.chantierName,
        clientName: payload.clientName || 'Client',
        address: payload.address || 'Adresse chantier',
        technicien: payload.technicien,
        zone: payload.zone || 'Île-de-France',
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        color: payload.color || 'blue',
        status: 'planifie',
        notes: payload.notes || '',
        chantier_id: payload.chantier_id || null,
        client_id: payload.client_id || null,
        user_id: payload.user_id || user?.id || null,
        company_id: companyId || null
    })

    // 2. Tenter l'insertion dans Supabase rendez_vous
    try {
        const startISO = `${payload.date}T${payload.startTime}:00.000Z`
        const endISO = `${payload.date}T${payload.endTime}:00.000Z`

        const rdvPayload: any = {
            title: payload.title,
            notes: payload.notes || null,
            date_start: startISO,
            date_end: endISO,
            chantier_id: payload.chantier_id || null,
            client_id: payload.client_id || null,
            user_id: payload.user_id || user?.id || null,
            status: 'planifie',
            relance_active: true
        }

        if (companyId) {
            rdvPayload.company_id = companyId
        }

        let { error } = await supabase.from('rendez_vous').insert(rdvPayload)

        if (error && (error.code === 'PGRST204' || error.message?.includes('company_id'))) {
            delete rdvPayload.company_id
            await supabase.from('rendez_vous').insert(rdvPayload)
        }
    } catch (e) {
        console.warn('Sync rendez_vous Supabase ignorée:', e)
    }

    revalidatePath('/dashboard/planning')
    return { success: true, intervention: saved }
}

/**
 * Met à jour le statut d'une intervention ('planifie' | 'en_cours' | 'termine')
 */
export async function updatePlanningInterventionStatusAction(
    id: string,
    status: 'planifie' | 'en_cours' | 'termine'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 1. Mettre à jour dans le store persistant
    updateStoredInterventionStatus(id, status)

    // 2. Mettre à jour dans Supabase si c'est un UUID
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        if (isUUID) {
            const dbStatus = status === 'termine' ? 'effectue' : (status === 'en_cours' ? 'en_cours' : 'planifie')
            await supabase
                .from('rendez_vous')
                .update({ status: dbStatus })
                .eq('id', id)
        }
    } catch (e) {
        console.warn('Sync statut Supabase ignorée:', e)
    }

    revalidatePath('/dashboard/planning')
    return { success: true }
}

/**
 * Supprime une intervention du planning
 */
export async function deletePlanningInterventionAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 1. Supprimer du store persistant
    deleteStoredIntervention(id)

    // 2. Supprimer de Supabase si UUID
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        if (isUUID) {
            await supabase.from('rendez_vous').delete().eq('id', id)
        }
    } catch (e) {
        console.warn('Sync suppression Supabase ignorée:', e)
    }

    revalidatePath('/dashboard/planning')
    return { success: true }
}
