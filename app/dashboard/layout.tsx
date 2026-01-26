import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    HardHat,
    FileText,
    LogOut,
    Settings
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-gray-900 text-gray-100">

            {/* --- FOND ANIMÉ (Global pour tout le dashboard) --- */}
            <div className="fixed -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600 opacity-20 blur-[100px] animate-pulse" />
            <div className="fixed top-1/2 right-0 h-96 w-96 rounded-full bg-purple-600 opacity-10 blur-[100px] animate-pulse delay-1000" />
            <div className="fixed bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500 opacity-10 blur-[100px]" />

            {/* --- SIDEBAR (Effet Verre) --- */}
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
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Tableau de bord" active />
                    <NavItem href="/dashboard/clients" icon={<Users size={20} />} label="Clients" />
                    <NavItem href="/dashboard/chantiers" icon={<HardHat size={20} />} label="Chantiers" />
                    <NavItem href="/dashboard/devis" icon={<FileText size={20} />} label="Devis & Factures" />
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
                        <form action="/auth/signout" method="post">
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <LogOut size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* --- CONTENU PRINCIPAL --- */}
            <main className="relative z-10 flex-1 overflow-y-auto">
                <div className="min-h-full p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

// Petit composant pour les liens du menu
function NavItem({ href, icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
        ${active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            {icon}
            {label}
        </Link>
    )
}