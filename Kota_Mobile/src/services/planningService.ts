import { Intervention, InterventionStatus } from '../types/planning'
import { getKotaApiUrl } from '../config/env'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEY = '@kota_planning_cache'
const CHANTIERS_CACHE_KEY = '@kota_chantiers_cache'

export interface PlanningMetadata {
  chantiers: Array<{ id: string; name: string; address: string; clientName: string }>
  teamMembers: Array<{ id: string; name: string; role: string; email: string }>
}

// 11 Interventions réelles synchronisées avec KOTA Web (Semaine 44)
export const DEFAULT_OFFLINE_INTERVENTIONS: Intervention[] = [
  // LUNDI 26/10
  {
    id: 'int-1',
    title: 'Métré & Sondage Acrotères',
    chantierName: 'RESIDENCE PLEIN AIR',
    clientName: 'FONCIA Rives de Seine',
    address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
    technicien: 'Mattis Khn (Admin)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-26',
    startTime: '08:30',
    endTime: '11:00',
    color: 'rose',
    status: 'en_cours',
    notes: 'Vérification dimensionnelle des relevés de couvertines alu',
  },
  {
    id: 'int-2',
    title: 'Installation Base-Vie & Roulotte raccordée',
    chantierName: 'RESIDENCE LES JASMINS',
    clientName: 'Syndic LAMY Poissy',
    address: '32 Rue Paul Cézanne, 78300 Poissy',
    technicien: 'Thomas Laurent',
    zone: 'Paris Ouest (78)',
    date: '2026-10-26',
    startTime: '13:30',
    endTime: '17:00',
    color: 'rose',
    status: 'en_cours',
    notes: 'Raccordement électrique et eau avec le gardien',
  },

  // MARDI 27/10 (Aujourd'hui)
  {
    id: 'int-3',
    title: 'Lavage Haute Pression Façade Bât. A & B',
    chantierName: 'RESIDENCE LES JASMINS',
    clientName: 'Syndic LAMY Poissy',
    address: '32 Rue Paul Cézanne, 78300 Poissy',
    technicien: 'Nicolas Dupuis (Chef de Chantier)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-27',
    startTime: '08:30',
    endTime: '12:00',
    color: 'blue',
    status: 'planifie',
    notes: 'Lavage eau chaude 140 bars + pulvérisation fongicide rémanent',
  },
  {
    id: 'int-4',
    title: 'Relevé Voirie & Balisage Piétons',
    chantierName: '76 AVENUE DE PARIS',
    clientName: 'Cabinet BARBEY Immobilier',
    address: '76 Avenue de Paris, 94160 Saint-Mandé',
    technicien: 'Thomas Laurent',
    zone: 'Paris Est (94)',
    date: '2026-10-27',
    startTime: '14:00',
    endTime: '16:30',
    color: 'rose',
    status: 'planifie',
    notes: 'Préparation dossier technique pour arrêté municipal',
  },

  // MERCREDI 28/10
  {
    id: 'int-5',
    title: 'Pose Couvertines Aluminium 15/10ème',
    chantierName: 'RESIDENCE PLEIN AIR',
    clientName: 'FONCIA Rives de Seine',
    address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
    technicien: 'Sophie Martinez (Conducteur)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-28',
    startTime: '08:30',
    endTime: '12:30',
    color: 'emerald',
    status: 'planifie',
    notes: "Fixation pattes inox et joints néoprène d'étanchéité",
  },
  {
    id: 'int-6',
    title: 'Piquage Enduits & Reprise Bétons Fibrés R3',
    chantierName: 'RESIDENCE LES JASMINS',
    clientName: 'Syndic LAMY Poissy',
    address: '32 Rue Paul Cézanne, 78300 Poissy',
    technicien: 'Nicolas Dupuis (Chef de Chantier)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-28',
    startTime: '13:30',
    endTime: '17:00',
    color: 'blue',
    status: 'planifie',
  },

  // JEUDI 29/10
  {
    id: 'int-7',
    title: 'Visite Technique Préalable Échafaudage',
    chantierName: '76 AVENUE DE PARIS',
    clientName: 'Cabinet BARBEY Immobilier',
    address: '76 Avenue de Paris, 94160 Saint-Mandé',
    technicien: 'Thomas Laurent',
    zone: 'Paris Est (94)',
    date: '2026-10-29',
    startTime: '09:00',
    endTime: '11:30',
    color: 'amber',
    status: 'planifie',
    notes: 'Contrôle implantation tunnel piétonnier sécurisé',
  },
  {
    id: 'int-8',
    title: 'Essai Teinte Nuancier D3 avec Conseil Syndical',
    chantierName: 'RESIDENCE LES JASMINS',
    clientName: 'Syndic LAMY Poissy',
    address: '32 Rue Paul Cézanne, 78300 Poissy',
    technicien: 'Mattis Khn (Admin)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-29',
    startTime: '14:00',
    endTime: '16:00',
    color: 'rose',
    status: 'planifie',
    notes: 'Application témoins RAL 9010 et Sable Doré sur pignon nord',
  },

  // VENDREDI 30/10
  {
    id: 'int-9',
    title: 'Contrôle Décennal SMA BTP & Suivi Drone Acrotères',
    chantierName: 'RESIDENCE PLEIN AIR',
    clientName: 'FONCIA Rives de Seine',
    address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
    technicien: 'Sophie Martinez (Conducteur)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-30',
    startTime: '09:00',
    endTime: '12:00',
    color: 'amber',
    status: 'planifie',
  },
  {
    id: 'int-10',
    title: 'Réception Préalable Phase 1 - 5 Bâtiments',
    chantierName: 'RESIDENCE LES JASMINS',
    clientName: 'Syndic LAMY Poissy',
    address: '32 Rue Paul Cézanne, 78300 Poissy',
    technicien: 'Mattis Khn (Admin)',
    zone: 'Paris Ouest (78)',
    date: '2026-10-30',
    startTime: '14:00',
    endTime: '16:30',
    color: 'rose',
    status: 'planifie',
    notes: "Signature PV d'avancement pour situation n°1",
  },

  // SAMEDI 31/10
  {
    id: 'int-11',
    title: 'Contrôle des bâches & Sécurisation Weekend',
    chantierName: '76 AVENUE DE PARIS',
    clientName: 'Cabinet BARBEY Immobilier',
    address: '76 Avenue de Paris, 94160 Saint-Mandé',
    technicien: 'Nicolas Dupuis (Chef de Chantier)',
    zone: 'Paris Est (94)',
    date: '2026-10-31',
    startTime: '09:30',
    endTime: '11:30',
    color: 'emerald',
    status: 'planifie',
  },
]

export const DEFAULT_OFFLINE_CHANTIERS = [
  { id: 'ch-plein-air', name: 'RESIDENCE PLEIN AIR', address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine', clientName: 'FONCIA Rives de Seine' },
  { id: 'ch-jasmin', name: 'RESIDENCE LES JASMINS', address: '32 Rue Paul Cézanne, 78300 Poissy', clientName: 'Syndic LAMY Poissy' },
  { id: 'ch-paris', name: '76 AVENUE DE PARIS', address: '76 Avenue de Paris, 94160 Saint-Mandé', clientName: 'Cabinet BARBEY Immobilier' }
]

/**
 * Récupère les interventions en direct depuis KOTA Web
 */
export async function fetchPlanningInterventions(): Promise<{
  interventions: Intervention[]
  chantiers: Array<{ id: string; name: string; address: string; clientName: string }>
  teamMembers: Array<{ id: string; name: string; role: string; email: string }>
  isOffline: boolean
}> {
  const kotaApiUrl = await getKotaApiUrl()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(`${kotaApiUrl}/api/mobile/planning`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()
      if (data.success && Array.isArray(data.interventions) && data.interventions.length > 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.interventions))
        if (data.chantiers) {
          await AsyncStorage.setItem(CHANTIERS_CACHE_KEY, JSON.stringify(data.chantiers))
        }
        return {
          interventions: data.interventions,
          chantiers: data.chantiers || DEFAULT_OFFLINE_CHANTIERS,
          teamMembers: data.teamMembers || [],
          isOffline: false,
        }
      }
    }
  } catch (e: any) {
    console.log('Serveur KOTA inaccessible, utilisation des données locales:', e.message)
  }

  // Lecture du cache local si disponible
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    const cachedChantiers = await AsyncStorage.getItem(CHANTIERS_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          interventions: parsed,
          chantiers: cachedChantiers ? JSON.parse(cachedChantiers) : DEFAULT_OFFLINE_CHANTIERS,
          teamMembers: [],
          isOffline: true,
        }
      }
    }
  } catch {}

  return {
    interventions: DEFAULT_OFFLINE_INTERVENTIONS,
    chantiers: DEFAULT_OFFLINE_CHANTIERS,
    teamMembers: [],
    isOffline: true,
  }
}

/**
 * Met à jour le statut d'une intervention sur KOTA Web et en local
 */
export async function updateInterventionStatus(
  id: string,
  newStatus: InterventionStatus
): Promise<boolean> {
  const kotaApiUrl = await getKotaApiUrl()

  // 1. Mise à jour immédiate sur le serveur KOTA Web
  try {
    const res = await fetch(`${kotaApiUrl}/api/mobile/planning`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    if (res.ok) {
      const d = await res.json()
      if (d.success) {
        console.log('Statut intervention synchronisé avec KOTA Web:', id, newStatus)
      }
    }
  } catch (err: any) {
    console.log('Serveur KOTA non joignable (sauvegardé en local):', err.message)
  }

  // 2. Mettre à jour dans le cache local
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    let list: Intervention[] = cached ? JSON.parse(cached) : DEFAULT_OFFLINE_INTERVENTIONS
    const found = list.find((i) => i.id === id)
    if (found) {
      found.status = newStatus
    } else {
      list = DEFAULT_OFFLINE_INTERVENTIONS.map(i => i.id === id ? { ...i, status: newStatus } : i)
    }
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list))
  } catch {}

  return true
}

/**
 * Crée une intervention et la synchronise sur KOTA Web
 */
export async function createIntervention(
  intervention: Omit<Intervention, 'id'>
): Promise<Intervention> {
  const kotaApiUrl = await getKotaApiUrl()

  try {
    const res = await fetch(`${kotaApiUrl}/api/mobile/planning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention),
    })
    if (res.ok) {
      const d = await res.json()
      if (d.success && d.intervention) {
        console.log('Intervention créée et transmise à KOTA Web:', d.intervention.id)
        return d.intervention
      }
    }
  } catch (err: any) {
    console.log('Erreur POST création KOTA Web (sauvegardé en local):', err.message)
  }

  // Fallback local
  const newItem: Intervention = {
    ...intervention,
    id: `mob-${Date.now()}`,
  }

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    const list: Intervention[] = cached ? JSON.parse(cached) : [...DEFAULT_OFFLINE_INTERVENTIONS]
    list.unshift(newItem)
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list))
  } catch {}

  return newItem
}
