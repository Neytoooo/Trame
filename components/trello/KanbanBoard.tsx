'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Receipt, HardHat, Mail, Calendar, MessageSquare, Layout, Check, Clock, Play, CircleDashed, Camera, ClipboardCheck, Package, MapPin, Palette, Sparkles, Settings, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { triggerNodeAutomation } from '@/app/actions/triggerNodeAutomation'
import { Badge } from '@/components/ui/Badge'

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

const getBadgeVariant = (type: string) => {
    switch (type) {
        case 'quote': return 'info'
        case 'invoice': return 'success'
        case 'setup': return 'orange'
        case 'email': return 'purple'
        case 'calendar': return 'warning'
        case 'play': return 'success'
        case 'site_visit': return 'lime'
        case 'client_choice': return 'pink'
        case 'cleaning': return 'cyan'
        case 'material_order': return 'indigo'
        case 'reception_report': return 'teal'
        case 'photo_report': return 'rose'
        default: return 'gray'
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
                <div className="flex-1 min-w-[340px] max-w-md flex flex-col bg-white/95 border border-slate-200/80 rounded-[28px] shadow-[0_12px_35px_rgba(0,0,0,0.03)] overflow-hidden backdrop-blur-md">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-slate-800 tracking-wide text-sm">À Faire</h2>
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">
                                {pendingNodes.length}
                            </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-700 transition-colors">
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/30">
                        <AnimatePresence mode="popLayout">
                            {pendingNodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    layoutId={node.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => moveNodeToDone(node)} // Simple click to move for now, acting as "check"
                                >
                                    {/* Action Type Tag */}
                                    <div className="flex items-start justify-between">
                                        <Badge variant={getBadgeVariant(node.action_type) as any} className="uppercase tracking-wider text-[10px]">
                                            {getIcon(node.action_type)}
                                            {node.action_type?.replace(/_/g, ' ')}
                                        </Badge>
                                        {/* Hover Check Action */}
                                        <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-transparent group-hover:text-emerald-600 group-hover:border-emerald-500 transition-all bg-slate-50 group-hover:bg-emerald-50">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">{node.label}</h3>
                                        <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            {node.chantiers?.name}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {pendingNodes.length === 0 && (
                            <div className="h-28 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm italic">
                                Tout est fait ! 👏
                            </div>
                        )}

                        {/* Add Button Placeholder - for visuals */}
                        <button className="w-full py-2.5 rounded-2xl border border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-xs font-semibold flex items-center justify-center gap-2 mt-2">
                            <Plus size={15} />
                            Ajouter une carte
                        </button>
                    </div>
                </div>

                {/* COLUMN 2: TERMINÉ */}
                <div className="flex-1 min-w-[340px] max-w-md flex flex-col bg-white/95 border border-slate-200/80 rounded-[28px] shadow-[0_12px_35px_rgba(0,0,0,0.03)] overflow-hidden backdrop-blur-md opacity-90 hover:opacity-100 transition-opacity">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-slate-800 tracking-wide text-sm">Terminé</h2>
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700">
                                {doneNodes.length}
                            </span>
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/30">
                        <AnimatePresence mode="popLayout">
                            {doneNodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    layoutId={node.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 opacity-80 hover:opacity-100 transition-all cursor-pointer"
                                    onClick={() => moveNodeToPending(node)}
                                >
                                    <div className="flex items-start justify-between">
                                        <Badge variant="gray" className="uppercase tracking-wider text-[10px] opacity-75">
                                            {getIcon(node.action_type)}
                                            {node.action_type?.replace(/_/g, ' ')}
                                        </Badge>
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 line-through mb-1">{node.label}</h3>
                                        <p className="text-xs text-slate-400 truncate">
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
