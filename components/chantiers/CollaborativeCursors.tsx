'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MousePointer2 } from 'lucide-react'

// Colors for different users
const CURSOR_COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
]

type CursorData = {
    x: number
    y: number
    userId: string
    email: string
    color: string
    lastUpdate: number
}

// Throttle helper
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

export default function CollaborativeCursors({
    cursors,
    presentUsers,
    viewPos,
}: {
    cursors: Record<string, { x: number, y: number, color: string, email: string, userId: string, lastUpdate: number }>
    presentUsers: any[]
    viewPos: { x: number, y: number }
}) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[100] overflow-hidden">
            {/* AVATARS LIST (Top Right) */}
            <div className="absolute top-6 right-6 flex items-center -space-x-2 bg-black/50 p-2 rounded-full border border-white/10 backdrop-blur-md">
                {presentUsers.map((u: any, i) => (
                    <div
                        key={u.presence_ref || i}
                        className="relative h-8 w-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: u.color || '#888' }}
                        title={u.email}
                    >
                        {u.email?.[0].toUpperCase()}
                    </div>
                ))}
            </div>

            {/* CURSORS */}
            <AnimatePresence>
                {Object.values(cursors).map(cursor => (
                    <Cursor
                        key={cursor.userId}
                        cursor={cursor}
                        viewPos={viewPos}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}

function Cursor({ cursor, viewPos }: { cursor: CursorData, viewPos: { x: number, y: number } }) {
    // Convert back from Grid to Screen/Container coordinates for rendering
    // ScreenX = GridX + ViewPos.x
    const screenX = cursor.x + viewPos.x
    const screenY = cursor.y + viewPos.y

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
                x: screenX,
                y: screenY,
                opacity: 1,
                scale: 1
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                mass: 0.5
            }}
            className="absolute top-0 left-0 flex flex-col items-start pointer-events-none"
            style={{ willChange: 'transform' }}
        >
            <MousePointer2
                size={20}
                fill={cursor.color}
                color={cursor.color} // Stroke color
                className="transform -rotate-12" // Slight extra tilt if needed, Lucide icon is already tilted
            />
            <div
                className="ml-4 -mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
            >
                {cursor.email?.split('@')[0]}
            </div>
        </motion.div>
    )
}
