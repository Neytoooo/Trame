import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Le client Supabase pour le Middleware doit être configuré pour gérer les cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
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

    // Rafraîchir la session si nécessaire
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redirections rapides pour les routes d'accès direct (Articles, Clients, Devis, Chantiers, Factures, Annonces, Tâches, Planning)
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

    if (rootShortcuts[request.nextUrl.pathname]) {
        return NextResponse.redirect(new URL(rootShortcuts[request.nextUrl.pathname], request.url))
    }

    // 1. Protection des routes Dashboard (Si non connecté -> Redirection login)
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Redirection Auth (Si connecté et sur page login/root -> Dashboard)
    if (request.nextUrl.pathname === '/' && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * On exclut explicitement /auth/callback du middleware 
         * pour éviter les conflits lors de l'échange du code.
         */
        '/((?!api|_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}