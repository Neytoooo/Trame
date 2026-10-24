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

function decodeBase64Url(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
        base64 += '='
    }
    return atob(base64)
}

function getSessionPayload(request: NextRequest) {
    const allCookies = request.cookies.getAll()
    const tokenCookies = allCookies.filter(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
    if (tokenCookies.length === 0) return null

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

    if (!rawVal) return null

    let decodedStr = rawVal
    if (decodedStr.startsWith('base64-')) {
        try {
            decodedStr = decodeBase64Url(decodedStr.slice(7))
        } catch {
            return null
        }
    }

    try {
        const parsed = JSON.parse(decodedStr)
        const token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null)
        if (token && typeof token === 'string' && token.includes('.')) {
            const payloadPart = token.split('.')[1]
            const payload = JSON.parse(decodeBase64Url(payloadPart))
            return payload
        }
    } catch {
        return null
    }

    return null
}

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl

    // 1. Redirections d'alias instantanées (0ms)
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

    // Fast-path pour visiteur non-connecté sur /dashboard : 0ms sans appel réseau
    if (pathname.startsWith('/dashboard') && !hasAuthCookie) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Si c'est un prefetch de lien ou une Server Action et que le cookie est présent
    if ((isPrefetch || isAction) && hasAuthCookie) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // 3. Décodage local instantané du JWT pour éviter les 2.9s d'appel réseau distant Supabase
    const sessionPayload = getSessionPayload(request)
    const isTokenValid = sessionPayload?.exp && (sessionPayload.exp * 1000) > Date.now() + 60000

    // Si sur /dashboard et que le token est encore valide, on passe directement sans freeze réseau (0ms)
    if (pathname.startsWith('/dashboard') && isTokenValid) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // Si sur l'accueil '/' avec un paramètre d'erreur (ex: utilisateur révoqué), ne JAMAIS rediriger sur le dashboard
    if (pathname === '/' && searchParams.has('error')) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // Si sur l'accueil '/' et déjà connecté avec token valide, redirection directe sur le dashboard (0ms)
    if (pathname === '/' && isTokenValid) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si sur l'accueil '/' et sans token valide, affichage immédiat de la page de connexion (0ms)
    if (pathname === '/' && !hasAuthCookie) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // 4. Seul cas où on contacte le serveur distant Supabase : le token est expiré et doit être rafraîchi
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

    // Rafraîchir la session uniquement lorsque le token était réellement expiré
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protection des routes Dashboard si le token s'est avéré invalide après tentative de refresh
    if (pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirection si reconnecté avec succès et sur la page d'accueil
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