import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // next = la page où l'on veut aller après le login (souvent /dashboard)
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // On utilise NEXT_PUBLIC_SITE_URL pour être sûr de l'adresse
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
            return NextResponse.redirect(`${baseUrl}${next}`)
        } else {
            console.error('Erreur échange session:', error)
        }
    }

    // Sécurité : redirection vers l'origine avec le chemin d'erreur
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}