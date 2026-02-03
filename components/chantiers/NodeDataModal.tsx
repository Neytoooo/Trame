'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Mail, Calendar } from 'lucide-react'
import { Node } from './DraggableNode'

type NodeDataModalProps = {
    isOpen: boolean
    onClose: () => void
    node: Node | null
    onSave: (nodeId: string, data: any) => void
}

export default function NodeDataModal({ isOpen, onClose, node, onSave }: NodeDataModalProps) {
    const [formData, setFormData] = useState<any>({})

    useEffect(() => {
        if (node) {
            setFormData(node.data || {})
        }
    }, [node])

    if (!isOpen || !node) return null

    const handleSave = () => {
        onSave(node.id, formData)
        onClose()
    }

    const renderFields = () => {
        switch (node.action_type) {
            case 'email':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Email Destinataire</label>
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <Mail size={16} className="text-gray-500 mr-2" />
                                <input
                                    type="email"
                                    value={formData.custom_email || ''}
                                    onChange={(e) => setFormData({ ...formData, custom_email: e.target.value })}
                                    placeholder="laisser vide pour utiliser l'email client"
                                    className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder-gray-600"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Si vide, l'email sera envoyé à l'adresse du client.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Sujet Spécifique</label>
                            <input
                                type="text"
                                value={formData.custom_subject || ''}
                                onChange={(e) => setFormData({ ...formData, custom_subject: e.target.value })}
                                placeholder="Sujet de l'email..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                )

            case 'calendar':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Titre de l'événement</label>
                            <input
                                type="text"
                                value={formData.event_title || ''}
                                onChange={(e) => setFormData({ ...formData, event_title: e.target.value })}
                                placeholder="ex: RDV Chantier - Validation"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.event_date || ''}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Heure</label>
                                <input
                                    type="time"
                                    value={formData.event_time || ''}
                                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Lieu</label>
                            <input
                                type="text"
                                value={formData.event_location || ''}
                                onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                                placeholder="Adresse du rendez-vous"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                value={formData.event_description || ''}
                                onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                                placeholder="Détails du rendez-vous..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors min-h-[80px]"
                            />
                        </div>
                    </div>
                )

            case 'play':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <h4 className="text-green-400 font-medium mb-1">Point de Lancement</h4>
                            <p className="text-sm text-gray-400">Ce nœud sert de déclencheur visuel. Il ne nécessite pas de configuration particulière pour le moment.</p>
                        </div>
                    </div>
                )

            default:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Notes / Description</label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ajouter des notes internes..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors min-h-[100px]"
                            />
                        </div>
                    </div>
                )
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${node.status === 'done' ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{node.label}</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        {renderFields()}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#151515]">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Save size={16} />
                            Enregistrer
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
