import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Le middleware gère parfois déjà ça
                    }
                },
            },
        }
    )
}

/**
 * Récupère l'utilisateur Supabase de manière ultra-rapide et mémoïsée par requête React.
 * 1. Décode d'abord le JWT valide directement depuis le cookie en 0.01ms (0 appel réseau distant).
 * 2. Si le token est expiré ou absent, effectue le rafraîchissement via supabase.auth.getUser() (au maximum 1 fois par rendu).
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        const tokenCookies = allCookies.filter(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

        if (tokenCookies.length > 0) {
            let rawVal = ''
            if (tokenCookies.length === 1 && !tokenCookies[0].name.includes('.')) {
                rawVal = tokenCookies[0].value
            } else {
                tokenCookies.sort((a, b) => {
                    const idxA = parseInt(a.name.split('.').pop() || '0', 10)
                    const idxB = parseInt(b.name.split('.').pop() || '0', 10)
                    return idxA - idxB
                })
                rawVal = tokenCookies.map(c => c.value).join('')
            }

            if (rawVal) {
                let decodedStr = rawVal
                if (decodedStr.startsWith('base64-')) {
                    try {
                        decodedStr = Buffer.from(decodedStr.slice(7), 'base64url').toString('utf8')
                    } catch {
                        // Fallback
                    }
                }

                try {
                    const parsed = JSON.parse(decodedStr)
                    const token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null)
                    if (token && typeof token === 'string' && token.includes('.')) {
                        const payloadPart = token.split('.')[1]
                        const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'))
                        try {
                            const { recordAuthSession } = await import('@/lib/serverAuthCache')
                            recordAuthSession(token, parsed.refresh_token, payload?.sub, payload?.email)
                        } catch {}
                        // Si le token est valide pendant encore au moins 60 secondes
                        if (payload?.exp && (payload.exp * 1000) > Date.now() + 60000) {
                            return {
                                id: payload.sub,
                                aud: payload.aud || 'authenticated',
                                role: payload.role || 'authenticated',
                                email: payload.email,
                                email_confirmed_at: payload.email_confirmed_at || new Date().toISOString(),
                                phone: payload.phone || '',
                                confirmed_at: payload.confirmed_at || new Date().toISOString(),
                                last_sign_in_at: payload.last_sign_in_at || new Date().toISOString(),
                                app_metadata: payload.app_metadata || {},
                                user_metadata: payload.user_metadata || {},
                                identities: [],
                                created_at: payload.created_at || new Date().toISOString(),
                                updated_at: payload.updated_at || new Date().toISOString(),
                            } as User
                        }
                    }
                } catch {
                    // Fallback sur le réseau
                }
            }
        }
    } catch {
        // En cas d'erreur de parsing des cookies, fallback
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
})