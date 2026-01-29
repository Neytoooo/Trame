'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    HardHat,
    FileText,
    FileCheck,
    LogOut,
    Box,
    Settings
} from 'lucide-react'

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <aside className="relative z-20 flex w-64 flex-col border-r border-white/10 bg-gray-900/50 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex h-20 items-center px-6 border-b border-white/5">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
                    <span className="font-bold text-white">T</span>
                </div>
                <span className="text-xl font-bold text-white tracking-wide">Trame</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                <NavItem
                    href="/dashboard"
                    icon={<LayoutDashboard size={20} />}
                    label="Tableau de bord"
                    isActive={pathname === '/dashboard'}
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
            </nav>

            {/* User Footer */}
            <div className="border-t border-white/5 p-4 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-white">{user.email}</p>
                        <p className="text-xs text-gray-400">Admin</p>
                    </div>
                    <Link href="/dashboard/settings" className="text-gray-400 hover:text-white transition-colors" title="Paramètres">
                        <Settings size={18} />
                    </Link>
                    <form action="/auth/signout" method="post">
                        <button className="text-gray-400 hover:text-white transition-colors" title="Déconnexion">
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
            ${isActive ? 'text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
            {isActive && (
                <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-xl bg-blue-600/20 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
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
