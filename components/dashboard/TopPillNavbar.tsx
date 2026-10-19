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
    Check,
    Sparkles,
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
    const [searchOpen, setSearchOpen] = useState(false)
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
            icon: <LayoutDashboard size={15} />,
            active: pathname === '/dashboard'
        },
        {
            name: "Chantiers",
            href: "/dashboard/chantiers",
            icon: <HardHat size={15} />,
            active: pathname?.startsWith('/dashboard/chantiers')
        },
        {
            name: "Clients",
            href: "/dashboard/clients",
            icon: <Users size={15} />,
            active: pathname?.startsWith('/dashboard/clients')
        },
        {
            name: "Devis",
            href: "/dashboard/devis",
            icon: <FileText size={15} />,
            active: pathname?.startsWith('/dashboard/devis')
        },
        {
            name: "Factures",
            href: "/dashboard/factures",
            icon: <FileCheck size={15} />,
            active: pathname?.startsWith('/dashboard/factures')
        },
        {
            name: "Planning",
            href: "/dashboard/planning",
            icon: <Calendar size={15} />,
            active: pathname?.startsWith('/dashboard/planning')
        },
        {
            name: "Tâches",
            href: "/dashboard/trello",
            icon: <Layout size={15} />,
            active: pathname?.startsWith('/dashboard/trello') || pathname?.startsWith('/dashboard/taches')
        },
        {
            name: "Bibliothèque",
            href: "/dashboard/articles",
            icon: <Box size={15} />,
            active: pathname?.startsWith('/dashboard/articles')
        }
    ]

    return (
        <header className="relative z-50 w-full pt-4 pb-2 px-4 md:px-8">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">

                {/* --- 1. USER PROFILE PILL (Top Left) --- */}
                <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-3 bg-white/95 hover:bg-white border border-slate-200/80 rounded-full px-3.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all hover:shadow-md group cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-sm">
                            {firstName[0]?.toUpperCase()}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="text-left pr-1">
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
                        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-100 p-2 shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
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
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <Calendar size={14} />
                                    Mon planning hebdomadaire
                                </Link>
                                <Link
                                    href="/dashboard/articles"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <Box size={14} />
                                    Catalogue BTP Pro
                                </Link>
                            </div>
                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                                >
                                    <LogOut size={14} />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 2. CENTER FLOATING PILL NAVBAR & BRANDING --- */}
                <div className="flex flex-col items-center gap-1.5 flex-1 max-w-3xl">
                    {/* Header Title / System Brand */}
                    <div className="text-center">
                        <h1 className="text-[11px] font-black tracking-[0.25em] text-slate-800 uppercase flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            TRAME ERP
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            Bâtiment & Chantiers Management System
                        </p>
                    </div>

                    {/* Floating Horizontal Pill Bar */}
                    <nav className="flex items-center gap-1.5 p-1 bg-white/90 border border-slate-200/80 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-x-auto max-w-full custom-scrollbar">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                                    link.active
                                        ? 'bg-gradient-to-r from-indigo-500/15 via-blue-500/15 to-purple-500/15 text-indigo-700 font-bold border border-indigo-200/70 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                                }`}
                            >
                                <span className={link.active ? 'text-indigo-600' : 'text-slate-400'}>
                                    {link.icon}
                                </span>
                                <span>{link.name}</span>
                                <ChevronDown size={11} className={`opacity-40 transition-transform ${link.active ? 'text-indigo-600 opacity-80' : ''}`} />
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* --- 3. TOP RIGHT CONTROLS (Search, Notifications, Settings) --- */}
                <div className="flex items-center gap-2.5">
                    {/* Search Pill */}
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-white/95 border border-slate-200/80 rounded-full px-3.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md text-xs text-slate-400 hover:border-slate-300 transition-all cursor-pointer">
                            <Search size={14} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Recherche rapide..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 w-24 md:w-32 focus:w-44 transition-all"
                            />
                        </div>
                    </div>

                    {/* Notification Bell Pill */}
                    <Link
                        href="/dashboard/annonces"
                        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all hover:shadow-md"
                        title="Notifications & Annonces"
                    >
                        <Bell size={15} />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                    </Link>

                    {/* Settings Pill */}
                    <Link
                        href="/dashboard/planning"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all hover:shadow-md"
                        title="Paramètres de l'entreprise"
                    >
                        <Settings size={15} />
                    </Link>
                </div>

            </div>
        </header>
    )
}
