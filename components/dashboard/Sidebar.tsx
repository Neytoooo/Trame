'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    HardHat,
    FileText,
    FileCheck,
    LogOut,
    Box,
    Settings,
    Layout,
    Bell
} from 'lucide-react'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <aside className="relative z-20 flex w-64 h-full flex-col border-r border-gray-200 bg-slate-100 backdrop-blur-xl dark:bg-gray-900/50 dark:border-white/10">
            {/* Logo */}
            <div className="flex h-20 items-center px-6 border-b border-gray-200 dark:border-white/5 flex-shrink-0">
                <span className="text-xl font-bold text-gray-900 tracking-wide dark:text-white">Trame</span>
                <div className="relative h-35 w-35 mr-3">
                    <Image
                        src="/trame-logo.png"
                        alt="Trame Logo"
                        fill
                        className="object-contain"
                    />
                </div>

            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar">
                <NavItem
                    href="/dashboard"
                    icon={<LayoutDashboard size={20} />}
                    label="Tableau de bord"
                    isActive={pathname === '/dashboard'}
                />
                <NavItem
                    href="/dashboard/annonces"
                    icon={<Bell size={20} />}
                    label="Annonces"
                    isActive={pathname === '/dashboard/annonces'}
                />
                <NavItem
                    href="/dashboard/articles"
                    icon={<Box size={20} />}
                    label="Bibliothèque"
                    isActive={pathname?.startsWith('/dashboard/articles')}
                />
                <NavItem
                    href="/dashboard/clients"
                    icon={<Users size={20} />}
                    label="Clients"
                    isActive={pathname?.startsWith('/dashboard/clients')}
                />
                <NavItem
                    href="/dashboard/chantiers"
                    icon={<HardHat size={20} />}
                    label="Chantiers"
                    isActive={pathname?.startsWith('/dashboard/chantiers')}
                />
                <NavItem
                    href="/dashboard/devis"
                    icon={<FileText size={20} />}
                    label="Devis"
                    isActive={pathname?.startsWith('/dashboard/devis')}
                />
                <NavItem
                    href="/dashboard/factures"
                    icon={<FileCheck size={20} />}
                    label="Factures"
                    isActive={pathname?.startsWith('/dashboard/factures')}
                />
                <NavItem
                    href="/dashboard/trello"
                    icon={<Layout size={20} />}
                    label="Tâches"
                    isActive={pathname?.startsWith('/dashboard/trello')}
                />
            </nav>

            {/* User Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50/50 dark:bg-white/5 dark:border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                    </div>
                    <ThemeToggle />
                    <Link href="/dashboard/settings" className="text-gray-400 hover:text-gray-900 transition-colors dark:hover:text-white" title="Paramètres">
                        <Settings size={18} />
                    </Link>
                    <form action="/auth/signout" method="post">
                        <button className="text-gray-400 hover:text-gray-900 transition-colors dark:hover:text-white" title="Déconnexion">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    )
}

function NavItem({ href, icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) {
    return (
        <Link
            href={href}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200
            ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
        >
            {isActive && (
                <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-xl bg-blue-600/10 border border-blue-600/10 shadow-sm dark:bg-blue-600/20 dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                    initial={false}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                />
            )}
            <span className="relative z-10 flex items-center gap-3">
                {icon}
                {label}
            </span>
        </Link>
    )
}
