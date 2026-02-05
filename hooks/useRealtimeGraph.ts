import { useEffect, useState, useRef, useCallback } from 'react'
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

type NodeDragData = {
    nodeId: string
    x: number
    y: number
    userId: string
}

const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean
    return function (this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

export const useRealtimeGraph = (chantierId: string, user: any) => {
    const supabase = createClient()
    const [cursors, setCursors] = useState<Record<string, CursorData>>({})
    const [presenceState, setPresenceState] = useState<any>({})
    const [remoteNodePositions, setRemoteNodePositions] = useState<Record<string, { x: number, y: number }>>({})

    // Assign random color to current user
    const myColor = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]).current
    const channelRef = useRef<any>(null)

    useEffect(() => {
        if (!user) return

        const channel = supabase.channel(`tracking_${chantierId}`, {
            config: {
                presence: {
                    key: user.id,
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
                if (payload.payload.userId === user.id) return

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
                if (payload.payload.userId === user.id) return

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
                        email: user.email,
                        color: myColor
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chantierId, user, supabase])

    // Broadcast Emitters
    // Throttled emitter for cursor
    const emitCursorMove = useCallback(throttle((x: number, y: number) => {
        if (!channelRef.current || !user) return
        channelRef.current.send({
            type: 'broadcast',
            event: 'cursor-move',
            payload: {
                x,
                y,
                userId: user.id,
                email: user.email,
                color: myColor
            }
        })
    }, 30), [user])

    // Throttled emitter for node drag
    const emitNodeDrag = useCallback(throttle((nodeId: string, x: number, y: number) => {
        if (!channelRef.current || !user) return
        channelRef.current.send({
            type: 'broadcast',
            event: 'node-drag',
            payload: {
                nodeId,
                x,
                y,
                userId: user.id
            }
        })
    }, 16), [user]) // ~60fps for smoother node drag? Or stick to 30ms? 16ms is 60fps.

    // Extract present users
    const presentUsers = Object.values(presenceState).flat() as any[]

    return {
        cursors,
        remoteNodePositions,
        presentUsers,
        emitCursorMove,
        emitNodeDrag
    }
}
