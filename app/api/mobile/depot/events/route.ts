import { subscribeToDepotEvents } from '@/lib/depotStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/depot/events
 * Flux Server-Sent Events (SSE) : avertit en direct le navigateur KOTA Web
 * dès qu'une nouvelle photo arrive depuis KOTA Mobile, SANS AUCUN POLLING.
 */
export async function GET() {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        start(controller) {
            // Message initial de bienvenue
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`)
            )

            // Abonnement aux notifications du store
            const unsubscribe = subscribeToDepotEvents((event) => {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                    )
                } catch {
                    unsubscribe()
                }
            })

            // Heartbeat toutes les 25 secondes pour maintenir la connexion active
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': ping\n\n'))
                } catch {
                    clearInterval(heartbeatInterval)
                    unsubscribe()
                }
            }, 25000)
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    })
}
