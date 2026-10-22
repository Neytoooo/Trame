'use client'

import React from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export type PillButtonVariant = 'primary' | 'ai' | 'success' | 'secondary'

interface BasePillButtonProps {
    children: React.ReactNode
    icon?: React.ReactNode
    variant?: PillButtonVariant
    className?: string
    loading?: boolean
    disabled?: boolean
    title?: string
}

interface LinkPillButtonProps extends BasePillButtonProps {
    href: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    target?: string
    rel?: string
    type?: never
}

interface ActionPillButtonProps extends BasePillButtonProps {
    href?: never
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    type?: 'button' | 'submit' | 'reset'
}

export type PillButtonProps = LinkPillButtonProps | ActionPillButtonProps

const variantStyles: Record<PillButtonVariant, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20',
    ai: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
    secondary: 'bg-white dark:bg-[#131B2A] hover:bg-slate-50 dark:hover:bg-[#1A2438] text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 shadow-xs'
}

export default function PillButton({
    children,
    icon,
    variant = 'primary',
    className = '',
    loading = false,
    disabled = false,
    ...props
}: PillButtonProps) {
    const baseClasses = `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 select-none shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 ${variantStyles[variant]} ${className}`

    const content = (
        <>
            {loading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                icon && <span className="flex items-center shrink-0">{icon}</span>
            )}
            <span>{children}</span>
        </>
    )

    if ('href' in props && props.href) {
        const { href, onClick, target, rel } = props as LinkPillButtonProps
        return (
            <Link
                href={href}
                onClick={onClick}
                target={target}
                rel={rel}
                title={props.title}
                className={baseClasses}
            >
                {content}
            </Link>
        )
    }

    const { onClick, type = 'button' } = props as ActionPillButtonProps
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            title={props.title}
            className={baseClasses}
        >
            {content}
        </button>
    )
}
