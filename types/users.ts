export type UserRole = 'admin' | 'charge_affaires' | 'metreur' | 'conducteur_travaux' | 'chef_chantier' | 'comptabilite'
export type UserAccessStatus = 'actif' | 'invite' | 'suspendu'

export interface AuthorizedUser {
    id: string
    email: string
    role: UserRole
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    status: UserAccessStatus
    manager_id?: string | null
    company_id?: string | null
    created_by?: string | null
    invited_at: string
    last_login_at?: string | null
    created_at: string
    updated_at: string
}

export const USER_ROLES_CONFIG: Record<UserRole, { label: string; description: string; badgeColor: string }> = {
    admin: {
        label: 'Administrateur',
        description: 'Accès total à la gestion financière, paramètres entreprise, devis, factures et gestion des accès.',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
    },
    charge_affaires: {
        label: 'Chargé d\'Affaires',
        description: 'Chiffrage, création de devis, facturation, bibliothèque d\'articles et gestion de son portefeuille clients.',
        badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
    },
    metreur: {
        label: 'Métreur / Chiffreur',
        description: 'Études de prix, quantitatifs estimatifs (DQE), métrés sur plans et déboursés chantiers.',
        badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
    },
    conducteur_travaux: {
        label: 'Conducteur de Travaux',
        description: 'Suivi de chantiers, avancement des situations de travaux (%), étapes opérationnelles et planning.',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
    },
    chef_chantier: {
        label: 'Chef de Chantier',
        description: 'Consultation du planning, pointage d\'équipe, suivi des tâches et exécution sur le terrain.',
        badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
    },
    comptabilite: {
        label: 'Comptabilité',
        description: 'Consultation et export des factures, situations de travaux et suivi des règlements.',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
    }
}

/**
 * Extrait un prénom et nom réels et élégants à partir de l'email ou des métadonnées
 */
export function formatProfileName(email: string, metadata?: Record<string, any> | null): {
    firstName: string
    lastName: string
    displayName: string
} {
    // 1. Si prénom explicite dans les métadonnées (non égal au placeholder démo)
    const rawFirst = metadata?.first_name?.trim()
    const rawLast = metadata?.last_name?.trim()
    if (rawFirst && rawFirst.toLowerCase() !== 'alexandre') {
        return {
            firstName: rawFirst,
            lastName: rawLast || '',
            displayName: [rawFirst, rawLast].filter(Boolean).join(' ')
        }
    }

    // 2. Si Google OAuth fournit full_name ou name
    const rawFull = (metadata?.full_name || metadata?.name)?.trim()
    if (rawFull && !rawFull.toLowerCase().includes('vinuesa') && !rawFull.toLowerCase().includes('alexandre')) {
        const parts = rawFull.split(/\s+/)
        const f = parts[0]
        const l = parts.slice(1).join(' ')
        return { firstName: f, lastName: l, displayName: rawFull }
    }

    // 3. Extraction intelligente depuis l'email
    const lowerEmail = (email || '').toLowerCase().trim()
    if (!lowerEmail) {
        return { firstName: 'Utilisateur', lastName: '', displayName: 'Utilisateur' }
    }

    // Cas spéciaux de test demandés par l'utilisateur
    if (lowerEmail === 'mattiskhn@gmail.com') {
        return { firstName: 'Mattis', lastName: 'Khn', displayName: 'Mattis Khn' }
    }
    if (lowerEmail === 'mattiskhn2@gmail.com') {
        return { firstName: 'Mattis', lastName: 'Khn (Second)', displayName: 'Mattis Khn (Second)' }
    }

    const localPart = lowerEmail.split('@')[0]
    const dotParts = localPart.split(/[._-]+/)
    if (dotParts.length >= 2) {
        const f = dotParts[0].charAt(0).toUpperCase() + dotParts[0].slice(1)
        const l = dotParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        return { firstName: f, lastName: l, displayName: `${f} ${l}` }
    }

    const f = localPart.charAt(0).toUpperCase() + localPart.slice(1)
    return { firstName: f, lastName: '', displayName: f }
}
