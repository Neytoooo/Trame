import fs from 'fs'
import path from 'path'
import type { AuthorizedUser, UserRole, UserAccessStatus } from '@/types/users'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'authorized_users.json')

// 6 Comptes de test professionnels pré-configurés avec rôles distincts BTP
const DEFAULT_TEST_USERS: AuthorizedUser[] = [
    {
        id: 'usr-mattis-admin',
        email: 'mattiskhn@gmail.com',
        role: 'admin',
        first_name: 'Mattis',
        last_name: 'Khn',
        phone: '06 12 34 56 78',
        status: 'actif',
        manager_id: null,
        created_by: null,
        invited_at: '2026-10-01T08:00:00.000Z',
        last_login_at: new Date().toISOString(),
        created_at: '2026-10-01T08:00:00.000Z',
        updated_at: new Date().toISOString()
    },
    {
        id: 'usr-mattis-metreur',
        email: 'mattiskhn2@gmail.com',
        role: 'metreur',
        first_name: 'Mattis',
        last_name: 'Khn (Second)',
        phone: '06 98 76 54 32',
        status: 'actif',
        manager_id: 'usr-mattis-admin',
        created_by: 'usr-mattis-admin',
        invited_at: '2026-10-05T09:30:00.000Z',
        last_login_at: new Date().toISOString(),
        created_at: '2026-10-05T09:30:00.000Z',
        updated_at: new Date().toISOString()
    },
    {
        id: 'usr-thomas-ca',
        email: 'thomas.laurent@trame-btp.fr',
        role: 'charge_affaires',
        first_name: 'Thomas',
        last_name: 'Laurent',
        phone: '06 45 12 89 23',
        status: 'actif',
        manager_id: 'usr-mattis-admin',
        created_by: 'usr-mattis-admin',
        invited_at: '2026-10-10T10:00:00.000Z',
        last_login_at: '2026-10-22T14:30:00.000Z',
        created_at: '2026-10-10T10:00:00.000Z',
        updated_at: '2026-10-22T14:30:00.000Z'
    },
    {
        id: 'usr-sophie-ct',
        email: 'sophie.martinez@trame-btp.fr',
        role: 'conducteur_travaux',
        first_name: 'Sophie',
        last_name: 'Martinez',
        phone: '06 78 45 12 90',
        status: 'actif',
        manager_id: 'usr-mattis-admin',
        created_by: 'usr-mattis-admin',
        invited_at: '2026-10-12T11:15:00.000Z',
        last_login_at: '2026-10-23T08:45:00.000Z',
        created_at: '2026-10-12T11:15:00.000Z',
        updated_at: '2026-10-23T08:45:00.000Z'
    },
    {
        id: 'usr-nicolas-chef',
        email: 'nicolas.dupuis@trame-btp.fr',
        role: 'chef_chantier',
        first_name: 'Nicolas',
        last_name: 'Dupuis',
        phone: '06 33 21 87 65',
        status: 'actif',
        manager_id: 'usr-sophie-ct',
        created_by: 'usr-mattis-admin',
        invited_at: '2026-10-15T14:00:00.000Z',
        last_login_at: '2026-10-23T07:15:00.000Z',
        created_at: '2026-10-15T14:00:00.000Z',
        updated_at: '2026-10-23T07:15:00.000Z'
    },
    {
        id: 'usr-claire-compta',
        email: 'claire.bernard@trame-btp.fr',
        role: 'comptabilite',
        first_name: 'Claire',
        last_name: 'Bernard',
        phone: '06 54 89 63 21',
        status: 'actif',
        manager_id: 'usr-mattis-admin',
        created_by: 'usr-mattis-admin',
        invited_at: '2026-10-18T09:00:00.000Z',
        last_login_at: '2026-10-22T17:20:00.000Z',
        created_at: '2026-10-18T09:00:00.000Z',
        updated_at: '2026-10-22T17:20:00.000Z'
    }
]

function ensureInitialized(): AuthorizedUser[] {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, JSON.stringify(DEFAULT_TEST_USERS, null, 2), 'utf-8')
            return DEFAULT_TEST_USERS
        }
        const content = fs.readFileSync(FILE_PATH, 'utf-8')
        const parsed = JSON.parse(content) as AuthorizedUser[]

        // S'assurer que le compte administrateur principal existe toujours pour éviter tout blocage
        let modified = false
        const adminEmail = 'mattiskhn@gmail.com'
        const adminIdx = parsed.findIndex(u => u.email.toLowerCase() === adminEmail)
        if (adminIdx === -1) {
            parsed.unshift({
                id: 'usr-mattis-admin',
                email: adminEmail,
                role: 'admin',
                first_name: 'Mattis',
                last_name: 'Khn',
                phone: '06 12 34 56 78',
                status: 'actif',
                created_by: null,
                invited_at: '2026-10-01T08:00:00.000Z',
                last_login_at: new Date().toISOString(),
                created_at: '2026-10-01T08:00:00.000Z',
                updated_at: new Date().toISOString()
            })
            modified = true
        } else if (parsed[adminIdx].role !== 'admin') {
            parsed[adminIdx].role = 'admin'
            modified = true
        }

        if (modified) {
            fs.writeFileSync(FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8')
        }
        return parsed
    } catch (e) {
        console.error('Erreur lecture store authorized users:', e)
        return DEFAULT_TEST_USERS
    }
}

function saveUsers(users: AuthorizedUser[]): void {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2), 'utf-8')
    } catch (e) {
        console.error('Erreur écriture store authorized users:', e)
    }
}

export function getStoredUsers(): AuthorizedUser[] {
    return ensureInitialized()
}

export function getStoredUserByEmail(rawEmail: string): AuthorizedUser | null {
    const email = (rawEmail || '').trim().toLowerCase()
    if (!email) return null
    const users = ensureInitialized()
    return users.find(u => u.email.toLowerCase() === email) || null
}

export function addStoredUser(user: {
    id?: string
    email: string
    role: UserRole
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    company_id?: string | null
    manager_id?: string | null
    status?: UserAccessStatus
    created_by?: string | null
    invited_at?: string | null
    last_login_at?: string | null
    created_at?: string
    updated_at?: string
}): AuthorizedUser {
    const users = ensureInitialized()
    const email = user.email.trim().toLowerCase()
    const existing = users.find(u => u.email.toLowerCase() === email)
    if (existing) {
        existing.role = user.role
        existing.first_name = user.first_name || existing.first_name
        existing.last_name = user.last_name || existing.last_name
        existing.phone = user.phone || existing.phone
        if (user.company_id !== undefined) {
            existing.company_id = user.company_id
        }
        if (user.manager_id !== undefined) {
            existing.manager_id = user.manager_id
        }
        if (user.status) {
            existing.status = user.status
        }
        existing.updated_at = new Date().toISOString()
        saveUsers(users)
        return existing
    }

    const newUser: AuthorizedUser = {
        id: user.id || ('usr-' + Date.now()),
        email,
        role: user.role,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        phone: user.phone || null,
        status: user.status || 'invite',
        company_id: user.company_id || null,
        manager_id: user.manager_id !== undefined ? user.manager_id : null,
        created_by: user.created_by || null,
        invited_at: user.invited_at || new Date().toISOString(),
        last_login_at: user.last_login_at || null,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString()
    }
    users.unshift(newUser)
    saveUsers(users)
    return newUser
}

export function updateStoredUserManager(identifier: string, newManagerId: string | null): boolean {
    const users = ensureInitialized()
    const user = users.find(u => u.id === identifier || u.email.toLowerCase() === identifier.toLowerCase())
    if (!user) return false
    user.manager_id = newManagerId
    user.updated_at = new Date().toISOString()
    saveUsers(users)
    return true
}

export function recordStoredUserLogin(rawEmail: string): boolean {
    const email = (rawEmail || '').trim().toLowerCase()
    if (!email) return false
    const users = ensureInitialized()
    const user = users.find(u => u.email.toLowerCase() === email)
    if (!user) return false

    const now = new Date().toISOString()
    user.last_login_at = now
    if (user.status === 'invite') {
        user.status = 'actif'
    }
    user.updated_at = now
    saveUsers(users)
    return true
}

export function updateStoredUserRole(identifier: string, newRole: UserRole): boolean {
    const users = ensureInitialized()
    const target = identifier.trim().toLowerCase()
    const user = users.find(u => u.id === identifier || u.email.toLowerCase() === target)
    if (!user) return false
    user.role = newRole
    user.updated_at = new Date().toISOString()
    saveUsers(users)
    return true
}

export function updateStoredUserStatus(identifier: string, newStatus: UserAccessStatus): boolean {
    const users = ensureInitialized()
    const target = identifier.trim().toLowerCase()
    const user = users.find(u => u.id === identifier || u.email.toLowerCase() === target)
    if (!user) return false
    user.status = newStatus
    user.updated_at = new Date().toISOString()
    saveUsers(users)
    return true
}

export function removeStoredUser(identifier: string): boolean {
    const users = ensureInitialized()
    const target = identifier.trim().toLowerCase()
    const filtered = users.filter(u => u.id !== identifier && u.email.toLowerCase() !== target)
    if (filtered.length === users.length) return false
    saveUsers(filtered)
    return true
}
