'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { Plus, Check, MoreVertical, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Node = {
    id: string
    type: 'start' | 'step' | 'end'
    label: string
    status: 'pending' | 'done'
    position_x: number
    position_y: number
}

type Edge = {
    id: string
    source: string
    target: string
}

export default function SuiviGraph({ chantierId }: { chantierId: string }) {
    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])
    const [loading, setLoading] = useState(true)

    // Connection State
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            const [nodesRes, edgesRes] = await Promise.all([
                supabase.from('chantier_nodes').select('*').eq('chantier_id', chantierId),
                supabase.from('chantier_edges').select('*').eq('chantier_id', chantierId)
            ])

            if (nodesRes.data) setNodes(nodesRes.data)
            if (edgesRes.data) setEdges(edgesRes.data)
            setLoading(false)
        }
        fetchData()
    }, [chantierId, supabase])

    // Update Node Position (State Only - Realtime)
    const handleNodeDrag = (id: string, x: number, y: number) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, position_x: x, position_y: y } : n))
    }

    // Save Node Position (DB - On Drag End)
    const handleNodeDragEnd = async (id: string, x: number, y: number) => {
        // Ensure state is synced one last time
        handleNodeDrag(id, x, y)
        await supabase.from('chantier_nodes').update({ position_x: x, position_y: y }).eq('id', id)
    }

    // Add Node
    const addNode = async () => {
        const newNode = {
            chantier_id: chantierId,
            label: 'Nouvelle Étape',
            type: 'step',
            status: 'pending',
            position_x: 100 + Math.random() * 50,
            position_y: 100 + Math.random() * 50
        }

        const { data, error } = await supabase.from('chantier_nodes').insert(newNode).select().single()
        if (data) setNodes([...nodes, data])
    }

    // Toggle Status
    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'done' : 'pending'
        setNodes(prev => prev.map(n => n.id === id ? { ...n, status: newStatus as any } : n))
        await supabase.from('chantier_nodes').update({ status: newStatus }).eq('id', id)
    }

    // Connect Logic
    const startConnection = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent node drag
        setConnectingNodeId(nodeId)
        // Set initial mouse pos relative to container? 
        // We'll rely on onMouseMove updating it immediately after
    }

    const endConnection = async (targetId: string) => {
        if (!connectingNodeId || connectingNodeId === targetId) {
            setConnectingNodeId(null)
            return
        }

        // Check duplicates
        if (edges.some(e => e.source === connectingNodeId && e.target === targetId)) {
            setConnectingNodeId(null)
            return
        }

        // Create Edge
        const newEdge = {
            chantier_id: chantierId,
            source: connectingNodeId,
            target: targetId
        }

        // Optimistic
        const tempId = Math.random().toString()
        setEdges([...edges, { ...newEdge, id: tempId }])
        setConnectingNodeId(null)

        const { data } = await supabase.from('chantier_edges').insert(newEdge).select().single()
        if (data) {
            setEdges(prev => prev.map(e => e.id === tempId ? data : e))
        }
    }

    // Global Mouse Move for connecting line
    const handleMouseMove = (e: React.MouseEvent) => {
        if (connectingNodeId && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
    }

    // Calculate Progress
    const totalNodes = nodes.filter(n => n.type !== 'start').length
    const doneNodes = nodes.filter(n => n.type !== 'start' && n.status === 'done').length
    const progress = totalNodes === 0 ? 0 : Math.round((doneNodes / totalNodes) * 100)

    if (loading) return <div className="text-white">Chargement du graphe...</div>

    return (
        <div className="relative h-[80vh] w-full bg-[#0A0A0A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            {/* UI Overlay */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Avancement</span>
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-white font-bold">{progress}%</span>
                </div>
                <button
                    onClick={addNode}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Ajouter une étape
                </button>
            </div>

            {/* Canvas Area */}
            <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setConnectingNodeId(null)} // Cancel if dropped on empty space
            >

                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.4)" />
                        </marker>
                    </defs>

                    {edges.map(edge => {
                        const start = nodes.find(n => n.id === edge.source)
                        const end = nodes.find(n => n.id === edge.target)
                        if (!start || !end) return null

                        // Bezier Curve Logic
                        const x1 = start.position_x + 32
                        const y1 = start.position_y + 32
                        const x2 = end.position_x + 32
                        const y2 = end.position_y + 32
                        const dist = Math.abs(x2 - x1)
                        const controlOffset = Math.max(dist * 0.5, 50)
                        const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`

                        return (
                            <path
                                key={edge.id}
                                d={path}
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        )
                    })}

                    {/* Temporary Connection Line */}
                    {connectingNodeId && (() => {
                        const start = nodes.find(n => n.id === connectingNodeId)
                        if (!start) return null
                        return (
                            <line
                                x1={start.position_x + 32}
                                y1={start.position_y + 32}
                                x2={mousePos.x}
                                y2={mousePos.y}
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                className="animate-pulse"
                            />
                        )
                    })()}
                </svg>

                {/* Nodes */}
                {nodes.map((node) => (
                    <DraggableNode
                        key={node.id}
                        node={node}
                        containerRef={containerRef}
                        onDrag={(x, y) => handleNodeDrag(node.id, x, y)}
                        onDragEnd={(x, y) => handleNodeDragEnd(node.id, x, y)}
                        onToggle={() => toggleStatus(node.id, node.status)}
                        onConnectStart={(e) => startConnection(node.id, e)}
                        onConnectEnd={() => endConnection(node.id)}
                    />
                ))}

            </div>
        </div>
    )
}

function DraggableNode({ node, containerRef, onDrag, onDragEnd, onToggle, onConnectStart, onConnectEnd }: {
    node: Node,
    containerRef: React.RefObject<HTMLDivElement>,
    onDrag: (x: number, y: number) => void
    onDragEnd: (x: number, y: number) => void
    onToggle: () => void
    onConnectStart: (e: React.MouseEvent) => void
    onConnectEnd: () => void
}) {
    // We need to track the initial position when drag starts to calculate relative deltas
    const startPos = useRef({ x: 0, y: 0 })

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ x: node.position_x, y: node.position_y }}
            // We control position via state updates passed back to parent, 
            // but we also need framer to behave. 
            // Using `animate` with high frequency updates can be jittery, 
            // usually `style={{ x, y }}` with MotionValues is best. 
            // But let's try direct state update first.
            animate={{ x: node.position_x, y: node.position_y }}
            transition={{ duration: 0 }} // Instant update for drag

            onDragStart={() => {
                startPos.current = { x: node.position_x, y: node.position_y }
            }}
            onDrag={(_, info) => {
                const newX = startPos.current.x + info.offset.x
                const newY = startPos.current.y + info.offset.y
                onDrag(newX, newY)
            }}
            onDragEnd={(_, info) => {
                const newX = startPos.current.x + info.offset.x
                const newY = startPos.current.y + info.offset.y
                onDragEnd(newX, newY)
            }}

            onMouseUp={onConnectEnd}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            className={`absolute flex flex-col items-center justify-center gap-2 group z-20`}
        >
            {/* Bubble */}
            <div
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 transition-colors relative
                    ${node.status === 'done'
                        ? 'bg-green-500 border-green-400 text-white shadow-green-500/30'
                        : 'bg-[#1A1A1A] border-white/20 text-gray-400 hover:border-white/40'
                    }
                `}
                onClick={onToggle}
            >
                {node.status === 'done' ? <Check size={32} /> : <div className="w-3 h-3 rounded-full bg-white/20" />}

                {/* Connection Handle (Right) */}
                <div
                    onMouseDown={onConnectStart}
                    className="absolute -right-3 w-6 h-6 rounded-full bg-blue-500 border-2 border-[#0A0A0A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-125"
                >
                    <div className="w-2 h-2 bg-white rounded-full" />
                </div>
            </div>

            {/* Label */}
            <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 text-xs font-medium text-white max-w-[120px] truncate text-center">
                {node.label}
            </div>
        </motion.div>
    )
}
