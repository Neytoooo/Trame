'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Terminal, Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Log = {
    id: string
    level: 'info' | 'error' | 'warning'
    message: string
    created_at: string
}

type LogsModalProps = {
    isOpen: boolean
    onClose: () => void
    chantierId: string
}

export default function LogsModal({ isOpen, onClose, chantierId }: LogsModalProps) {
    const supabase = createClient()
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen && chantierId) {
            fetchLogs()
        }
    }, [isOpen, chantierId])

    const fetchLogs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('chantier_logs')
            .select('*')
            .eq('chantier_id', chantierId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setLogs(data as Log[])
        setLoading(false)
    }

    const handleSimulateCrash = async () => {
        const { error } = await supabase.from('chantier_logs').insert({
            chantier_id: chantierId,
            level: 'error',
            message: '🔥 CRASH TEST : Erreur simulée manuellement'
        })
        if (!error) fetchLogs()
    }

    const handleCopy = () => {
        const text = logs.map(l => `[${new Date(l.created_at).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#151515]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Terminal size={20} className="text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Logs d'automatisation</h2>
                                <p className="text-xs text-gray-400">Derniers événements du chantier</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSimulateCrash}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors border border-red-500/20 mr-2"
                            >
                                <AlertCircle size={14} />
                                Simuler Crash
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
                            >
                                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                {copied ? "Copié !" : "Copier"}
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-black/50">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                                <Loader2 className="animate-spin" /> Chargement...
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                <Info size={32} />
                                <p>Aucun log pour le moment.</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-gray-500 text-xs whitespace-nowrap pt-0.5">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {log.level === 'error' && <AlertCircle size={14} className="text-red-500" />}
                                            {log.level === 'warning' && <AlertCircle size={14} className="text-yellow-500" />}
                                            {log.level === 'info' && <Info size={14} className="text-blue-500" />}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${log.level === 'error' ? 'text-red-500' :
                                                log.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                                }`}>
                                                {log.level}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 break-words leading-relaxed">
                                            {log.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
