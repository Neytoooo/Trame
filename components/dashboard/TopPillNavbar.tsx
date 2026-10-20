'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    HardHat,
    Users,
    FileText,
    FileCheck,
    Calendar,
    Layout,
    Box,
    Search,
    Bell,
    Settings,
    ChevronDown,
    LogOut,
    ShieldCheck
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface TopPillNavbarProps {
    user: any
}

export default function TopPillNavbar({ user }: TopPillNavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

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

    const navLinks = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard size={14} />,
            active: pathname === '/dashboard'
        },
        {
            name: "Chantiers",
            href: "/dashboard/chantiers",
            icon: <HardHat size={14} />,
            active: pathname?.startsWith('/dashboard/chantiers')
        },
        {
            name: "Clients",
            href: "/dashboard/clients",
            icon: <Users size={14} />,
            active: pathname?.startsWith('/dashboard/clients')
        },
        {
            name: "Devis",
            href: "/dashboard/devis",
            icon: <FileText size={14} />,
            active: pathname?.startsWith('/dashboard/devis')
        },
        {
            name: "Factures",
            href: "/dashboard/factures",
            icon: <FileCheck size={14} />,
            active: pathname?.startsWith('/dashboard/factures')
        },
        {
            name: "Planning",
            href: "/dashboard/planning",
            icon: <Calendar size={14} />,
            active: pathname?.startsWith('/dashboard/planning')
        },
        {
            name: "Tâches",
            href: "/dashboard/trello",
            icon: <Layout size={14} />,
            active: pathname?.startsWith('/dashboard/trello') || pathname?.startsWith('/dashboard/taches')
        },
        {
            name: "Bibliothèque",
            href: "/dashboard/articles",
            icon: <Box size={14} />,
            active: pathname?.startsWith('/dashboard/articles')
        }
    ]

    return (
        <header className="sticky top-3 z-50 w-full px-4 md:px-8">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">

                {/* --- 1. USER PROFILE PILL (Left) --- */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300 group cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-xs">
                            {firstName[0]?.toUpperCase()}
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="text-left hidden sm:block pr-1">
                            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium leading-none">
                                Administrateur
                            </p>
                        </div>
                        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 p-2 shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                            <div className="px-3 py-2 border-b border-slate-100">
                                <p className="text-xs font-semibold text-slate-800">{user?.email}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium mt-0.5">
                                    <ShieldCheck size={11} />
                                    Accès Complet BTP
                                </span>
                            </div>
                            <div className="py-1">
                                <Link
                                    href="/dashboard/planning"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                                >
                                    <Calendar size={14} />
                                    Mon planning hebdomadaire
                                </Link>
                                <Link
                                    href="/dashboard/articles"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                                >
                                    <Box size={14} />
                                    Catalogue BTP Pro
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                                >
                                    <Settings size={14} />
                                    Paramètres Entreprise
                                </Link>
                            </div>
                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-medium"
                                >
                                    <LogOut size={14} />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 2. CENTER PILL NAVBAR (NO HORIZONTAL SCROLLBAR) --- */}
                <div className="flex items-center justify-center">
                    <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200/90 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md no-scrollbar">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                                    link.active
                                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                                }`}
                            >
                                <span className={link.active ? 'text-white' : 'text-slate-400'}>
                                    {link.icon}
                                </span>
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* --- 3. TOP RIGHT CONTROLS (Search, Notifications, Settings) --- */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Search Pill */}
                    <div className="relative hidden md:block">
                        <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-full px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md text-xs text-slate-400 hover:border-slate-300 transition-all">
                            <Search size={14} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Recherche..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 w-24 lg:w-32 focus:w-40 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Notification Bell Pill */}
                    <Link
                        href="/dashboard/annonces"
                        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-indigo-600 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300"
                        title="Notifications & Annonces"
                    >
                        <Bell size={14} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                    </Link>

                    {/* Settings Pill */}
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-indigo-600 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300"
                        title="Paramètres de l'entreprise"
                    >
                        <Settings size={14} />
                    </Link>
                </div>

            </div>
        </header>
    )
}
