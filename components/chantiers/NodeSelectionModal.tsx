import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Receipt, HardHat, Mail, X, CircleDashed, Calendar, MessageSquare, Layout, Play } from 'lucide-react'

type ActionType = 'quote' | 'invoice' | 'setup' | 'email' | 'general' | 'empty' | 'calendar' | 'slack' | 'trello' | 'play'

type NodeSelectionModalProps = {
    isOpen: boolean
    onClose: () => void
    onSelect: (type: ActionType, label: string) => void
}

export default function NodeSelectionModal({ isOpen, onClose, onSelect }: NodeSelectionModalProps) {
    if (!isOpen) return null

    const options = [
        {
            id: 'play',
            label: 'Lancement',
            icon: Play,
            color: 'bg-green-600',
            description: 'Point de départ de l\'automatisation'
        },
        {
            id: 'quote',
            label: 'Création de devis',
            icon: FileText,
            color: 'bg-blue-500',
            description: 'Générer un devis pour le client'
        },
        {
            id: 'invoice',
            label: 'Création de facture',
            icon: Receipt,
            color: 'bg-green-500',
            description: 'Émettre une facture'
        },
        {
            id: 'setup',
            label: 'Mise en place chantier',
            icon: HardHat,
            color: 'bg-orange-500',
            description: 'Préparer le terrain et les équipes'
        },
        {
            id: 'email',
            label: 'Email Automatique',
            icon: Mail,
            color: 'bg-purple-500',
            description: 'Envoyer un email de notification'
        },
        // New Automations
        {
            id: 'empty',
            label: 'Point de passage',
            icon: CircleDashed,
            color: 'bg-gray-500',
            description: 'Nœud simple sans action'
        },
        {
            id: 'calendar',
            label: 'Google Calendar',
            icon: Calendar,
            color: 'bg-yellow-500',
            description: 'Créer un événement'
        },
        {
            id: 'slack',
            label: 'Slack Notification',
            icon: MessageSquare,
            color: 'bg-pink-500',
            description: 'Envoyer un message sur Slack'
        },
        {
            id: 'trello',
            label: 'Carte Trello',
            icon: Layout,
            color: 'bg-cyan-500',
            description: 'Créer une carte dans un tableau'
        }
    ]

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white">Ajouter une étape</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onSelect(option.id as ActionType, option.label)}
                                className="group flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all text-left"
                            >
                                <div className={`p-3 rounded-lg ${option.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    <option.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{option.label}</h3>
                                    <p className="text-sm text-gray-400 leading-snug">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
