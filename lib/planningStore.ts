import fs from 'fs'
import path from 'path'
import {
    StoredIntervention,
    formatDateKey,
    getMondayOfWeek
} from '@/types/planning'

export type { StoredIntervention }
export { formatDateKey, getMondayOfWeek }

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'planning_interventions.json')

// Helper de conversion entre une ligne de base de données Supabase et StoredIntervention
export function mapDbRowToIntervention(row: any): StoredIntervention {
    return {
        id: String(row.id),
        title: row.title || 'Intervention',
        chantierName: row.chantier_name || row.chantierName || 'Chantier',
        clientName: row.client_name || row.clientName || 'Client',
        address: row.address || '',
        technicien: row.technicien || 'Technicien',
        zone: row.zone || 'Île-de-France',
        date: row.date,
        startTime: row.start_time || row.startTime || '08:00',
        endTime: row.end_time || row.endTime || '12:00',
        color: row.color || 'blue',
        status: row.status || 'planifie',
        notes: row.notes || '',
        chantier_id: row.chantier_id || null,
        client_id: row.client_id || null,
        user_id: row.user_id || null,
        company_id: row.company_id || '00000000-0000-0000-0000-000000000001',
        created_at: row.created_at,
        updated_at: row.updated_at
    }
}

// Générer les interventions de démonstration calées sur la semaine actuelle
function generateDefaultInterventions(refDate: Date = new Date()): StoredIntervention[] {
    const monday = getMondayOfWeek(refDate)

    const addDays = (base: Date, days: number) => {
        const d = new Date(base)
        d.setDate(d.getDate() + days)
        return formatDateKey(d)
    }

    const mondayStr = addDays(monday, 0)
    const tuesdayStr = addDays(monday, 1)
    const wednesdayStr = addDays(monday, 2)
    const thursdayStr = addDays(monday, 3)
    const fridayStr = addDays(monday, 4)
    const saturdayStr = addDays(monday, 5)

    return [
        // LUNDI
        {
            id: 'int-1',
            title: 'Métré & Sondage Acrotères',
            chantierName: 'RESIDENCE PLEIN AIR',
            clientName: 'FONCIA Rives de Seine',
            address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
            technicien: 'Mattis Khn (Admin)',
            zone: 'Paris Ouest (78)',
            date: mondayStr,
            startTime: '08:30',
            endTime: '11:00',
            color: 'rose',
            status: 'en_cours',
            notes: 'Vérification dimensionnelle des relevés de couvertines alu'
        },
        {
            id: 'int-2',
            title: 'Installation Base-Vie & Roulotte raccordée',
            chantierName: 'RESIDENCE LES JASMINS',
            clientName: 'Syndic LAMY Poissy',
            address: '32 Rue Paul Cézanne, 78300 Poissy',
            technicien: 'Thomas Laurent',
            zone: 'Paris Ouest (78)',
            date: mondayStr,
            startTime: '13:30',
            endTime: '17:00',
            color: 'rose',
            status: 'en_cours',
            notes: 'Raccordement électrique et eau avec le gardien'
        },

        // MARDI
        {
            id: 'int-3',
            title: 'Lavage Haute Pression Façade Bât. A & B',
            chantierName: 'RESIDENCE LES JASMINS',
            clientName: 'Syndic LAMY Poissy',
            address: '32 Rue Paul Cézanne, 78300 Poissy',
            technicien: 'Nicolas Dupuis (Chef de Chantier)',
            zone: 'Paris Ouest (78)',
            date: tuesdayStr,
            startTime: '08:30',
            endTime: '12:00',
            color: 'blue',
            status: 'planifie',
            notes: 'Lavage eau chaude 140 bars + pulvérisation fongicide rémanent'
        },
        {
            id: 'int-4',
            title: 'Relevé Voirie & Balisage Piétons',
            chantierName: '76 AVENUE DE PARIS',
            clientName: 'Cabinet BARBEY Immobilier',
            address: '76 Avenue de Paris, 94160 Saint-Mandé',
            technicien: 'Thomas Laurent',
            zone: 'Paris Est (94)',
            date: tuesdayStr,
            startTime: '14:00',
            endTime: '16:30',
            color: 'amber',
            status: 'planifie',
            notes: 'Pose barrières Heras et panneaux d\'information copropriété'
        },

        // MERCREDI
        {
            id: 'int-5',
            title: 'Pose Bavettes & Relevés Étanchéité Zinc',
            chantierName: 'RESIDENCE PLEIN AIR',
            clientName: 'FONCIA Rives de Seine',
            address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
            technicien: 'Thomas Laurent',
            zone: 'Paris Ouest (78)',
            date: wednesdayStr,
            startTime: '08:30',
            endTime: '12:00',
            color: 'purple',
            status: 'planifie',
            notes: 'Fixation pattes inox et joints néoprène d\'étanchéité'
        },
        {
            id: 'int-6',
            title: 'Piquage Enduits & Reprise Bétons Fibrés R3',
            chantierName: 'RESIDENCE LES JASMINS',
            clientName: 'Syndic LAMY Poissy',
            address: '32 Rue Paul Cézanne, 78300 Poissy',
            technicien: 'Nicolas Dupuis (Chef de Chantier)',
            zone: 'Paris Ouest (78)',
            date: wednesdayStr,
            startTime: '13:30',
            endTime: '17:00',
            color: 'blue',
            status: 'planifie'
        },

        // JEUDI
        {
            id: 'int-7',
            title: 'Visite Technique Préalable Échafaudage',
            chantierName: '76 AVENUE DE PARIS',
            clientName: 'Cabinet BARBEY Immobilier',
            address: '76 Avenue de Paris, 94160 Saint-Mandé',
            technicien: 'Thomas Laurent',
            zone: 'Paris Est (94)',
            date: thursdayStr,
            startTime: '09:00',
            endTime: '11:30',
            color: 'amber',
            status: 'planifie',
            notes: 'Contrôle implantation tunnel piétonnier sécurisé'
        },
        {
            id: 'int-8',
            title: 'Essai Teinte Nuancier D3 avec Conseil Syndical',
            chantierName: 'RESIDENCE LES JASMINS',
            clientName: 'Syndic LAMY Poissy',
            address: '32 Rue Paul Cézanne, 78300 Poissy',
            technicien: 'Mattis Khn (Admin)',
            zone: 'Paris Ouest (78)',
            date: thursdayStr,
            startTime: '14:00',
            endTime: '16:00',
            color: 'rose',
            status: 'planifie',
            notes: 'Application témoins RAL 9010 et Sable Doré sur pignon nord'
        },

        // VENDREDI
        {
            id: 'int-9',
            title: 'Contrôle Décennal SMA BTP & Suivi Drone Acrotères',
            chantierName: 'RESIDENCE PLEIN AIR',
            clientName: 'FONCIA Rives de Seine',
            address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
            technicien: 'Sophie Martinez (Conducteur)',
            zone: 'Paris Ouest (78)',
            date: fridayStr,
            startTime: '09:00',
            endTime: '12:00',
            color: 'amber',
            status: 'planifie'
        },
        {
            id: 'int-10',
            title: 'Réception Préalable Phase 1 - 5 Bâtiments',
            chantierName: 'RESIDENCE LES JASMINS',
            clientName: 'Syndic LAMY Poissy',
            address: '32 Rue Paul Cézanne, 78300 Poissy',
            technicien: 'Mattis Khn (Admin)',
            zone: 'Paris Ouest (78)',
            date: fridayStr,
            startTime: '14:00',
            endTime: '16:30',
            color: 'rose',
            status: 'planifie',
            notes: 'Signature PV d\'avancement pour situation n°1'
        },

        // SAMEDI
        {
            id: 'int-11',
            title: 'Contrôle des bâches & Sécurisation Weekend',
            chantierName: '76 AVENUE DE PARIS',
            clientName: 'Cabinet BARBEY Immobilier',
            address: '76 Avenue de Paris, 94160 Saint-Mandé',
            technicien: 'Nicolas Dupuis (Chef de Chantier)',
            zone: 'Paris Est (94)',
            date: saturdayStr,
            startTime: '09:30',
            endTime: '11:30',
            color: 'emerald',
            status: 'planifie'
        }
    ]
}

function ensureInitialized(): StoredIntervention[] {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }

        if (!fs.existsSync(FILE_PATH)) {
            const defaults = generateDefaultInterventions()
            try {
                fs.writeFileSync(FILE_PATH, JSON.stringify(defaults, null, 2), 'utf-8')
            } catch {}
            return defaults
        }

        const data = fs.readFileSync(FILE_PATH, 'utf-8')
        const parsed = JSON.parse(data)
        if (!Array.isArray(parsed) || parsed.length === 0) {
            const defaults = generateDefaultInterventions()
            try {
                fs.writeFileSync(FILE_PATH, JSON.stringify(defaults, null, 2), 'utf-8')
            } catch {}
            return defaults
        }

        return parsed
    } catch (e) {
        console.error('Erreur lecture store planning:', e)
        return generateDefaultInterventions()
    }
}

function saveInterventions(items: StoredIntervention[]): void {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8')
    } catch (e) {
        // Environnement serverless (read-only filesystem)
        console.warn('Ecriture planning_interventions.json locale ignoree (environnement serverless):', e)
    }
}

export function getStoredInterventions(): StoredIntervention[] {
    return ensureInitialized()
}

export function addStoredIntervention(item: Omit<StoredIntervention, 'id' | 'created_at' | 'updated_at'> & { id?: string }): StoredIntervention {
    const list = ensureInitialized()
    const now = new Date().toISOString()
    const newItem: StoredIntervention = {
        ...item,
        id: item.id || `int-${Date.now()}`,
        created_at: now,
        updated_at: now
    }
    list.unshift(newItem)
    saveInterventions(list)
    return newItem
}

export function updateStoredInterventionStatus(id: string, status: 'planifie' | 'en_cours' | 'termine'): StoredIntervention | null {
    const list = ensureInitialized()
    const found = list.find(i => i.id === id)
    if (found) {
        found.status = status
        found.updated_at = new Date().toISOString()
        saveInterventions(list)
        return found
    }
    return null
}

export function deleteStoredIntervention(id: string): boolean {
    const list = ensureInitialized()
    const initialLen = list.length
    const filtered = list.filter(i => i.id !== id)
    if (filtered.length !== initialLen) {
        saveInterventions(filtered)
        return true
    }
    return false
}
