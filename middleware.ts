import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Redirections rapides d'accès direct (0ms, exécutées en amont sans toucher au réseau)
const rootShortcuts: Record<string, string> = {
    '/articles': '/dashboard/articles',
    '/annonces': '/dashboard/annonces',
    '/clients': '/dashboard/clients',
    '/chantiers': '/dashboard/chantiers',
    '/devis': '/dashboard/devis',
    '/factures': '/dashboard/factures',
    '/taches': '/dashboard/trello',
    '/dashboard/taches': '/dashboard/trello',
    '/planning': '/dashboard/planning',
}

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl

    // 1. Redirections d'alias instantanées
    if (rootShortcuts[pathname]) {
        return NextResponse.redirect(new URL(rootShortcuts[pathname], request.url))
    }

    // 2. Détection des requêtes de fond légères (Prefetch Next.js, Server Actions, payload RSC)
    const isPrefetch = request.headers.get('next-router-prefetch') === '1' ||
        request.headers.get('purpose') === 'prefetch' ||
        searchParams.has('_rsc')
    const isAction = request.headers.has('next-action')

    const allCookies = request.cookies.getAll()
    const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

    // 3. Fast-path pour visiteur non-connecté sur /dashboard : 0ms sans appel réseau
    if (pathname.startsWith('/dashboard') && !hasAuthCookie) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 4. Si c'est un prefetch de lien ou une Server Action et que le cookie est présent,
    // on ne bloque pas le pipeline avec un appel distant à Supabase Auth
    if ((isPrefetch || isAction) && hasAuthCookie) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // 5. Configuration Supabase SSR standard pour rafraîchir les cookies de session sur les vraies navigations
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Rafraîchir la session uniquement sur les navigations complètes
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protection des routes Dashboard si le token s'est avéré invalide
    if (pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirection si déjà connecté et sur la page d'accueil
    if (pathname === '/' && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * On exclut explicitement /auth/callback et les fichiers statiques
         */
        '/((?!api|_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}