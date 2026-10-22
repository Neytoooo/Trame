'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import ConfirmModal from './ConfirmModal'

export interface ConfirmOptions {
    title?: string
    message: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{
        isOpen: boolean
        options: ConfirmOptions
    }>({
        isOpen: false,
        options: {
            title: 'Êtes-vous sûr ?',
            message: '',
            confirmText: 'Oui, continuer',
            cancelText: 'Non, annuler',
            variant: 'danger'
        }
    })

    const resolverRef = useRef<((value: boolean) => void) | null>(null)

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolverRef.current = resolve
            setState({
                isOpen: true,
                options: {
                    title: options.title || 'Êtes-vous sûr ?',
                    message: options.message,
                    confirmText: options.confirmText || 'Oui, continuer',
                    cancelText: options.cancelText || 'Non, annuler',
                    variant: options.variant || 'danger'
                }
            })
        })
    }, [])

    const handleClose = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }))
        if (resolverRef.current) {
            resolverRef.current(false)
            resolverRef.current = null
        }
    }, [])

    const handleConfirm = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }))
        if (resolverRef.current) {
            resolverRef.current(true)
            resolverRef.current = null
        }
    }, [])

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmModal
                isOpen={state.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={state.options.title}
                message={state.options.message}
                confirmText={state.options.confirmText}
                cancelText={state.options.cancelText}
                variant={state.options.variant}
            />
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const context = useContext(ConfirmContext)
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider')
    }
    return context.confirm
}
