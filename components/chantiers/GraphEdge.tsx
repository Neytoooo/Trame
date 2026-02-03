'use client'

import { Node } from './DraggableNode'

export type Edge = {
    id: string
    source: string
    target: string
}

// Color mapping for gradients
const getNodeColor = (type?: string) => {
    switch (type) {
        case 'quote': return '#3B82F6' // Blue-500
        case 'invoice': return '#22C55E' // Green-500
        case 'setup': return '#F97316' // Orange-500
        case 'email': return '#A855F7' // Purple-500
        case 'calendar': return '#EAB308' // Yellow-500
        case 'slack': return '#EC4899' // Pink-500
        case 'trello': return '#06B6D4' // Cyan-500
        case 'empty': return '#6B7280' // Gray-500
        default: return '#9CA3AF' // Gray-400
    }
}

export default function GraphEdge({ edge, nodes }: { edge: Edge, nodes: Node[] }) {
    const startNode = nodes.find(n => n.id === edge.source)
    const endNode = nodes.find(n => n.id === edge.target)

    if (!startNode || !endNode) {
        // console.warn("⚠️ GraphEdge: Node missing for edge", edge.id, { source: edge.source, target: edge.target })
        return null
    }

    // Node Radius (approximate from DraggableNode styling: w-16 = 64px => radius 32px)
    const nodeRadius = 32

    // Centers
    const startX = startNode.position_x + nodeRadius
    const startY = startNode.position_y + nodeRadius
    const endX = endNode.position_x + nodeRadius
    const endY = endNode.position_y + nodeRadius

    // Angle from Start to End
    const angle = Math.atan2(endY - startY, endX - startX)

    // Calculate intersection points on the circumference
    const x1 = startX + Math.cos(angle) * nodeRadius
    const y1 = startY + Math.sin(angle) * nodeRadius
    const x2 = endX - Math.cos(angle) * nodeRadius
    const y2 = endY - Math.sin(angle) * nodeRadius

    const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))

    // Adjust control points
    const controlOffset = Math.max(dist * 0.3, 30)

    const cp1x = x1 + Math.cos(angle) * controlOffset
    const cp1y = y1 + Math.sin(angle) * controlOffset
    const cp2x = x2 - Math.cos(angle) * controlOffset
    const cp2y = y2 - Math.sin(angle) * controlOffset

    const dynamicPath = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`

    // Gradient ID
    const gradientId = `gradient-${edge.id}`
    const startColor = getNodeColor(startNode.action_type)

    return (
        <g>
            <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                    <stop offset="0%" stopColor={startColor} stopOpacity="1" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" /> {/* Fade to white/transparent */}
                </linearGradient>
            </defs>

            {/* Base transparent path for hit area if needed */}
            <path
                d={dynamicPath}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
            />

            {/* Dotted Bubble Line */}
            <path
                d={dynamicPath}
                stroke={`url(#${gradientId})`}
                strokeWidth="6" // Thickness of bubbles
                fill="none"
                strokeDasharray="0 15" // 0 length dash (dot), 15 gap
                strokeLinecap="round" // Makes the 0 length dash a circle
                className="opacity-80"
            />
        </g>
    )
}
