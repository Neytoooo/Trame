'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import DraggableNode, { Node } from './DraggableNode'
import GraphEdge, { Edge } from './GraphEdge'
import NodeSelectionModal from './NodeSelectionModal'
import NodeDataModal from './NodeDataModal'
import LogsModal from './LogsModal'
import GraphOverlay from './GraphOverlay'
import GraphToolbar from './GraphToolbar'
import GraphBackground from './GraphBackground'
import SaveTemplateModal from './SaveTemplateModal'
import TemplateListModal from './TemplateListModal'
import NewNodeQuoteModal from './NewNodeQuoteModal'
import CollaborativeCursors from './CollaborativeCursors'
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph'

export default function SuiviGraph({ chantierId, user }: { chantierId: string, user: any }) {
    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])
    const [loading, setLoading] = useState(true)

    // Real-Time Hook
    const { cursors, presentUsers, remoteNodePositions, emitCursorMove, emitNodeDrag } = useRealtimeGraph(chantierId, user)

    // Local Drag State (Ephemeral, prevents thrashing main state)
    const [draggingNode, setDraggingNode] = useState<{ id: string, x: number, y: number } | null>(null)

    // Helper: Get display position (merged local drag + remote drag + committed state)
    const getNodePosition = (node: Node) => {
        // 1. Local Drag (Highest Priority for current user)
        if (draggingNode && draggingNode.id === node.id) {
            return { x: draggingNode.x, y: draggingNode.y }
        }
        // 2. Remote Drag (Broadcasted from others)
        const remote = remoteNodePositions[node.id]
        if (remote) return remote

        // 3. Committed State (DB)
        return { x: node.position_x, y: node.position_y }
    }

    // Derived state for Edges: They need the "Visible" positions to update in realtime
    const visibleNodes = nodes.map(node => {
        const pos = getNodePosition(node)
        return { ...node, position_x: pos.x, position_y: pos.y }
    })

    // ... (rest of code) ...

    {
        edges.map(edge => (
            <GraphEdge key={edge.id} edge={edge} nodes={visibleNodes} />
        ))
    }

    // Data Modal State
    const [dataModalNode, setDataModalNode] = useState<Node | null>(null)
    const [isLogsOpen, setIsLogsOpen] = useState(false)
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false)
    const [isLoadTemplateOpen, setIsLoadTemplateOpen] = useState(false)

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

            if (nodesRes.data) setNodes(nodesRes.data as unknown as Node[])
            if (edgesRes.data) setEdges(edgesRes.data)
            setLoading(false)
        }
        fetchData()
    }, [chantierId, supabase])

    // Subscription Realtime (DB Changes only - Cursors/Nodes handled by hook)
    useEffect(() => {
        const channel = supabase
            .channel(`realtime_chantier_db_${chantierId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chantier_nodes',
                    filter: `chantier_id=eq.${chantierId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNodes((prev) => {
                            if (prev.find(n => n.id === payload.new.id)) return prev
                            return [...prev, payload.new as Node]
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        setNodes((prev) => prev.map((n) => (n.id === payload.new.id ? (payload.new as Node) : n)))
                    } else if (payload.eventType === 'DELETE') {
                        setNodes((prev) => prev.filter((n) => n.id !== payload.old.id))
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chantier_edges',
                    filter: `chantier_id=eq.${chantierId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setEdges((prev) => {
                            if (prev.find(e => e.id === payload.new.id)) return prev
                            return [...prev, payload.new as Edge]
                        })
                    } else if (payload.eventType === 'DELETE') {
                        setEdges((prev) => prev.filter((e) => e.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chantierId, supabase])

    // Update Node Position (State Only - Realtime)
    const handleNodeDrag = (id: string, x: number, y: number) => {
        // Use ephemeral state for smooth updates
        setDraggingNode({ id, x, y })
        // Broadcast drag
        emitNodeDrag(id, x, y)
    }

    // Save Node Position (DB - On Drag End)
    // IMPORTANT: x and y here are relative to the Container (which is moved by viewPos)
    // Framer motion drag returns position relative to parent.
    // If parent is the panned layer, then x,y should be correct relative to that layer's origin.
    const handleNodeDragEnd = async (id: string, x: number, y: number) => {
        // Clear ephemeral state
        setDraggingNode(null)

        // Commit state locally
        setNodes(prev => prev.map(n => n.id === id ? { ...n, position_x: x, position_y: y } : n))

        // Commit to DB
        await supabase.from('chantier_nodes').update({ position_x: x, position_y: y }).eq('id', id)
    }

    // Quote Modal State
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [pendingNodeLabel, setPendingNodeLabel] = useState("")

    // Open Modal instead of direct add
    const handleAddClick = () => {
        setIsModalOpen(true)
    }

    // Function called when user selects a type in the modal
    const handleNodeSelect = async (type: string, label: string) => {
        setIsModalOpen(false)

        // SPECIAL CASE: Linked Quote
        if (type === 'quote') {
            setPendingNodeLabel(label)
            setIsQuoteModalOpen(true)
            return
        }

        await createNode(type, label)
    }

    const handleQuoteCreated = async (quoteId: string, quoteTitle: string) => {
        // Create the node linked to this quote
        // We store the quote ID in 'data'
        await createNode('quote', quoteTitle || "Devis", { devis_id: quoteId })
        setIsQuoteModalOpen(false)
    }

    const createNode = async (type: string, label: string, extraData: any = {}) => {
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
            position_y: y,
            data: extraData // Link to Quote or other data
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

    const [processingNodeId, setProcessingNodeId] = useState<string | null>(null)

    // Toggle Status
    const toggleStatus = async (id: string, currentStatus: string) => {
        if (processingNodeId) return // Prevent double clicks

        const targetNode = nodes.find(n => n.id === id)
        if (!targetNode) return

        // 1. Check "Play" Node Dependency (Global Lock)
        const playNode = nodes.find(n => n.action_type === 'play')

        // If we are toggling the Play node OFF -> Reset EVERYTHING
        if (targetNode.action_type === 'play' && currentStatus === 'done') {
            if (!confirm("⚠️ Désactiver le lancement va réinitialiser toutes les étapes. Continuer ?")) return

            setProcessingNodeId(id)
            setNodes(prev => prev.map(n => ({ ...n, status: 'pending' }))) // Reset all locally

            // DB Reset all
            await supabase.from('chantier_nodes').update({ status: 'pending' }).eq('chantier_id', chantierId)

            setProcessingNodeId(null)
            return
        }

        // If we are trying to validate a normal node, check if Play is active
        if (playNode && playNode.status !== 'done' && targetNode.action_type !== 'play') {
            alert("⚠️ Veuillez lancer le chantier (étape 'Lancement') avant de valider d'autres étapes.")
            return
        }

        // 2. Sequential Validation Check (Dependencies)
        // Find all incoming edges to this node
        const incomingEdges = edges.filter(e => e.target === id)
        const parentIds = incomingEdges.map(e => e.source)

        // Check if all parents are done
        const parentsNotDone = nodes.filter(n => parentIds.includes(n.id) && n.status !== 'done')

        if (parentsNotDone.length > 0 && currentStatus === 'pending') {
            alert("⚠️ Vous devez valider l'étape précédente avant de passer à celle-ci.")
            return
        }

        // 3. Proceed with Toggle
        setProcessingNodeId(id)
        const newStatus = currentStatus === 'pending' ? 'done' : 'pending'

        // Optimistic Update
        setNodes(prev => prev.map(n => n.id === id ? { ...n, status: newStatus as any } : n))

        await supabase.from('chantier_nodes').update({ status: newStatus }).eq('id', id)

        // Trigger GLOBAL INTEGRITY CHECK (New Engine)
        if (newStatus === 'done' || newStatus === 'pending') {
            console.log(`🚀 [WORKFLOW ENGINE] Checking integrity after update on "${targetNode.label}"...`)
            const { checkWorkflowIntegrity } = await import('@/app/actions/workflowEngine')
            checkWorkflowIntegrity(chantierId).then(res => {
                console.log(`✅ [ENGINE RESULT]`, res)
                if (res.success && res.updates && res.updates.length > 0) {
                    // Refresh local state if server updated nodes (Anti-flicker or just trust Realtime?)
                    // Ideally Realtime handles it, but we can fast-apply updates
                    // For now, trust Realtime/Optimistic
                    console.log(`🔄 [ENGINE] Updates applied:`, res.updates.length)
                }
            }).catch(err => {
                console.error(`❌ [ENGINE ERROR]`, err)
            })
        }

        setProcessingNodeId(null)
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
        // Broadcast mouse move
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const gridX = e.clientX - rect.left - viewPos.x
            const gridY = e.clientY - rect.top - viewPos.y
            emitCursorMove(gridX, gridY)
        }

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
            {/* Collaborative Cursors (UI Only) */}
            <CollaborativeCursors
                cursors={cursors}
                presentUsers={presentUsers}
                viewPos={viewPos}
            />

            {/* Grid Background - Moves with Pan */}
            <GraphBackground viewPos={viewPos} />

            {/* UI Overlay (Fixed) */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 pointer-events-none">
                <GraphOverlay progress={progress} />

                {/* Actions Toolbar */}
                <GraphToolbar
                    isDeleteMode={isDeleteMode}
                    toggleDeleteMode={toggleDeleteMode}
                    isLinkMode={isLinkMode}
                    toggleLinkMode={toggleLinkMode}
                    onAddClick={handleAddClick}
                    onCenterClick={() => setViewPos({ x: 0, y: 0 })}
                    onLogsClick={() => setIsLogsOpen(true)}
                    onSaveTemplateClick={() => setIsSaveTemplateOpen(true)}
                    onLoadTemplateClick={() => setIsLoadTemplateOpen(true)}
                />
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
                            <GraphEdge key={edge.id} edge={edge} nodes={visibleNodes} />
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
                    {nodes.map((node) => {
                        // Calculate if this node is the "Next" one to be validated
                        const incomingEdges = edges.filter(e => e.target === node.id)
                        const parentIds = incomingEdges.map(e => e.source)
                        const parents = nodes.filter(n => parentIds.includes(n.id))
                        const allParentsDone = parents.every(p => p.status === 'done')

                        const playNode = nodes.find(n => n.action_type === 'play')
                        const isPlayDone = playNode ? playNode.status === 'done' : false
                        const isPlayNode = node.action_type === 'play'

                        // Condition for "Next":
                        // 1. It must be Pending
                        // 2. All parents must be Done (Sequential)
                        // 3. If it's NOT the Play node, the Play node must be Done (Global Lock)
                        // 4. (Implicit) If it IS the Play node, it depends only on parents (usually none)
                        const isNext = node.status === 'pending' && allParentsDone && (isPlayNode || isPlayDone)

                        const displayPos = getNodePosition(node)

                        return (
                            <DraggableNode
                                key={node.id}
                                node={{ ...node, position_x: displayPos.x, position_y: displayPos.y }}
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
                                isProcessing={processingNodeId === node.id}
                                isNext={isNext}
                            />
                        )
                    })}
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

            {/* Template Modals */}
            <SaveTemplateModal
                isOpen={isSaveTemplateOpen}
                onClose={() => setIsSaveTemplateOpen(false)}
                nodes={nodes}
                edges={edges}
            />

            <TemplateListModal
                isOpen={isLoadTemplateOpen}
                onClose={() => setIsLoadTemplateOpen(false)}
                chantierId={chantierId}
            />

            {/* NEW: Linked Quote Creation Modal */}
            <NewNodeQuoteModal
                isOpen={isQuoteModalOpen}
                onClose={() => setIsQuoteModalOpen(false)}
                chantierId={chantierId}
                onQuoteCreated={handleQuoteCreated}
            />
        </div>
    )
}
