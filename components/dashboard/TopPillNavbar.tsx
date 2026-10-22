'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    HardHat,
    Users,
    FileText,
    FileCheck,
    Calendar,
    Layout,
    Box,
    Award,
    Search,
    Bell,
    Settings,
    ChevronDown,
    LogOut,
    ShieldCheck
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface TopPillNavbarProps {
    user: any
}

export default function TopPillNavbar({ user }: TopPillNavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activePath, setActivePath] = useState(pathname)

    useEffect(() => {
        setActivePath(pathname)
    }, [pathname])

    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "Chef"
    const displayName = user?.user_metadata?.first_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
        : user?.email?.split('@')[0] || "Utilisateur"

    const isLinkActive = (href: string) => {
        if (href === '/dashboard') return activePath === '/dashboard'
        if (href === '/dashboard/trello') return activePath?.startsWith('/dashboard/trello') || activePath?.startsWith('/dashboard/taches')
        return activePath?.startsWith(href)
    }

    const navLinks = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard size={14} />,
            active: isLinkActive('/dashboard')
        },
        {
            name: "Chantiers",
            href: "/dashboard/chantiers",
            icon: <HardHat size={14} />,
            active: isLinkActive('/dashboard/chantiers')
        },
        {
            name: "Clients",
            href: "/dashboard/clients",
            icon: <Users size={14} />,
            active: isLinkActive('/dashboard/clients')
        },
        {
            name: "Devis",
            href: "/dashboard/devis",
            icon: <FileText size={14} />,
            active: isLinkActive('/dashboard/devis')
        },
        {
            name: "Factures",
            href: "/dashboard/factures",
            icon: <FileCheck size={14} />,
            active: isLinkActive('/dashboard/factures')
        },
        {
            name: "Planning",
            href: "/dashboard/planning",
            icon: <Calendar size={14} />,
            active: isLinkActive('/dashboard/planning')
        },
        {
            name: "Tâches",
            href: "/dashboard/trello",
            icon: <Layout size={14} />,
            active: isLinkActive('/dashboard/trello')
        },
        {
            name: "Bibliothèque",
            href: "/dashboard/articles",
            icon: <Box size={14} />,
            active: isLinkActive('/dashboard/articles')
        },
        {
            name: "Équipe",
            href: "/dashboard/equipe",
            icon: <Users size={14} />,
            active: isLinkActive('/dashboard/equipe')
        }
    ]

    return (
        <header className="relative z-50 w-full px-4 md:px-8">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">

                {/* --- 1. USER PROFILE PILL (Left) --- */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2.5 bg-white dark:bg-[#131B2A] hover:bg-slate-50 dark:hover:bg-[#1A2438] border border-slate-200/90 dark:border-slate-800 rounded-full px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700 group cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-xs">
                            {firstName[0]?.toUpperCase()}
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-[#131B2A] rounded-full"></span>
                        </div>
                        <div className="text-left hidden sm:block pr-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                                Administrateur
                            </p>
                        </div>
                        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 p-2 shadow-xl shadow-slate-900/10 dark:shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.email}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                    <ShieldCheck size={11} />
                                    Accès Complet BTP
                                </span>
                            </div>
                            <div className="py-1">
                                <Link
                                    href="/dashboard/planning"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] rounded-xl transition-colors font-medium"
                                >
                                    <Calendar size={14} />
                                    Mon planning hebdomadaire
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] rounded-xl transition-colors font-medium"
                                >
                                    <Settings size={14} />
                                    Paramètres Entreprise
                                </Link>
                            </div>
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left font-medium"
                                >
                                    <LogOut size={14} />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 2. CENTER PILL NAVBAR (LIQUID MORPHING SELECTOR) --- */}
                <div className="flex items-center justify-center">
                    <nav className="relative flex items-center gap-0.5 p-1 bg-white dark:bg-[#131B2A]/90 border border-slate-200/90 dark:border-slate-800 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md no-scrollbar">
                        {navLinks.map((link) => {
                            const isActive = link.active
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    prefetch={false}
                                    onClick={() => setActivePath(link.href)}
                                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors duration-200 select-none ${
                                        isActive
                                            ? 'text-white font-semibold'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="liquidActivePill"
                                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow-[0_2px_14px_rgba(124,58,237,0.45)]"
                                            transition={{
                                                type: "spring",
                                                stiffness: 420,
                                                damping: 28,
                                                mass: 0.7
                                            }}
                                        />
                                    )}
                                    <span className={`relative z-10 flex items-center transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`}>
                                        {link.icon}
                                    </span>
                                    <span className="relative z-10 transition-colors duration-200">{link.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* --- 3. TOP RIGHT CONTROLS (Search, Theme, Notifications, Settings) --- */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Search Pill */}
                    <div className="relative hidden md:block">
                        <div className="flex items-center gap-2 bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-full px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                            <Search size={14} className="text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Recherche..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 w-24 lg:w-32 focus:w-40 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Dark / Light Mode Toggle Pill */}
                    <ThemeToggle />

                    {/* Notification Bell Pill */}
                    <Link
                        href="/dashboard/annonces"
                        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#131B2A] hover:bg-slate-50 dark:hover:bg-[#1A2438] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        title="Notifications & Annonces"
                    >
                        <Bell size={14} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#131B2A]"></span>
                    </Link>

                    {/* Settings Pill */}
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#131B2A] hover:bg-slate-50 dark:hover:bg-[#1A2438] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        title="Paramètres de l'entreprise"
                    >
                        <Settings size={14} />
                    </Link>
                </div>

            </div>
        </header>
    )
}
