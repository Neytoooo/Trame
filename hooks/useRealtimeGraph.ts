import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'

// Config
const CURSOR_COLORS = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'
]

type CursorData = {
    x: number
    y: number
    userId: string
    email: string
    color: string
    lastUpdate: number
}

const throttle = (func: Function, limit: number) => {
    let inThrottle = false
    let lastArgs: any[] | null = null
    return function (this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => {
                inThrottle = false
                if (lastArgs) {
                    func.apply(this, lastArgs)
                    lastArgs = null
                }
            }, limit)
        } else {
            lastArgs = args
        }
    }
}

export const useRealtimeGraph = (chantierId: string, user: any) => {
    // Stable Supabase client instance across renders
    const supabase = useMemo(() => createClient(), [])
    const [cursors, setCursors] = useState<Record<string, CursorData>>({})
    const [presenceState, setPresenceState] = useState<any>({})
    const [remoteNodePositions, setRemoteNodePositions] = useState<Record<string, { x: number, y: number }>>({})

    const userRef = useRef(user)
    userRef.current = user

    // Assign random color to current user once
    const myColor = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]).current
    const channelRef = useRef<any>(null)

    // Extract present users
    const presentUsers = useMemo(() => Object.values(presenceState).flat() as any[], [presenceState])
    const presentUsersRef = useRef<any[]>([])
    presentUsersRef.current = presentUsers

    const userId = user?.id

    useEffect(() => {
        if (!userId) return

        const channel = supabase.channel(`tracking_${chantierId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })
        channelRef.current = channel

        channel
            .on('presence', { event: 'sync' }, () => {
                setPresenceState(channel.presenceState())
            })
            .on('broadcast', { event: 'cursor-move' }, (payload) => {
                // Ignore self
                if (payload.payload.userId === userId) return

                setCursors(prev => ({
                    ...prev,
                    [payload.payload.userId]: {
                        ...payload.payload,
                        lastUpdate: Date.now()
                    }
                }))
            })
            .on('broadcast', { event: 'node-drag' }, (payload) => {
                // Ignore self
                if (payload.payload.userId === userId) return

                const { nodeId, x, y } = payload.payload
                setRemoteNodePositions(prev => ({
                    ...prev,
                    [nodeId]: { x, y }
                }))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                        email: userRef.current?.email || '',
                        color: myColor
                    })
                }
            })

        return () => {
            channelRef.current = null
            supabase.removeChannel(channel)
        }
    }, [chantierId, userId, supabase, myColor])

    // Auto-prune inactive cursors (remove ghosts older than 4 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setCursors(prev => {
                let changed = false
                const next: Record<string, CursorData> = {}
                for (const [id, c] of Object.entries(prev)) {
                    if (now - c.lastUpdate < 4000) {
                        next[id] = c
                    } else {
                        changed = true
                    }
                }
                return changed ? next : prev
            })
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // Broadcast Emitters
    // Throttled emitter for cursor - only sends if there are other users present
    const emitCursorMove = useCallback(
        throttle((x: number, y: number) => {
            const currentUser = userRef.current
            if (!channelRef.current || !currentUser) return
            // Don't flood websocket if user is alone
            if (presentUsersRef.current.length <= 1) return

            channelRef.current.send({
                type: 'broadcast',
                event: 'cursor-move',
                payload: {
                    x,
                    y,
                    userId: currentUser.id,
                    email: currentUser.email,
                    color: myColor
                }
            })
        }, 40),
        [myColor]
    )

    // Throttled emitter for node drag
    const emitNodeDrag = useCallback(
        throttle((nodeId: string, x: number, y: number) => {
            const currentUser = userRef.current
            if (!channelRef.current || !currentUser) return
            // Don't flood websocket if user is alone
            if (presentUsersRef.current.length <= 1) return

            channelRef.current.send({
                type: 'broadcast',
                event: 'node-drag',
                payload: {
                    nodeId,
                    x,
                    y,
                    userId: currentUser.id
                }
            })
        }, 30),
        []
    )

    return {
        cursors,
        remoteNodePositions,
        presentUsers,
        emitCursorMove,
        emitNodeDrag
    }
}
