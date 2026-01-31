import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cookiesToSet) => {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Redirection relative et sécurisée vers le dashboard
            // Cela garde le même domaine et protocole (http/https) que la requête actuelle
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        console.error("Erreur d'échange :", error.message)
    }

    // Erreur ou pas de code -> Redirection erreur relative
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
}