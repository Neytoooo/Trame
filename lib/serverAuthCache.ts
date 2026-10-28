import fs from 'fs'
import path from 'path'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(process.cwd(), 'data')
const SESSION_FILE = path.join(DATA_DIR, 'server_session.json')

export interface CachedServerSession {
    accessToken: string
    refreshToken?: string
    userId?: string
    email?: string
    companyId?: string
    updatedAt: string
}

let inMemorySession: CachedServerSession | null = null

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
}

export function recordAuthSession(
    accessToken: string,
    refreshToken?: string,
    userId?: string,
    email?: string
) {
    if (!accessToken) return

    try {
        ensureDataDir()
        const session: CachedServerSession = {
            accessToken,
            refreshToken,
            userId: userId || inMemorySession?.userId,
            email: email || inMemorySession?.email || 'mattiskhn@gmail.com',
            companyId: '00000000-0000-0000-0000-000000000001',
            updatedAt: new Date().toISOString()
        }

        inMemorySession = session
        fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf8')
    } catch (err) {
        console.warn('Impossible d\'enregistrer la session serveur:', err)
    }
}

export function getCachedServerSession(): CachedServerSession | null {
    if (inMemorySession) return inMemorySession

    try {
        ensureDataDir()
        if (fs.existsSync(SESSION_FILE)) {
            const raw = fs.readFileSync(SESSION_FILE, 'utf8')
            inMemorySession = JSON.parse(raw)
            return inMemorySession
        }
    } catch {
        // ignore
    }

    return null
}

/**
 * Crée un client Supabase avec le jeton d'authentification de l'utilisateur actif
 * si disponible, permettant de contourner les restrictions RLS (role = 'authenticated')
 */
export function getAppSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const session = getCachedServerSession()

    if (session?.accessToken) {
        return createSupabaseClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            global: {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                }
            }
        })
    }

    return createSupabaseClient(supabaseUrl, supabaseKey)
}
