import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Workflow } from 'lucide-react'

export type AppStatus =
    // Devis
    | 'brouillon'
    | 'en_attente'
    | 'en_preparation'
    | 'en_attente_approbation'
    | 'approbation'
    | 'valide'
    | 'signe'
    | 'approuve'
    | 'refuse'
    // Factures
    | 'payee'
    | 'paye'
    | 'retard'
    | 'envoye'
    | 'envoyee'
    // Chantiers
    | 'en_cours'
    | 'etude'
    | 'termine'
    | 'annule'
    // Automation
    | 'automatise'

interface StatusBadgeProps {
    status: AppStatus | string
    className?: string
    showIcon?: boolean
    customLabel?: string
}

export default function StatusBadge({ status, className, showIcon = false, customLabel }: StatusBadgeProps) {
    const normalizedStatus = status?.toLowerCase() || 'brouillon'

    let config = {
        label: customLabel || status,
        variant: 'status_gray' as any,
        icon: null as any
    }

    switch (normalizedStatus) {
        // --- BROUILLON / NEUTRE ---
        case 'brouillon':
            config = {
                label: customLabel || 'Brouillon',
                variant: 'status_gray',
                icon: null
            }
            break

        // --- EN ATTENTE (Ambre chaleureux - Image 1) ---
        case 'en_attente':
            config = {
                label: customLabel || 'En Attente',
                variant: 'status_amber',
                icon: null
            }
            break

        case 'en_preparation':
            config = {
                label: customLabel || 'En préparation',
                variant: 'status_sky',
                icon: null
            }
            break

        // --- APPROBATION (Teal doux - Image 2) ---
        case 'en_attente_approbation':
        case 'approbation':
            config = {
                label: customLabel || 'Approbation',
                variant: 'status_teal',
                icon: null
            }
            break

        // --- CHANTIERS EN COURS / ÉTUDE ---
        case 'en_cours':
            config = {
                label: customLabel || 'En cours',
                variant: 'status_blue',
                icon: null
            }
            break
        case 'etude':
            config = {
                label: customLabel || 'En étude',
                variant: 'status_sky',
                icon: null
            }
            break

        // --- VALIDÉ / SIGNÉ / PAYÉE / TERMINÉ (Émeraude élégant - Image 1) ---
        case 'payee':
        case 'paye':
            config = {
                label: customLabel || 'Payée',
                variant: 'status_emerald',
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
        case 'termine':
            config = {
                label: customLabel || 'Terminé',
                variant: 'status_emerald',
                icon: null
            }
            break

        // --- ENVOYÉE ---
        case 'envoye':
        case 'envoyee':
            config = {
                label: customLabel || 'Envoyée',
                variant: 'status_blue',
                icon: null
            }
            break

        // --- AUTOMATION (Violet - Image 2) ---
        case 'automatise':
            config = {
                label: customLabel || 'Automatisé',
                variant: 'status_purple',
                icon: Workflow
            }
            break

        // --- RETARD / REFUSÉ / ANNULÉ (Rose doux) ---
        case 'retard':
            config = {
                label: customLabel || 'En retard',
                variant: 'status_red',
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
        case 'annule':
            config = {
                label: customLabel || 'Annulé',
                variant: 'status_red',
                icon: null
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
