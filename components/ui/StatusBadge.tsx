import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Workflow, FileText, CheckCircle, Clock, AlertTriangle, XCircle, FileClock } from 'lucide-react'

// Type Definition for all possible statuses in the app
// You can extend this union type as you discover more statuses
export type AppStatus =
    // Devis
    | 'brouillon'
    | 'en_attente' // En préparation
    | 'en_attente_approbation' // Approbation
    | 'valide'
    | 'signe' // Souvent synonyme de validé
    | 'refuse'
    // Factures
    | 'payee'
    | 'paye'
    | 'retard'
    // Automation
    | 'automatise' // Custom status for the automation tag

interface StatusBadgeProps {
    status: AppStatus | string // Allow string for flexibility but prefer typed
    className?: string
    showIcon?: boolean
    customLabel?: string // Override the default label mapping
}

export default function StatusBadge({ status, className, showIcon = false, customLabel }: StatusBadgeProps) {

    // 1. Normalize status
    const normalizedStatus = status?.toLowerCase() || 'brouillon'

    // 2. Define Configuration for each status
    let config = {
        label: customLabel || status,
        variant: 'gray' as any,
        icon: null as any
    }

    switch (normalizedStatus) {
        // --- DEVIS ---
        case 'brouillon':
            config = {
                label: customLabel || 'Brouillon',
                variant: 'status_gray',
                icon: null
            }
            break
        case 'en_attente':
            config = {
                label: customLabel || 'En préparation',
                variant: 'status_blue',
                icon: null
            }
            break
        case 'en_attente_approbation':
            config = {
                label: customLabel || 'Approbation',
                variant: 'status_green',
                icon: null
            }
            break
        case 'valide':
        case 'signe':
        case 'approuve':
            config = {
                label: customLabel || 'Validé',
                variant: 'status_emerald',
                icon: null
            }
            break
        case 'refuse':
            config = {
                label: customLabel || 'Refusé',
                variant: 'status_red',
                icon: null
            }
            break

        // --- FACTURES ---
        case 'payee':
        case 'paye':
            config = {
                label: customLabel || 'Payée',
                variant: 'status_emerald',
                icon: null
            }
            break
        case 'retard':
            config = {
                label: customLabel || 'En retard',
                variant: 'status_red',
                icon: null
            }
            break
        case 'envoye':
        case 'envoyee':
            config = {
                label: customLabel || 'Envoyée',
                variant: 'status_blue',
                icon: null
            }
            break

        // --- AUTOMATION ---
        case 'automatise':
            config = {
                label: customLabel || 'Automatisé',
                variant: 'status_purple',
                icon: Workflow
            }
            break

        // --- FALLBACK ---
        default:
            config = {
                label: customLabel || status?.replace(/_/g, ' '),
                variant: 'status_gray',
                icon: null
            }
    }

    const Icon = config.icon

    return (
        <Badge variant={config.variant} className={className}>
            {showIcon && Icon && <Icon size={12} />}
            {config.label}
        </Badge>
    )
}
