import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    console.log('🔍 Callback appelé avec URL:', request.url)

    if (!code) {
        console.error('❌ Callback: Pas de code fourni')
        return NextResponse.redirect(new URL('/?error=no_code', request.url))
    }

    console.log('✅ Code reçu:', code.substring(0, 20) + '...')

    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables d\'environnement manquantes!')
        console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Définie' : 'MANQUANTE')
        console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Définie' : 'MANQUANTE')
        return NextResponse.redirect(new URL('/?error=config_error', request.url))
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                        console.warn('⚠️ Impossible de définir les cookies dans le callback')
                    }
                },
            },
        }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error("❌ Erreur d'échange de code:")
        console.error('   Message:', error.message)
        console.error('   Status:', error.status)
        console.error('   Name:', error.name)
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }

    console.log('✅ Auth réussie, redirection vers /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
}