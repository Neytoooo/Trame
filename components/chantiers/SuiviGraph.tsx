'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Link as LinkIcon, Terminal } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import DraggableNode, { Node } from './DraggableNode'
import GraphEdge, { Edge } from './GraphEdge'
import NodeSelectionModal from './NodeSelectionModal'
import NodeDataModal from './NodeDataModal'
import LogsModal from './LogsModal'

export default function SuiviGraph({ chantierId }: { chantierId: string }) {
    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])
    const [loading, setLoading] = useState(true)

    // Data Modal State
    const [dataModalNode, setDataModalNode] = useState<Node | null>(null)
    const [isLogsOpen, setIsLogsOpen] = useState(false)

    // Connection State
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Delete Mode State
    const [isDeleteMode, setIsDeleteMode] = useState(false)

    // Link Mode State
    const [isLinkMode, setIsLinkMode] = useState(false)
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Panning State
    const [viewPos, setViewPos] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const lastPanPos = useRef({ x: 0, y: 0 })

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
    // IMPORTANT: x and y here are relative to the Container (which is moved by viewPos)
    // Framer motion drag returns position relative to parent.
    // If parent is the panned layer, then x,y should be correct relative to that layer's origin.
    const handleNodeDragEnd = async (id: string, x: number, y: number) => {
        // Ensure state is synced one last time
        handleNodeDrag(id, x, y)
        await supabase.from('chantier_nodes').update({ position_x: x, position_y: y }).eq('id', id)
    }

    // Open Modal instead of direct add
    const handleAddClick = () => {
        setIsModalOpen(true)
    }

    // Function called when user selects a type in the modal
    const handleNodeSelect = async (type: string, label: string) => {
        setIsModalOpen(false)

        // Center new node on current view
        let x = 100
        let y = 100

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const centerX = rect.width / 2
            const centerY = rect.height / 2
            x = centerX - viewPos.x
            y = centerY - viewPos.y
        }

        const newNode = {
            chantier_id: chantierId,
            label: label,
            type: 'step',
            action_type: type, // Store the specific action type
            status: 'pending',
            position_x: x, // Centered
            position_y: y
        }

        const { data, error } = await supabase.from('chantier_nodes').insert(newNode).select().single()
        if (data) setNodes([...nodes, data])
    }

    // Delete Node
    const deleteNode = async (id: string) => {
        // Optimistic update
        setNodes(prev => prev.filter(n => n.id !== id))
        setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))

        await supabase.from('chantier_edges').delete().or(`source.eq.${id},target.eq.${id}`)
        await supabase.from('chantier_nodes').delete().eq('id', id)
    }

    // Update Node Label
    const updateNodeLabel = async (id: string, newLabel: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, label: newLabel } : n))
        await supabase.from('chantier_nodes').update({ label: newLabel }).eq('id', id)
    }

    // Toggle Status
    const toggleStatus = async (id: string, currentStatus: string) => {
        // Find Play Node
        const playNode = nodes.find(n => n.action_type === 'play')
        const targetNode = nodes.find(n => n.id === id)

        // Block if Play Node exists, is not done, and we are trying to validate another node
        if (playNode && playNode.status !== 'done' && targetNode?.action_type !== 'play') {
            alert("⚠️ Veuillez lancer le chantier (étape 'Lancement') avant de valider d'autres étapes.")
            return
        }

        const newStatus = currentStatus === 'pending' ? 'done' : 'pending'
        setNodes(prev => prev.map(n => n.id === id ? { ...n, status: newStatus as any } : n))
        await supabase.from('chantier_nodes').update({ status: newStatus }).eq('id', id)

        // Trigger Automation if validated
        if (newStatus === 'done') {
            const { triggerNodeAutomation } = await import('@/app/actions/triggerNodeAutomation')
            triggerNodeAutomation(id, chantierId).then(res => {
                if (res.success && res.message !== "Aucune suite") {
                    window.location.reload()
                    alert("✅ " + res.message)
                }
            })
        }
    }

    // Connect Logic (Original Drag)
    const startConnection = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent node drag
        setConnectingNodeId(nodeId)
    }

    // Helper to create edge
    const createEdge = async (sourceId: string, targetId: string) => {
        console.log("🛠️ createEdge called", { sourceId, targetId })
        // Check duplicates
        if (edges.some(e => e.source === sourceId && e.target === targetId)) {
            console.warn("⚠️ Duplicate edge detected")
            return
        }
        if (sourceId === targetId) {
            console.warn("⚠️ Self-loop detected")
            return
        }

        const newEdge = {
            chantier_id: chantierId,
            source: sourceId,
            target: targetId
        }

        const tempId = Math.random().toString()
        console.log("➕ Optimistic Add:", tempId)
        setEdges(prev => [...prev, { ...newEdge, id: tempId }])

        const { data, error } = await supabase.from('chantier_edges').insert(newEdge).select().single()

        if (error) {
            console.error("❌ DB Insert Error:", error)
            // Rollback? For now let's just see the error.
        }

        if (data) {
            console.log("✅ DB Insert Success:", data)
            setEdges(prev => prev.map(e => e.id === tempId ? data : e))
        }
    }

    const endConnection = async (targetId: string) => {
        if (!connectingNodeId || connectingNodeId === targetId) {
            setConnectingNodeId(null)
            return
        }
        await createEdge(connectingNodeId, targetId)
        setConnectingNodeId(null)
    }

    // Manual Link Mode Click Logic
    const handleNodeLinkClick = async (id: string) => {
        console.log("📍 Node Clicked:", id, " | Mode Lien:", isLinkMode, " | Source:", linkSourceId)
        if (!linkSourceId) {
            // Select Source
            console.log("👉 Selection Source:", id)
            setLinkSourceId(id)
        } else {
            // Select Target -> Create Link
            console.log("🔗 Tentative de liaison vers:", id)
            if (id !== linkSourceId) {
                console.log("✅ Création du lien...")
                await createEdge(linkSourceId, id)
                setLinkSourceId(null)
            } else {
                console.log("❌ Annulé: Source == Cible")
                setLinkSourceId(null)
            }
        }
    }

    // Global Mouse Move for connecting line AND Panning
    const handleMouseMove = (e: React.MouseEvent) => {
        // Panning Logic
        if (isPanning) {
            const dx = e.clientX - lastPanPos.current.x
            const dy = e.clientY - lastPanPos.current.y
            setViewPos(prev => ({ x: prev.x + dx, y: prev.y + dy }))
            lastPanPos.current = { x: e.clientX, y: e.clientY }
        }

        // Connection Line Logic
        if (connectingNodeId && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const rawX = e.clientX - rect.left
            const rawY = e.clientY - rect.top

            setMousePos({
                x: rawX - viewPos.x,
                y: rawY - viewPos.y
            })
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        // Start Panning if on background (and not delete mode)
        if (!isDeleteMode && !isLinkMode && e.button === 0) { // Left click
            setIsPanning(true)
            lastPanPos.current = { x: e.clientX, y: e.clientY }
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        setConnectingNodeId(null) // Cancel connection if dropped on empty space
    }

    const handleMouseLeave = () => {
        setIsPanning(false)
        setConnectingNodeId(null)
    }

    // Open Data Modal
    const handleEditData = (node: Node) => {
        setDataModalNode(node)
    }

    // Save Node Data
    const handleNodeDataSave = async (id: string, data: any) => {
        // Optimistic
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data } : n))
        // DB
        await supabase.from('chantier_nodes').update({ data }).eq('id', id)
    }

    // Toggle Link Mode
    const toggleLinkMode = () => {
        setIsLinkMode(!isLinkMode)
        setIsDeleteMode(false) // Exclusive modes
        setLinkSourceId(null)
    }

    const toggleDeleteMode = () => {
        setIsDeleteMode(!isDeleteMode)
        setIsLinkMode(false) // Exclusive modes
    }


    // Calculate Progress
    const totalNodes = nodes.filter(n => n.type !== 'start').length
    const doneNodes = nodes.filter(n => n.type !== 'start' && n.status === 'done').length
    const progress = totalNodes === 0 ? 0 : Math.round((doneNodes / totalNodes) * 100)

    if (loading) return <div className="text-white">Chargement du graphe...</div>

    return (
        <div className="relative h-[80vh] w-full bg-[#0A0A0A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Grid Background - Moves with Pan */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-75 ease-out"
                style={{
                    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: `${viewPos.x}px ${viewPos.y}px`
                }}
            />

            {/* UI Overlay (Fixed) */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 pointer-events-none">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 pointer-events-auto">
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Avancement</span>
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-white font-bold">{progress}%</span>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={toggleDeleteMode}
                        className={`
                            flex items-center justify-center p-3 rounded-xl transition-all shadow-lg active:scale-95
                            ${isDeleteMode
                                ? 'bg-red-500 text-white shadow-red-500/20 rotate-12'
                                : 'bg-white/10 hover:bg-white/20 text-white shadow-black/20'
                            }
                        `}
                        title={isDeleteMode ? "Quitter le mode suppression" : "Mode suppression"}
                    >
                        <Trash2 size={20} />
                    </button>

                    <button
                        onClick={toggleLinkMode}
                        className={`
                            flex items-center justify-center p-3 rounded-xl transition-all shadow-lg active:scale-95
                            ${isLinkMode
                                ? 'bg-blue-500 text-white shadow-blue-500/20'
                                : 'bg-white/10 hover:bg-white/20 text-white shadow-black/20'
                            }
                        `}
                        title={isLinkMode ? "Quitter le mode lien" : "Mode lien manuel"}
                    >
                        <LinkIcon size={20} />
                    </button>

                    <button
                        onClick={handleAddClick}
                        disabled={isDeleteMode || isLinkMode}
                        className={`
                            flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95
                            ${isDeleteMode || isLinkMode ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                        `}
                    >
                        <Plus size={18} />
                        Ajouter une étape
                    </button>

                    <button
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all ml-2"
                    >
                        Recentrer
                    </button>

                    <button
                        onClick={() => setIsLogsOpen(true)}
                        className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-3 py-2 rounded-xl ml-2 transition-all active:scale-95"
                        title="Voir les logs d'automatisation"
                    >
                        <Terminal size={20} />
                    </button>
                </div>
            </div>

            {/* Mode Indicators */}
            {isDeleteMode && (
                <div className="absolute top-20 left-6 z-50 bg-red-500/20 border border-red-500/50 text-red-100 px-3 py-1 rounded-lg text-xs font-medium animate-pulse backdrop-blur-sm pointer-events-none">
                    Mode Suppression : Cliquez sur une étape pour la supprimer
                </div>
            )}
            {isLinkMode && (
                <div className="absolute top-20 left-6 z-50 bg-blue-500/20 border border-blue-500/50 text-blue-100 px-3 py-1 rounded-lg text-xs font-medium animate-pulse backdrop-blur-sm pointer-events-none">
                    {!linkSourceId
                        ? "Mode Lien : Sélectionnez l'étape de départ"
                        : "Mode Lien : Sélectionnez l'étape d'arrivée"
                    }
                </div>
            )}

            {/* Canvas Area (Interactive Wrapper) */}
            <div
                className={`absolute inset-0 z-0 ${isDeleteMode ? 'cursor-not-allowed' : (isLinkMode ? 'cursor-crosshair' : (isPanning ? 'cursor-grabbing' : 'cursor-grab'))}`}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {/* Transform Layer */}
                <div
                    className="absolute top-0 left-0 w-full h-full transform-gpu transition-transform duration-75 ease-out origin-top-left"
                    style={{ transform: `translate(${viewPos.x}px, ${viewPos.y}px)` }}
                >

                    {/* SVG Connections Layer */}
                    <svg className="absolute top-0 left-0 w-[20000px] h-[20000px] pointer-events-none overflow-visible">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.4)" />
                            </marker>
                        </defs>

                        {edges.map(edge => (
                            <GraphEdge key={edge.id} edge={edge} nodes={nodes} />
                        ))}

                        {/* Temporary Connection Line (Drag) */}
                        {connectingNodeId && (() => {
                            const start = nodes.find(n => n.id === connectingNodeId)
                            if (!start) return null

                            const nodeRadius = 32
                            const startXCenter = start.position_x + nodeRadius
                            const startYCenter = start.position_y + nodeRadius

                            const angle = Math.atan2(mousePos.y - startYCenter, mousePos.x - startXCenter)
                            const startX = startXCenter + Math.cos(angle) * nodeRadius
                            const startY = startYCenter + Math.sin(angle) * nodeRadius

                            return (
                                <line
                                    x1={startX}
                                    y1={startY}
                                    x2={mousePos.x}
                                    y2={mousePos.y}
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    className="animate-pulse"
                                />
                            )
                        })()}

                        {/* Temporary Connection Line (Link Mode - Source Selected) */}
                        {isLinkMode && linkSourceId && (() => {
                            // Can show a line to the mouse cursor?
                            // We have access to mousePos IF we track it globally in link mode.
                            // Currently handleMouseMove tracks mousePos only if connectingNodeId.
                            // Let's enable checking mousePos generally if we want this visual.
                            // For now, highlighting the source is enough.
                            return null
                        })()}
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <DraggableNode
                            key={node.id}
                            node={node}
                            containerRef={null as any}
                            onDrag={(x, y) => handleNodeDrag(node.id, x, y)}
                            onDragEnd={(x, y) => handleNodeDragEnd(node.id, x, y)}
                            onToggle={() => toggleStatus(node.id, node.status)}
                            onConnectStart={(e) => startConnection(node.id, e)}
                            onConnectEnd={() => endConnection(node.id)}
                            onRename={(newLabel) => updateNodeLabel(node.id, newLabel)}
                            isDeleteMode={isDeleteMode}
                            onDelete={() => deleteNode(node.id)}
                            isLinkMode={isLinkMode}
                            isSource={linkSourceId === node.id}
                            onLinkClick={() => handleNodeLinkClick(node.id)}
                            onEditData={() => handleEditData(node)}
                        />
                    ))}
                </div>

            </div>

            {/* Step Selection Modal */}
            <NodeSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleNodeSelect}
            />

            {/* Data Configuration Modal */}
            <NodeDataModal
                isOpen={!!dataModalNode}
                onClose={() => setDataModalNode(null)}
                node={dataModalNode}
                onSave={handleNodeDataSave}
            />

            {/* Logs Modal */}
            <LogsModal
                isOpen={isLogsOpen}
                onClose={() => setIsLogsOpen(false)}
                chantierId={chantierId}
            />
        </div>
    )
}
