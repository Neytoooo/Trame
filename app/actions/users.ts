'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole, UserAccessStatus, AuthorizedUser } from '@/types/users'
import { formatProfileName } from '@/types/users'
import { getCurrentCompanyId } from '@/lib/company'
import {
    getStoredUsers,
    getStoredUserByEmail,
    addStoredUser,
    updateStoredUserRole,
    updateStoredUserManager,
    updateStoredUserStatus,
    removeStoredUser,
    recordStoredUserLogin
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

    // 1. Tenter la vérification en priorité dans la table Supabase si elle existe
    try {
        const { data: authRecord, error } = await supabase
            .from('authorized_users')
            .select('*')
            .ilike('email', email)
            .maybeSingle()

        if (!error) {
            // La table existe dans Supabase
            if (authRecord) {
                // Si l'utilisateur était en attente (invité), l'activer immédiatement dès sa connexion
                if (authRecord.status === 'invite' || !authRecord.last_login_at) {
                    recordStoredUserLogin(email)
                    try {
                        await supabase
                            .from('authorized_users')
                            .update({
                                status: 'actif',
                                last_login_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            })
                            .ilike('email', email)
                    } catch {
                        // Silencieux
                    }
                }

                const fName = authRecord.first_name || nameInfo.firstName
                const lName = authRecord.last_name || nameInfo.lastName
                const dName = [fName, lName].filter(Boolean).join(' ') || nameInfo.displayName

                return {
                    role: authRecord.role as UserRole,
                    isAuthorized: authRecord.status !== 'suspendu',
                    isAdmin: authRecord.role === 'admin',
                    email: authRecord.email,
                    status: (authRecord.status === 'invite' ? 'actif' : authRecord.status) as UserAccessStatus,
                    firstName: fName,
                    lastName: lName,
                    displayName: dName
                }
            } else {
                // L'utilisateur a été supprimé de la table Supabase
                // Nettoyer également le store local pour rester parfaitement synchronisé
                removeStoredUser(email)
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
        }
    } catch {
        // Fallback store si la table n'existe pas encore dans Supabase
    }

    // 2. Fallback sur le store persistant si Supabase n'a pas la table
    const storedUser = getStoredUserByEmail(email)
    if (storedUser) {
        // Si l'utilisateur était en attente (invité), l'activer immédiatement dès sa connexion
        if (storedUser.status === 'invite' || !storedUser.last_login_at) {
            recordStoredUserLogin(email)
            storedUser.status = 'actif'
            storedUser.last_login_at = new Date().toISOString()
        }

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

    // 1. Vérification dans la table Supabase en priorité
    try {
        const supabase = await createClient()
        const { data: record, error } = await supabase
            .from('authorized_users')
            .select('*')
            .ilike('email', email)
            .maybeSingle()

        if (!error) {
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
            } else {
                // Supprimé de Supabase
                removeStoredUser(email)
                return {
                    isWhitelisted: false,
                    message: `L'adresse email "${email}" n'est plus autorisée sur cet espace d'entreprise. Votre compte a été révoqué.`
                }
            }
        }
    } catch {
        // Fallback store
    }

    // 2. Vérification dans le store persistant si la table Supabase n'est pas configurée
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

    return {
        isWhitelisted: false,
        message: `L'adresse email "${email}" n'a pas été invitée sur cet espace d'entreprise. Veuillez contacter votre administrateur.`
    }
}

/**
 * Enregistre la connexion d'un utilisateur et active son compte si en attente (invite -> actif)
 */
export async function recordUserLoginAction(rawEmail: string): Promise<void> {
    const email = (rawEmail || '').trim().toLowerCase()
    if (!email) return

    // 1. Mettre à jour dans le store persistant local
    recordStoredUserLogin(email)

    // 2. Tenter de synchroniser dans Supabase si la table existe
    try {
        const supabase = await createClient()
        const now = new Date().toISOString()
        await supabase
            .from('authorized_users')
            .update({
                status: 'actif',
                last_login_at: now,
                updated_at: now
            })
            .ilike('email', email)
    } catch {
        // Silencieux si table absente
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

        if (!error) {
            // La table existe dans Supabase : elle est la source de vérité absolue
            if (remoteUsers && remoteUsers.length > 0) {
                return {
                    success: true,
                    users: remoteUsers as AuthorizedUser[],
                    isTableMissing: false
                }
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
    manager_id?: string | null
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

    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const companyId = await getCurrentCompanyId(supabase)

    const basePayload: any = {
        email,
        role: payload.role || 'charge_affaires',
        first_name: payload.first_name?.trim() || null,
        last_name: payload.last_name?.trim() || null,
        phone: payload.phone?.trim() || null,
        status: 'invite',
        created_by: currentUser?.id || null,
        invited_at: new Date().toISOString(),
        company_id: companyId
    }

    // 1. Tenter d'abord l'insertion directe dans Supabase (Source de vérité de production)
    const payloadWithManager = payload.manager_id ? { ...basePayload, manager_id: payload.manager_id } : basePayload
    let remoteData: any = null
    let remoteError: any = null

    try {
        const res = await supabase
            .from('authorized_users')
            .insert(payloadWithManager)
            .select()
            .single()
        remoteData = res.data
        remoteError = res.error
    } catch (e: any) {
        remoteError = e
    }

    // Si la colonne manager_id ou company_id n'a pas encore été créée dans Supabase (erreur PGRST204)
    if (remoteError && (remoteError.code === 'PGRST204' || remoteError.message?.includes('manager_id') || remoteError.message?.includes('company_id'))) {
        try {
            const fallback1: any = { ...payloadWithManager }
            if (remoteError.message?.includes('company_id') || remoteError.code === 'PGRST204') {
                delete fallback1.company_id
            }
            if (remoteError.message?.includes('manager_id')) {
                delete fallback1.manager_id
            }
            let retry = await supabase
                .from('authorized_users')
                .insert(fallback1)
                .select()
                .single()

            if (retry.error && (retry.error.code === 'PGRST204' || retry.error.message?.includes('manager_id') || retry.error.message?.includes('company_id'))) {
                const minimalPayload: any = { ...basePayload }
                delete minimalPayload.manager_id
                delete minimalPayload.company_id
                retry = await supabase
                    .from('authorized_users')
                    .insert(minimalPayload)
                    .select()
                    .single()
            }
            remoteData = retry.data
            remoteError = retry.error
        } catch (e: any) {
            remoteError = e
        }
    }

    // Gestion des erreurs Supabase
    if (remoteError) {
        // Table inexistante dans Supabase : fallback local
        if (remoteError.code === 'PGRST205' || remoteError.code === '42P01') {
            const saved = addStoredUser({
                email,
                role: payload.role || 'charge_affaires',
                first_name: payload.first_name?.trim() || null,
                last_name: payload.last_name?.trim() || null,
                phone: payload.phone?.trim() || null,
                company_id: companyId || null,
                manager_id: payload.manager_id || null
            })
            revalidatePath('/dashboard/utilisateurs')
            revalidatePath('/dashboard/equipe')
            return { success: true, user: saved }
        }

        // Email dupliqué
        if (remoteError.code === '23505' || remoteError.message?.includes('duplicate key') || remoteError.message?.includes('unique constraint')) {
            return { success: false, error: `L'adresse email "${email}" est déjà autorisée dans l'entreprise.` }
        }

        // Erreur de permission RLS
        if (remoteError.code === '42501' || remoteError.message?.includes('row-level security')) {
            console.error('Erreur RLS Supabase:', remoteError)
            return {
                success: false,
                error: "Erreur de permission Supabase (RLS). Veuillez exécuter le script SQL dans votre console Supabase pour autoriser l'écriture."
            }
        }

        console.error("Erreur Supabase lors de l'insertion:", remoteError)
        return { success: false, error: remoteError.message || "Erreur lors de l'enregistrement en base de données Supabase." }
    }

    // 2. Synchroniser dans le store local pour cohérence
    const finalUser: AuthorizedUser = remoteData ? {
        id: remoteData.id,
        email: remoteData.email,
        role: remoteData.role as UserRole,
        first_name: remoteData.first_name,
        last_name: remoteData.last_name,
        phone: remoteData.phone,
        status: remoteData.status,
        company_id: remoteData.company_id || companyId || null,
        manager_id: remoteData.manager_id || payload.manager_id || null,
        created_by: remoteData.created_by,
        invited_at: remoteData.invited_at,
        last_login_at: remoteData.last_login_at,
        created_at: remoteData.created_at,
        updated_at: remoteData.updated_at
    } : addStoredUser({
        email,
        role: payload.role || 'charge_affaires',
        first_name: payload.first_name?.trim() || null,
        last_name: payload.last_name?.trim() || null,
        phone: payload.phone?.trim() || null,
        company_id: companyId || null,
        manager_id: payload.manager_id || null
    })

    addStoredUser(finalUser)

    revalidatePath('/dashboard/utilisateurs')
    revalidatePath('/dashboard/equipe')
    return { success: true, user: finalUser }
}

/**
 * Met à jour le supérieur hiérarchique d'un utilisateur (Réservé aux Administrateurs)
 */
export async function updateAuthorizedUserManagerAction(
    userId: string,
    newManagerId: string | null
): Promise<{ success: boolean; error?: string }> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut modifier la hiérarchie.' }
    }

    const updated = updateStoredUserManager(userId, newManagerId)
    if (!updated) {
        return { success: false, error: 'Utilisateur introuvable.' }
    }

    try {
        const supabase = await createClient()
        await supabase
            .from('authorized_users')
            .update({ manager_id: newManagerId, updated_at: new Date().toISOString() })
            .eq('id', userId)
    } catch {
        // Silencieux si table absente
    }

    revalidatePath('/dashboard/utilisateurs')
    revalidatePath('/dashboard/equipe')
    return { success: true }
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
export async function removeAuthorizedUserAction(
    userId: string,
    explicitEmail?: string
): Promise<{
    success: boolean
    error?: string
}> {
    const userRole = await getCurrentUserRoleAction()
    if (!userRole.isAdmin) {
        return { success: false, error: 'Accès refusé. Seul un administrateur peut révoquer des accès.' }
    }

    const storedUsers = getStoredUsers()
    const target = storedUsers.find(
        u => u.id === userId || (explicitEmail && u.email.toLowerCase() === explicitEmail.toLowerCase())
    )

    const targetEmail = (explicitEmail || target?.email || '').trim().toLowerCase()

    if (targetEmail === 'mattiskhn@gmail.com') {
        return { success: false, error: 'Impossible de supprimer le compte administrateur principal.' }
    }
    if (target?.role === 'admin') {
        const adminCount = storedUsers.filter(u => u.role === 'admin').length
        if (adminCount <= 1) {
            return { success: false, error: 'Impossible de supprimer le seul administrateur de l\'entreprise.' }
        }
    }

    // 1. Supprimer du store local par ID et par Email
    removeStoredUser(userId)
    if (targetEmail) {
        removeStoredUser(targetEmail)
    }

    // 2. Supprimer de la table Supabase si elle existe
    try {
        const supabase = await createClient()
        if (targetEmail) {
            await supabase
                .from('authorized_users')
                .delete()
                .or(`id.eq.${userId},email.ilike.${targetEmail}`)
        } else {
            await supabase.from('authorized_users').delete().eq('id', userId)
        }
    } catch {
        // Ignorer
    }

    revalidatePath('/dashboard/utilisateurs')
    revalidatePath('/dashboard')
    return { success: true }
}
