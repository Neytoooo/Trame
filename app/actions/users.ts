'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole, UserAccessStatus, AuthorizedUser } from '@/types/users'
import { formatProfileName } from '@/types/users'
import {
    getStoredUsers,
    getStoredUserByEmail,
    addStoredUser,
    updateStoredUserRole,
    updateStoredUserStatus,
    removeStoredUser
} from '@/lib/authorizedUsersStore'

/**
 * Récupère le rôle et le profil de l'utilisateur actuellement connecté
 */
export async function getCurrentUserRoleAction(explicitEmail?: string): Promise<{
    role: UserRole
    isAuthorized: boolean
    isAdmin: boolean
    email: string
    status: UserAccessStatus
    firstName: string
    lastName: string
    displayName: string
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = (explicitEmail || user?.email || '').trim().toLowerCase()
    const nameInfo = formatProfileName(email, user?.user_metadata)

    if (!email) {
        return {
            role: 'charge_affaires',
            isAuthorized: false,
            isAdmin: false,
            email: '',
            status: 'suspendu',
            firstName: 'Utilisateur',
            lastName: '',
            displayName: 'Utilisateur'
        }
    }

    // 1. Vérifier en priorité dans le store persistant
    const storedUser = getStoredUserByEmail(email)
    if (storedUser) {
        const fName = storedUser.first_name || nameInfo.firstName
        const lName = storedUser.last_name || nameInfo.lastName
        const dName = [fName, lName].filter(Boolean).join(' ') || nameInfo.displayName

        return {
            role: storedUser.role,
            isAuthorized: storedUser.status !== 'suspendu',
            isAdmin: storedUser.role === 'admin',
            email: storedUser.email,
            status: storedUser.status,
            firstName: fName,
            lastName: lName,
            displayName: dName
        }
    }

    // 2. Vérifier dans la table Supabase si elle existe
    try {
        const { data: authRecord } = await supabase
            .from('authorized_users')
            .select('*')
            .ilike('email', email)
            .single()

        if (authRecord) {
            const fName = authRecord.first_name || nameInfo.firstName
            const lName = authRecord.last_name || nameInfo.lastName
            const dName = [fName, lName].filter(Boolean).join(' ') || nameInfo.displayName

            return {
                role: authRecord.role as UserRole,
                isAuthorized: authRecord.status !== 'suspendu',
                isAdmin: authRecord.role === 'admin',
                email: authRecord.email,
                status: authRecord.status as UserAccessStatus,
                firstName: fName,
                lastName: lName,
                displayName: dName
            }
        }
    } catch {
        // Fallback store
    }

    // Par défaut si email introuvable dans la liste
    return {
        role: 'charge_affaires',
        isAuthorized: false,
        isAdmin: false,
        email,
        status: 'suspendu',
        firstName: nameInfo.firstName,
        lastName: nameInfo.lastName,
        displayName: nameInfo.displayName
    }
}

/**
 * Vérifie si un email est autorisé avant ou pendant la connexion
 */
export async function checkEmailWhitelistedAction(rawEmail: string): Promise<{
    isWhitelisted: boolean
    role?: UserRole
    status?: UserAccessStatus
    message?: string
}> {
    const email = (rawEmail || '').trim().toLowerCase()
    if (!email) {
        return { isWhitelisted: false, message: 'Adresse email invalide.' }
    }

    // 1. Vérification dans le store persistant
    const stored = getStoredUserByEmail(email)
    if (stored) {
        if (stored.status === 'suspendu') {
            return {
                isWhitelisted: false,
                message: 'Votre accès à cette entreprise a été suspendu par l\'administrateur.'
            }
        }
        return {
            isWhitelisted: true,
            role: stored.role,
            status: stored.status
        }
    }

    // 2. Vérification dans la table Supabase
    try {
        const supabase = await createClient()
        const { data: record } = await supabase
            .from('authorized_users')
            .select('*')
            .ilike('email', email)
            .single()

        if (record) {
            if (record.status === 'suspendu') {
                return {
                    isWhitelisted: false,
                    message: 'Votre accès à cette entreprise a été suspendu par l\'administrateur.'
                }
            }
            return {
                isWhitelisted: true,
                role: record.role as UserRole,
                status: record.status as UserAccessStatus
            }
        }
    } catch {
        // Fallback
    }

    return {
        isWhitelisted: false,
        message: `L'adresse email "${email}" n'a pas été invitée sur cet espace d'entreprise. Veuillez contacter votre administrateur.`
    }
}

/**
 * Récupère la liste de tous les utilisateurs autorisés (Réservé aux Administrateurs)
 */
export async function getAuthorizedUsersAction(): Promise<{
    success: boolean
    users?: AuthorizedUser[]
    isTableMissing?: boolean
    error?: string
}> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut gérer les utilisateurs.' }
    }

    // Récupérer la liste complète des utilisateurs pré-configurés et personnalisés
    const storedUsers = getStoredUsers()

    // Tenter de synchroniser avec Supabase si la table existe
    try {
        const supabase = await createClient()
        const { data: remoteUsers, error } = await supabase
            .from('authorized_users')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && remoteUsers && remoteUsers.length > 0) {
            // Fusionner avec les utilisateurs distants
            const mergedMap = new Map<string, AuthorizedUser>()
            for (const u of storedUsers) mergedMap.set(u.email.toLowerCase(), u)
            for (const u of remoteUsers as AuthorizedUser[]) mergedMap.set(u.email.toLowerCase(), u)
            return {
                success: true,
                users: Array.from(mergedMap.values()),
                isTableMissing: false
            }
        }

        if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
            return {
                success: true,
                users: storedUsers,
                isTableMissing: true
            }
        }
    } catch {
        // Fallback store
    }

    return {
        success: true,
        users: storedUsers,
        isTableMissing: false
    }
}

/**
 * Ajoute un nouvel email autorisé avec son rôle (Réservé aux Administrateurs)
 */
export async function addAuthorizedUserAction(payload: {
    email: string
    role: UserRole
    first_name?: string
    last_name?: string
    phone?: string
}): Promise<{
    success: boolean
    user?: AuthorizedUser
    error?: string
}> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut ajouter des utilisateurs.' }
    }

    const email = (payload.email || '').trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
        return { success: false, error: 'Veuillez renseigner une adresse email valide.' }
    }

    // Sauvegarder dans le store persistant
    const saved = addStoredUser({
        email,
        role: payload.role || 'charge_affaires',
        first_name: payload.first_name?.trim() || null,
        last_name: payload.last_name?.trim() || null,
        phone: payload.phone?.trim() || null
    })

    // Tenter de synchroniser avec Supabase
    try {
        const supabase = await createClient()
        await supabase.from('authorized_users').insert({
            email: saved.email,
            role: saved.role,
            first_name: saved.first_name,
            last_name: saved.last_name,
            phone: saved.phone,
            status: saved.status,
            invited_at: saved.invited_at
        })
    } catch {
        // Silencieux si table absente
    }

    revalidatePath('/dashboard/utilisateurs')
    return { success: true, user: saved }
}

/**
 * Modifie le rôle d'un utilisateur (Réservé aux Administrateurs)
 */
export async function updateAuthorizedUserRoleAction(
    userId: string,
    newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut modifier les rôles.' }
    }

    // Empêcher de rétrograder le dernier admin
    if (newRole !== 'admin') {
        const storedUsers = getStoredUsers()
        const target = storedUsers.find(u => u.id === userId)
        if (target?.role === 'admin') {
            const adminCount = storedUsers.filter(u => u.role === 'admin').length
            if (adminCount <= 1) {
                return { success: false, error: 'Impossible de modifier le rôle du seul administrateur actif de l\'entreprise.' }
            }
        }
    }

    const updated = updateStoredUserRole(userId, newRole)

    // Tenter de synchroniser avec Supabase
    try {
        const supabase = await createClient()
        await supabase
            .from('authorized_users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId)
    } catch {
        // Ignorer si table absente
    }

    revalidatePath('/dashboard/utilisateurs')
    revalidatePath('/dashboard')
    return { success: updated }
}

/**
 * Modifie le statut d'un utilisateur (Actif / Suspendu)
 */
export async function updateAuthorizedUserStatusAction(
    userId: string,
    newStatus: UserAccessStatus
): Promise<{ success: boolean; error?: string }> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut suspendre des accès.' }
    }

    // Empêcher de suspendre le dernier admin
    if (newStatus === 'suspendu') {
        const storedUsers = getStoredUsers()
        const target = storedUsers.find(u => u.id === userId)
        if (target?.role === 'admin') {
            const activeAdmins = storedUsers.filter(u => u.role === 'admin' && u.status !== 'suspendu').length
            if (activeAdmins <= 1) {
                return { success: false, error: 'Impossible de suspendre le seul administrateur actif.' }
            }
        }
    }

    const updated = updateStoredUserStatus(userId, newStatus)

    try {
        const supabase = await createClient()
        await supabase
            .from('authorized_users')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', userId)
    } catch {
        // Ignorer
    }

    revalidatePath('/dashboard/utilisateurs')
    return { success: updated }
}

/**
 * Révoque / supprime définitivement un utilisateur de la liste blanche (Réservé aux Administrateurs)
 */
export async function removeAuthorizedUserAction(userId: string): Promise<{
    success: boolean
    error?: string
}> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut révoquer des accès.' }
    }

    const storedUsers = getStoredUsers()
    const target = storedUsers.find(u => u.id === userId)
    if (target?.role === 'admin') {
        const adminCount = storedUsers.filter(u => u.role === 'admin').length
        if (adminCount <= 1) {
            return { success: false, error: 'Impossible de supprimer le seul administrateur de l\'entreprise.' }
        }
    }

    const removed = removeStoredUser(userId)

    try {
        const supabase = await createClient()
        await supabase.from('authorized_users').delete().eq('id', userId)
    } catch {
        // Ignorer
    }

    revalidatePath('/dashboard/utilisateurs')
    return { success: removed }
}
