'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Info, X, Loader2 } from 'lucide-react'

export interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title?: string
    message: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isProcessing?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Êtes-vous sûr ?',
    message,
    confirmText = 'Oui, continuer',
    cancelText = 'Non, annuler',
    variant = 'danger',
    isProcessing = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    const handleConfirm = async () => {
        await onConfirm()
    }

    const iconConfig = {
        danger: {
            icon: ShieldAlert,
            bg: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20',
            button: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-500/20 focus:ring-red-500'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
            button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-lg shadow-amber-500/20 focus:ring-amber-500'
        },
        info: {
            icon: Info,
            bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            button: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-500/20 focus:ring-indigo-500'
        }
    }[variant]

    const Icon = iconConfig.icon

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop avec flou d'arrière-plan */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={isProcessing ? undefined : onClose}
                    className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
                />

                {/* Boîte Modale */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative w-full max-w-md bg-[#0B101B]/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden p-6 z-10 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent"
                >
                    {/* Bouton fermeture croix */}
                    {!isProcessing && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                            aria-label="Fermer"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <div className="flex items-start gap-4">
                        {/* Badge Icône */}
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${iconConfig.bg}`}>
                            <Icon size={24} />
                        </div>

                        {/* Contenu Texte */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {title}
                            </h3>
                            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line">
                                {message}
                            </div>
                        </div>
                    </div>

                    {/* Actions : Non / Oui */}
                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>

                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handleConfirm}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 ${iconConfig.button}`}
                        >
                            {isProcessing && <Loader2 size={16} className="animate-spin" />}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
