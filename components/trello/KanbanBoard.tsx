'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Receipt, HardHat, Mail, Calendar, MessageSquare, Layout, Check, Clock, Play, CircleDashed, Camera, ClipboardCheck, Package, MapPin, Palette, Sparkles, Settings, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { triggerNodeAutomation } from '@/app/actions/triggerNodeAutomation'

type Node = {
    id: string
    label: string
    status: 'pending' | 'in_progress' | 'done' | 'error'
    action_type: string
    chantier_id: string
    chantiers: {
        id: string
        name: string
    }
}

const getIcon = (type: string) => {
    switch (type) {
        case 'quote': return <FileText size={16} />
        case 'invoice': return <Receipt size={16} />
        case 'setup': return <HardHat size={16} />
        case 'email': return <Mail size={16} />
        case 'play': return <Play size={16} />
        case 'calendar': return <Calendar size={16} />
        case 'slack': return <MessageSquare size={16} />
        case 'trello': return <Layout size={16} />
        case 'site_visit': return <MapPin size={16} />
        case 'client_choice': return <Palette size={16} />
        case 'cleaning': return <Sparkles size={16} />
        case 'material_order': return <Package size={16} />
        case 'reception_report': return <ClipboardCheck size={16} />
        case 'photo_report': return <Camera size={16} />
        default: return <Settings size={16} />
    }
}

const getTagStyle = (type: string) => {
    switch (type) {
        case 'quote': return 'text-blue-300 bg-blue-500/20 border-blue-500/30'
        case 'invoice': return 'text-green-300 bg-green-500/20 border-green-500/30'
        case 'setup': return 'text-orange-300 bg-orange-500/20 border-orange-500/30'
        case 'email': return 'text-purple-300 bg-purple-500/20 border-purple-500/30'
        case 'calendar': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30'
        case 'play': return 'text-green-400 bg-green-500/20 border-green-500/30'
        case 'site_visit': return 'text-lime-300 bg-lime-500/20 border-lime-500/30'
        case 'client_choice': return 'text-pink-300 bg-pink-500/20 border-pink-500/30'
        case 'cleaning': return 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30'
        case 'material_order': return 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
        case 'reception_report': return 'text-teal-300 bg-teal-500/20 border-teal-500/30'
        case 'photo_report': return 'text-rose-300 bg-rose-500/20 border-rose-500/30'
        default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
}

export default function KanbanBoard({ nodes: initialNodes }: { nodes: any[] }) {
    const [nodes, setNodes] = useState<Node[]>(initialNodes)

    // Grouping
    const pendingNodes = nodes.filter(n => n.status !== 'done')
    const doneNodes = nodes.filter(n => n.status === 'done')

    const moveNodeToDone = async (node: Node) => {
        // Optimistic
        setNodes(nodes.map(n => n.id === node.id ? { ...n, status: 'done' } : n))
        // DB & Auto
        const supabase = createClient()
        await supabase.from('chantier_nodes').update({ status: 'done' }).eq('id', node.id)
        await triggerNodeAutomation(node.id, node.chantier_id)
    }

    const moveNodeToPending = async (node: Node) => {
        setNodes(nodes.map(n => n.id === node.id ? { ...n, status: 'pending' } : n))
        const supabase = createClient()
        await supabase.from('chantier_nodes').update({ status: 'pending' }).eq('id', node.id)
    }

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full gap-6 min-w-[800px] pb-4">

                {/* COLUMN 1: TO DO */}
                <div className="flex-1 min-w-[320px] max-w-md flex flex-col bg-[#0F0F12] border border-white/5 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-white tracking-wide">À Faire</h2>
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-400">
                                {pendingNodes.length}
                            </span>
                        </div>
                        <button className="text-gray-500 hover:text-white transition-colors">
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                        <AnimatePresence mode="popLayout">
                            {pendingNodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    layoutId={node.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group relative flex flex-col gap-3 p-4 rounded-xl bg-[#1A1A1E] border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
                                    onClick={() => moveNodeToDone(node)} // Simple click to move for now, acting as "check"
                                >
                                    {/* Action Type Tag */}
                                    <div className="flex items-start justify-between">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getTagStyle(node.action_type)}`}>
                                            {getIcon(node.action_type)}
                                            {node.action_type?.replace(/_/g, ' ')}
                                        </div>
                                        {/* Hover Check Action */}
                                        <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-transparent group-hover:text-green-400 group-hover:border-green-500/50 transition-all bg-black/20">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-200 leading-snug mb-1">{node.label}</h3>
                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                            {node.chantiers?.name}
                                        </p>
                                    </div>

                                    {/* Footer / Decor */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-10 pointer-events-none" />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {pendingNodes.length === 0 && (
                            <div className="h-24 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-gray-600 text-sm italic">
                                Tout est fait ! 👏
                            </div>
                        )}

                        {/* Add Button Placeholder - for visuals */}
                        <button className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5 hover:border-white/20 transition-all text-sm flex items-center justify-center gap-2 mt-2">
                            <Plus size={16} />
                            Ajouter une carte
                        </button>
                    </div>
                </div>

                {/* COLUMN 2: TERMINÉ */}
                <div className="flex-1 min-w-[320px] max-w-md flex flex-col bg-[#0F0F12] border border-white/5 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-gray-300 tracking-wide">Terminé</h2>
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-400">
                                {doneNodes.length}
                            </span>
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                        <AnimatePresence mode="popLayout">
                            {doneNodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    layoutId={node.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative flex flex-col gap-3 p-4 rounded-xl bg-[#151518] border border-white/5 opacity-60 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0"
                                    onClick={() => moveNodeToPending(node)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-gray-500 border-gray-700 bg-gray-800/50`}>
                                            {getIcon(node.action_type)}
                                            {node.action_type?.replace(/_/g, ' ')}
                                        </div>
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 decoration-gray-700 line-through mb-1">{node.label}</h3>
                                        <p className="text-xs text-gray-600 truncate">
                                            {node.chantiers?.name}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    )
}
