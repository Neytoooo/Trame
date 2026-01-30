import { createClient } from '@/utils/supabase/server'
import { ArrowUpRight, Plus, Wallet, Users, Hammer, FileText, FileCheck } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. User Info
    const { data: { user } } = await supabase.auth.getUser()
    const displayName = user?.user_metadata?.first_name || "Chef"

    // 2. Date Ranges for Revenue (Current Month vs Last Month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    // Previous Month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    // 3. Parallel Data Fetching
    const [
        currentMonthRevenue,
        lastMonthRevenue,
        pendingQuotes,
        ongoingProjects,
        recentDevis,
        recentFactures
    ] = await Promise.all([
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
        }).format(amount)
    }

    // Revenue
    const revenueCurrent = currentMonthRevenue.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 0
    const revenueLast = lastMonthRevenue.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 0

    let trendPercent = 0
    if (revenueLast > 0) {
        trendPercent = ((revenueCurrent - revenueLast) / revenueLast) * 100
    } else if (revenueCurrent > 0) {
        trendPercent = 100 // 0 to something is 100% growth effectively
    }
    const trendLabel = revenueLast === 0 && revenueCurrent === 0 ? "Pas de données" : `${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(0)}%`

    // Pending Quotes
    const pendingQuotesCount = pendingQuotes.count || 0
    const pendingQuotesAmount = pendingQuotes.data?.reduce((acc, curr) => acc + (curr.total_ht || 0), 0) || 0

    // Ongoing Projects
    const ongoingProjectsCount = ongoingProjects.count || 0

    // Recent Activity Feed
    // Standardize structure: { type: 'devis'|'facture', date: Date, reference, clientName, amount, id }
    const activities = [
        ...(recentDevis.data?.map(d => ({
            type: 'devis',
            id: d.id,
            reference: d.reference || 'Sans ref',
            clientName: (d.client as any)?.name || 'Client inconnu',
            amount: d.total_ht,
            date: new Date(d.created_at),
        })) || []),
        ...(recentFactures.data?.map(f => ({
            type: 'facture',
            id: f.id,
            reference: f.reference || 'Sans ref',
            clientName: (f.client as any)?.name || 'Client inconnu',
            amount: f.total_ht,
            date: new Date(f.created_at),
        })) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)

    return (
        <div className="space-y-8">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bonjour, {displayName} 👋</h1>
                    <p className="mt-1 text-gray-400">Voici ce qui se passe sur vos chantiers aujourd'hui.</p>
                </div>
            </div>

            {/* Grille des Stats (Style Glass) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard
                    title="Chiffre d'Affaires"
                    value={formatCurrency(revenueCurrent)}
                    trend={`${trendLabel} ce mois`}
                    icon={<Wallet className="text-blue-400" />}
                    color="blue"
                />
                <StatCard
                    title="Devis en attente"
                    value={pendingQuotesCount.toString()}
                    details={formatCurrency(pendingQuotesAmount)}
                    trend="Potentiel"
                    icon={<Users className="text-purple-400" />}
                    color="purple"
                />
                <StatCard
                    title="Chantiers en cours"
                    value={ongoingProjectsCount.toString()}
                    trend="En production"
                    icon={<Hammer className="text-emerald-400" />}
                    color="emerald"
                />
            </div>

            {/* Section "Activité Récente" */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="mb-4 text-lg font-semibold text-white">Activité récente</h2>

                {activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                                <div className="flex items-center gap-4">
                                    <div className={`rounded-full p-2 ${activity.type === 'facture' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {activity.type === 'facture' ? <FileCheck size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            {activity.type === 'facture' ? 'Encaissée' : 'Proposé'} {activity.reference}
                                        </p>
                                        <p className="text-sm text-gray-400">{activity.clientName} • {activity.date.toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-medium text-white">{formatCurrency(activity.amount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 py-12">
                        <div className="rounded-full bg-white/5 p-3 mb-3">
                            <Plus className="text-gray-500" />
                        </div>
                        <p className="text-gray-400">Aucune activité récente pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Composant Carte Statistique réutilisable
function StatCard({ title, value, details, trend, icon, color }: any) {
    const colors: any = {
        blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
        purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
        emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    }

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-md transition-all hover:border-opacity-50 ${colors[color] || colors.blue}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>
                    {details && <p className="text-sm text-gray-400 mt-1">{details}</p>}
                </div>
                <div className="rounded-xl bg-white/10 p-2 shadow-inner">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
                <span className={`flex items-center gap-1 font-medium ${color === 'blue' ? 'text-blue-400' : color === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`}>
                    <ArrowUpRight size={14} />
                    {trend}
                </span>
            </div>
        </div>
    )
}