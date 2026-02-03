'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { Check, Trash2, FileText, Receipt, HardHat, Mail, CircleDashed, Calendar, MessageSquare, Layout, Play, Settings, Package, ClipboardCheck, Camera, MapPin, Palette, Sparkles } from 'lucide-react'

export type Node = {
    id: string
    type: 'start' | 'step' | 'end'
    action_type?: string // 'quote', 'invoice', 'setup', 'email', 'general', 'empty', 'calendar', 'slack', 'trello'
    label: string
    status: 'pending' | 'done'
    position_x: number
    position_y: number
    data?: any
}

type DraggableNodeProps = {
    node: Node
    containerRef: React.RefObject<HTMLDivElement>
    onDrag: (x: number, y: number) => void
    onDragEnd: (x: number, y: number) => void
    onToggle: () => void
    onConnectStart: (e: React.MouseEvent) => void
    onConnectEnd: () => void
    onRename: (label: string) => void
    isDeleteMode: boolean
    onDelete: () => void
    isLinkMode: boolean
    isSource: boolean
    onLinkClick: () => void
    onEditData: () => void
    isProcessing?: boolean
    isNext?: boolean
}

export default function DraggableNode({ node, containerRef, onDrag, onDragEnd, onToggle, onConnectStart, onConnectEnd, onRename, isDeleteMode, onDelete, isLinkMode, isSource, onLinkClick, onEditData, isProcessing, isNext }: DraggableNodeProps) {
    const startPos = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const [isEditing, setIsEditing] = useState(false)
    const [labelText, setLabelText] = useState(node.label)
    const inputRef = useRef<HTMLInputElement>(null)
    const dragControls = useDragControls()

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSaveLabel = () => {
        setIsEditing(false)
        if (labelText.trim() !== node.label) {
            onRename(labelText)
        }
    }

    // Determine Style based on action_type
    const getStyle = () => {
        if (isDeleteMode) return {
            bg: 'bg-red-500/20',
            border: 'border-red-500',
            text: 'text-red-500',
            shadow: 'shadow-red-500/20'
        }

        if (isSource) return {
            bg: 'bg-blue-500/20',
            border: 'border-blue-400',
            text: 'text-blue-400',
            shadow: 'shadow-blue-500/40 animate-pulse'
        }

        // Keep color "Done" ? Or keep original color and use Badge?
        // User asked for "green check bubble".
        // Usually it's nice if the node also lights up.
        // Let's keep the node "lighting up" to green if needed, OR keep the request strict: "petite coche vert une bulle qui apparait".
        // If we only show the bubble, the node should probably keep its type color?
        // Let's try to KEEP the type color but maybe add a green glow?
        // Actually line 73 in original code overrides style to green if done.
        // Let's REMOVE this override so the node keeps its type identity (Quote, Invoice etc.)
        // and relies on the badge for status.

        // if (node.status === 'done') return { ... }  <-- REMOVED

        switch (node.action_type) {
            case 'quote': return { bg: 'bg-[#1A1A1A]', border: 'border-blue-500', text: 'text-blue-500', shadow: 'shadow-blue-500/20' }
            case 'invoice': return { bg: 'bg-[#1A1A1A]', border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/20' }
            case 'setup': return { bg: 'bg-[#1A1A1A]', border: 'border-orange-500', text: 'text-orange-500', shadow: 'shadow-orange-500/20' }
            case 'email': return { bg: 'bg-[#1A1A1A]', border: 'border-purple-500', text: 'text-purple-500', shadow: 'shadow-purple-500/20' }
            case 'play': return { bg: 'bg-[#1A1A1A]', border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/20' }
            case 'empty': return { bg: 'bg-[#0A0A0A]', border: 'border-gray-600 border-dashed', text: 'text-gray-500', shadow: 'shadow-none' }
            case 'calendar': return { bg: 'bg-[#1A1A1A]', border: 'border-yellow-500', text: 'text-yellow-500', shadow: 'shadow-yellow-500/20' }
            case 'slack': return { bg: 'bg-[#1A1A1A]', border: 'border-pink-500', text: 'text-pink-500', shadow: 'shadow-pink-500/20' }
            case 'trello': return { bg: 'bg-[#1A1A1A]', border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/20' }

            case 'site_visit': return { bg: 'bg-[#1A1A1A]', border: 'border-lime-500', text: 'text-lime-500', shadow: 'shadow-lime-500/20' }
            case 'client_choice': return { bg: 'bg-[#1A1A1A]', border: 'border-pink-600', text: 'text-pink-600', shadow: 'shadow-pink-600/20' }
            case 'cleaning': return { bg: 'bg-[#1A1A1A]', border: 'border-cyan-400', text: 'text-cyan-400', shadow: 'shadow-cyan-400/20' }
            case 'material_order': return { bg: 'bg-[#1A1A1A]', border: 'border-indigo-500', text: 'text-indigo-500', shadow: 'shadow-indigo-500/20' }
            case 'reception_report': return { bg: 'bg-[#1A1A1A]', border: 'border-teal-500', text: 'text-teal-500', shadow: 'shadow-teal-500/20' }
            case 'photo_report': return { bg: 'bg-[#1A1A1A]', border: 'border-rose-500', text: 'text-rose-500', shadow: 'shadow-rose-500/20' }

            default: return { bg: 'bg-[#1A1A1A]', border: 'border-white/20', text: 'text-gray-400', shadow: 'shadow-white/5' }
        }
    }

    const getIcon = () => {
        if (isDeleteMode) return <Trash2 size={24} />
        // if (node.status === 'done') return <Check size={32} /> <-- REMOVED

        switch (node.action_type) {
            case 'quote': return <FileText size={24} />
            case 'invoice': return <Receipt size={24} />
            case 'setup': return <HardHat size={24} />
            case 'email': return <Mail size={24} />
            case 'play': return <Play size={24} />
            case 'empty': return <CircleDashed size={24} />
            case 'calendar': return <Calendar size={24} />
            case 'slack': return <MessageSquare size={24} />
            case 'trello': return <Layout size={24} />

            case 'site_visit': return <MapPin size={24} />
            case 'client_choice': return <Palette size={24} />
            case 'cleaning': return <Sparkles size={24} />
            case 'material_order': return <Package size={24} />
            case 'reception_report': return <ClipboardCheck size={24} />
            case 'photo_report': return <Camera size={24} />

            default: return <Settings size={24} />
        }
    }

    const style = getStyle()
    const canDrag = !isDeleteMode && !isLinkMode

    return (
        <motion.div
            drag={canDrag}
            dragListener={canDrag}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ x: node.position_x, y: node.position_y }}
            animate={{ x: node.position_x, y: node.position_y }}
            transition={{ duration: 0 }} // Instant update for drag

            onDragStart={() => {
                isDragging.current = true
                startPos.current = { x: node.position_x, y: node.position_y }
            }}
            onDrag={(_, info) => {
                const newX = startPos.current.x + info.offset.x
                const newY = startPos.current.y + info.offset.y
                onDrag(newX, newY)
            }}
            onDragEnd={(_, info) => {
                setTimeout(() => { isDragging.current = false }, 100)
                const newX = startPos.current.x + info.offset.x
                const newY = startPos.current.y + info.offset.y
                onDragEnd(newX, newY)
            }}
            onMouseUp={onConnectEnd}
            // Increase hitbox for detection but not for drag
            className={`absolute flex flex-col items-center justify-center gap-2 group z-20 w-40 h-40 -ml-12 -mt-12 ${isLinkMode || isDeleteMode ? 'cursor-pointer' : ''}`}
        >
            {/* Bubble */}
            <div
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-300 relative z-10
                    ${style.bg} ${style.border} ${style.text} ${style.shadow}
                    ${isDeleteMode ? 'hover:bg-red-500 hover:text-white hover:border-red-500 animate-pulse' : ''}
                    ${isLinkMode && !isSource ? 'hover:scale-110 hover:border-blue-400' : ''}
                    ${canDrag ? 'hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing' : ''}
                `}
                onPointerDown={(e) => {
                    e.stopPropagation() // Prevent background pan for pointer events
                    if (canDrag) dragControls.start(e)
                }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent background pan for mouse events
                onClick={(e) => {
                    e.stopPropagation()
                    if (isDeleteMode) {
                        onDelete()
                    } else if (isLinkMode) {
                        onLinkClick()
                    } else if (!isDragging.current && !isEditing) {
                        onToggle()
                    }
                }}
            >
                {getIcon()}

                {/* Status Badge (Bottom Right) */}
                {(node.status === 'done' || isProcessing || isNext) && (
                    <div className="absolute -bottom-1 -right-1 z-20">
                        {isProcessing || isNext ? (
                            <div className="flex items-center justify-center w-8 h-8">
                                <div className="w-5 h-5 rounded-full bg-orange-500 animate-[pulse-orange_1.5s_infinite_ease-in-out]">
                                    <style jsx global>{`
                                        @keyframes pulse-orange {
                                            0% { box-shadow: 0 0 0 0 #f97316; }
                                            100% { box-shadow: 0 0 0 14px #f9731600; }
                                        }
                                    `}</style>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-[#0A0A0A] flex items-center justify-center w-6 h-6 animate-in zoom-in spin-in-90 duration-300">
                                <Check size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                )}


                {/* Settings Button (Visible on Hover if not in special modes) */}
                {!isDeleteMode && !isLinkMode && (
                    <div
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEditData()
                        }}
                    >
                        <div className="bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded-full shadow-lg border border-white/10 cursor-pointer">
                            <Settings size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* Label */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    onBlur={handleSaveLabel}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                    className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-500 text-xs font-medium text-white max-w-[150px] text-center focus:outline-none z-50 shadow-lg shadow-blue-500/20"
                    onClick={(e) => e.stopPropagation()} // Prevent drag when clicking input
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on input
                />
            ) : (
                <div
                    className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 text-xs font-medium text-white max-w-[120px] truncate text-center cursor-text hover:border-white/20 transition-colors z-10"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (isDeleteMode) {
                            onDelete()
                            return
                        }
                        if (isLinkMode) {
                            onLinkClick()
                            return
                        }
                        if (!isDragging.current) setIsEditing(true)
                    }}
                >
                    {node.label}
                </div>
            )}

            {/* Extended Hitbox for Mouse Detection (Transparent background) */}
            <div className="absolute inset-[-40px] rounded-full z-0 pointer-events-none group-hover:pointer-events-auto" />
        </motion.div>
    )
}
