'use client'

import { INITIAL_TEAM_MEMBERS } from '@/lib/teamData'

export interface AuthorProfile {
    id?: string
    full_name?: string
    name?: string
    email?: string
    initials?: string
    role?: string
    avatar_color?: string
}

const COLOR_CLASSES: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
}

export function getAuthorInfo(createdById?: string | null) {
    if (createdById) {
        const teamMember = INITIAL_TEAM_MEMBERS.find(m => m.id === createdById)
        if (teamMember) {
            return {
                id: teamMember.id,
                name: `${teamMember.prenom} ${teamMember.nom}`,
                role: teamMember.role,
                initials: teamMember.initials,
                email: teamMember.email,
                colorKey: teamMember.accentColor
            }
        }
    }
    return {
        id: 'user-default',
        name: 'Collaborateur KOTA',
        role: 'Équipe Travaux',
        initials: 'CK',
        email: 'collaborateur@kota-btp.fr',
        colorKey: 'indigo'
    }
}

interface Props {
    author?: AuthorProfile | null
    createdById?: string | null
    createdAt?: string | Date
    size?: 'sm' | 'md'
}

export default function UserAvatarBadge({ author, createdById, createdAt, size = 'sm' }: Props) {
    // 1. Résolution de l'auteur
    let resolvedName = author?.full_name || author?.name
    let resolvedInitials = author?.initials
    let resolvedRole = author?.role || 'Collaborateur BTP'
    let resolvedEmail = author?.email
    let colorKey = author?.avatar_color || 'indigo'

    // Si on a un createdById, chercher d'abord dans l'équipe KOTA
    if (createdById) {
        const teamMember = INITIAL_TEAM_MEMBERS.find(m => m.id === createdById)
        if (teamMember) {
            resolvedName = `${teamMember.prenom} ${teamMember.nom}`
            resolvedInitials = teamMember.initials
            resolvedRole = teamMember.role
            resolvedEmail = teamMember.email
            colorKey = teamMember.accentColor
        }
    }

    // Fallback initials si absentes
    if (!resolvedInitials) {
        if (resolvedName) {
            const parts = resolvedName.trim().split(/\s+/)
            resolvedInitials = parts.length > 1
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : parts[0].slice(0, 2).toUpperCase()
        } else if (resolvedEmail) {
            resolvedInitials = resolvedEmail.slice(0, 2).toUpperCase()
            resolvedName = resolvedEmail
        } else {
            resolvedInitials = 'CB'
            resolvedName = 'Collaborateur BTP'
            resolvedRole = 'Équipe Travaux'
            colorKey = 'indigo'
        }
    }

    const badgeColor = COLOR_CLASSES[colorKey] || COLOR_CLASSES.indigo
    const dimension = size === 'md' ? 'h-7 w-7 text-xs' : 'h-6 w-6 text-[10px]'

    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : null

    return (
        <div className="relative group/author inline-flex items-center">
            {/* Badge Initiales */}
            <div
                className={`${dimension} rounded-full border flex items-center justify-center font-bold tracking-tight select-none shadow-2xs transition-transform group-hover/author:scale-105 cursor-pointer ${badgeColor}`}
                title={resolvedName}
            >
                {resolvedInitials}
            </div>

            {/* Tooltip Complet au survol */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/author:flex flex-col items-center z-40">
                <div className="bg-slate-900 text-white dark:bg-[#0E1524] text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-2xl border border-slate-700/80 whitespace-nowrap min-w-36 text-center space-y-0.5">
                    <p className="font-bold text-white text-xs">{resolvedName}</p>
                    <p className="text-[10px] text-indigo-400 font-semibold">{resolvedRole}</p>
                    {resolvedEmail && (
                        <p className="text-[9px] text-slate-400 font-mono truncate">{resolvedEmail}</p>
                    )}
                    {formattedDate && (
                        <p className="text-[9px] text-slate-400 border-t border-slate-800 pt-1 mt-1">
                            Créé le {formattedDate}
                        </p>
                    )}
                </div>
                <div className="w-2 h-2 bg-slate-900 dark:bg-[#0E1524] rotate-45 -mt-1 border-r border-b border-slate-700/80"></div>
            </div>
        </div>
    )
}
