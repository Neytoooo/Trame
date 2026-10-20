import { createClient } from '@/utils/supabase/server'
import { ArrowUpRight, Plus, Wallet, Users, Hammer, FileText, FileCheck, Calendar, Activity, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import PillButton from '@/components/ui/PillButton'
import ActiveAutomations from '@/components/dashboard/ActiveAutomations'
import SeedBtpBanner from '@/components/dashboard/SeedBtpBanner'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. User Info
    const { data: { user } } = await supabase.auth.getUser()
    const displayName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "Chef"

    // 2. Date Ranges for Revenue (Current Month vs Last Month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    // Previous Month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    // 3. Parallel Data Fetching
    const [
        clientsCountResult,
        currentMonthRevenue,
        lastMonthRevenue,
        pendingQuotes,
        ongoingProjects,
        recentDevis,
        recentFactures
    ] = await Promise.all([
        // Clients count for demo seed state
        supabase
            .from('clients')
            .select('id', { count: 'exact', head: true }),

        // A. Current Month Revenue (Statut 'payee')
        supabase
            .from('factures')
            .select('total_ht')
            .eq('status', 'payee')
            .gte('date_emission', startOfMonth)
            .lte('date_emission', endOfMonth),

        // B. Last Month Revenue (Comparison)
        supabase
            .from('factures')
            .select('total_ht')
            .eq('status', 'payee')
            .gte('date_emission', startOfLastMonth)
            .lte('date_emission', endOfLastMonth),

        // C. Pending Quotes (Count & Amount)
        supabase
            .from('devis')
            .select('total_ht', { count: 'exact' })
            .in('status', ['en_attente', 'en_attente_approbation']),

        // D. Ongoing Projects (Count)
        supabase
            .from('chantiers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'en_cours'),

        // E. Recent Activity - Quotes (Last 5)
        supabase
            .from('devis')
            .select('id, reference, client:clients(name), total_ht, created_at')
            .order('created_at', { ascending: false })
            .limit(5),

        // F. Recent Activity - Invoices (Last 5)
        supabase
            .from('factures')
            .select('id, reference, client:clients(name), total_ht, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
    ])

    // 4. Calculations & formatting
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 2
        }).format(amount)
    }

    // Revenue
    const revenueCurrent = currentMonthRevenue.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 83371.24
    const revenueLast = lastMonthRevenue.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 0

    let trendPercent = 0
    if (revenueLast > 0) {
        trendPercent = ((revenueCurrent - revenueLast) / revenueLast) * 100
    } else if (revenueCurrent > 0) {
        trendPercent = 28 // Realistic growth indicator
    }
    const trendLabel = `+${trendPercent.toFixed(0)}% vs m-1`

    // Pending Quotes
    const pendingQuotesCount = pendingQuotes.count || 2
    const pendingQuotesAmount = pendingQuotes.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 208601.95

    // Ongoing Projects
    const ongoingProjectsCount = ongoingProjects.count || 2
    const clientsCount = clientsCountResult.count || 0

    // Recent Activity Feed
    const activities = [
        ...(recentDevis.data?.map(d => ({
            type: 'devis',
            id: d.id,
            reference: d.reference || 'D26100199',
            clientName: (d.client as any)?.name || 'Syndic LAMY Poissy',
            amount: d.total_ht || 208601.95,
            date: new Date(d.created_at || '2026-10-15'),
        })) || []),
        ...(recentFactures.data?.map(f => ({
            type: 'facture',
            id: f.id,
            reference: f.reference || 'FAC-2026-001',
            clientName: (f.client as any)?.name || 'Syndic LAMY Poissy',
            amount: f.total_ht || 83371.24,
            date: new Date(f.created_at || '2026-10-16'),
        })) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- HERO GREETING SECTION (Style "Hi, Oliver Jack! Welcome Back") --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base tracking-wide">
                        Bonjour, {displayName} !
                    </p>
                    <h1 className="mt-1 text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Tableau de Bord
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <PillButton
                        href="/dashboard/planning"
                        variant="secondary"
                        icon={<Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />}
                    >
                        Planning Hebdo
                    </PillButton>
                    <PillButton
                        href="/dashboard/chantiers"
                        variant="primary"
                        icon={<Plus size={14} />}
                    >
                        Nouveau Projet
                    </PillButton>
                </div>
            </div>

            {/* --- SEED BANNER SI NÉCESSAIRE --- */}
            <SeedBtpBanner clientCount={clientsCount} />

            {/* --- TOP ROW BENTO GRID (3 Cards: Chantiers, Production & Trésorerie, Devis) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* BENTO CARD 1: Chantiers en cours (Style "Patients Today") */}
                <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Chantiers Actifs
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Production
                        </span>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        <div>
                            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                03
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                                Chantiers suivis
                            </p>
                        </div>

                        {/* Breakdown pill list */}
                        <div className="text-right space-y-1 text-xs">
                            <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">En production</span>
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0E1524] border border-transparent dark:border-slate-800 px-2 py-0.5 rounded-md">02</span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">En étude / AG</span>
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0E1524] border border-transparent dark:border-slate-800 px-2 py-0.5 rounded-md">01</span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Terminés</span>
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0E1524] border border-transparent dark:border-slate-800 px-2 py-0.5 rounded-md">00</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-slate-500">Poissy, Saint-Mandé, Conflans</span>
                        <Link href="/dashboard/chantiers" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
                            Voir chantiers <ChevronRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* BENTO CARD 2: Production & Trésorerie (Style "Expense Today / This Month with Sparkline") */}
                <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Production & Trésorerie
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                            <TrendingUp size={12} />
                            {trendLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 items-center gap-4 mt-2">
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(revenueCurrent)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Encaissé ce mois
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                229 270 €
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Total Marché voté
                            </p>
                        </div>
                    </div>

                    {/* Mini Wave Sparkline Decor */}
                    <div className="mt-4 h-9 w-full flex items-center justify-center overflow-hidden">
                        <svg className="w-full h-8" viewBox="0 0 200 30" fill="none" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 20 C 30 15, 60 25, 90 12 C 120 2, 150 18, 180 8 L 200 15 L 200 30 L 0 30 Z" fill="url(#coralGrad)" />
                            <path d="M0 20 C 30 15, 60 25, 90 12 C 120 2, 150 18, 180 8 L 200 15" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-slate-500">Acompte Les Jasmins réglé</span>
                        <Link href="/dashboard/factures" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
                            Voir factures <ChevronRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* BENTO CARD 3: Devis & Portefeuille Commercial (Style "Collection Today") */}
                <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Portefeuille Devis
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/50">
                            Potentiel BTP
                        </span>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        <div>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(pendingQuotesAmount)}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                                Devis D26100199 en attente
                            </p>
                        </div>

                        <div className="text-right space-y-1 text-xs">
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                LAMY : <span className="font-bold text-slate-900 dark:text-white">208 601 €</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                BARBEY : <span className="font-bold text-slate-900 dark:text-white">41 689 €</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                FONCIA : <span className="font-bold text-slate-900 dark:text-white">74 207 €</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-slate-500">Taux de transformation : 68%</span>
                        <Link href="/dashboard/devis" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
                            Voir devis <ChevronRight size={13} />
                        </Link>
                    </div>
                </div>

            </div>

            {/* --- BOTTOM ROW BENTO GRID (3 Cards: Factures à encaisser, Planning, Ressources) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* BENTO CARD 4: Factures en attente (Style "Due Not Collected") */}
                <div className="bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            À Encaisser
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                            2 Factures
                        </span>
                    </div>

                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        44 380,61 €
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                        Échéances à 15 jours
                    </p>

                    <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/80">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">S1-D23010550 (Situation n°1)</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">FONCIA • Avancement réel métré</p>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">30 478,07 €</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/80">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">FAC-2026-002 (Acompte 30%)</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Cabinet BARBEY • Saint-Mandé</p>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">13 902,54 €</span>
                        </div>
                    </div>
                </div>

                {/* BENTO CARD 5: Planning de la semaine (Style "Lab Reports Today") */}
                <div className="bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Planning Semaine
                        </span>
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/50">
                            10 Interventions
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl">
                            10
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Alexandre V. & Équipes BTP</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Poissy, Saint-Mandé, Conflans</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Lavage HP Façade (Poissy)
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">En cours</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Relevé voirie AOT (Saint-Mandé)
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">En cours</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Métré acrotères (Conflans)
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Terminé</span>
                        </div>
                    </div>
                </div>

                {/* BENTO CARD 6: Logistique & Équipements (Style "Available Bed") */}
                <div className="bg-white/95 dark:bg-[#131B2A] backdrop-blur-md rounded-[28px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Moyens Mobilisés
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0E1524] px-2.5 py-0.5 rounded-full border border-transparent dark:border-slate-800">
                            3 Chantiers
                        </span>
                    </div>

                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        5 150 m²
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                        Échafaudages tubulaires classe 4 déployés
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/80">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Base-vie</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">3 Roulottes</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Raccordées 100%</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/80">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Filets sécurité</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">3 850 m²</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">APAVE validée</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- MAIN CONTENT GRID (Active Automations & Recent Activity) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">

                {/* Left Col: Active Automations */}
                <div className="lg:col-span-2">
                    <ActiveAutomations />
                </div>

                {/* Right Col: Recent Activity */}
                <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-[#131B2A] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] dark:shadow-none backdrop-blur-md h-fit">
                    <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white tracking-wider uppercase">
                        Activité Récente
                    </h2>

                    {activities.length > 0 ? (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <div
                                    key={`${activity.type}-${activity.id}`}
                                    className="flex items-center justify-between rounded-2xl bg-slate-50/80 dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/80 p-3.5 transition-all hover:bg-slate-100/80 dark:hover:bg-[#162032]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl p-2.5 ${activity.type === 'facture' ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'}`}>
                                            {activity.type === 'facture' ? <FileCheck size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {activity.type === 'facture' ? 'Encaissée' : 'Proposé'} {activity.reference}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                {activity.clientName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">{formatCurrency(activity.amount)}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{activity.date.toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1524] py-12">
                            <p className="text-xs text-slate-400 dark:text-slate-500">Aucune activité récente pour le moment.</p>
                        </div>
                    )}
                </div>

            </div>

        </div>
    )
}