import { createClient } from '@/utils/supabase/server'
import { ArrowUpRight, Plus, Wallet, Users, Hammer } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    // On récupère juste le prénom pour l'accueil (si dispo), sinon l'email
    const { data: { user } } = await supabase.auth.getUser()
    const displayName = user?.user_metadata?.first_name || "Chef"

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
                    value="0,00 €"
                    trend="+12% ce mois"
                    icon={<Wallet className="text-blue-400" />}
                    color="blue"
                />
                <StatCard
                    title="Devis en attente"
                    value="3"
                    trend="À relancer"
                    icon={<Users className="text-purple-400" />}
                    color="purple"
                />
                <StatCard
                    title="Chantiers en cours"
                    value="1"
                    trend="Livraison J-10"
                    icon={<Hammer className="text-emerald-400" />}
                    color="emerald"
                />
            </div>

            {/* Section "Activité Récente" - Un grand panneau Bento */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="mb-4 text-lg font-semibold text-white">Activité récente</h2>

                {/* Placeholder vide pour l'instant */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 py-12">
                    <div className="rounded-full bg-white/5 p-3 mb-3">
                        <Plus className="text-gray-500" />
                    </div>
                    <p className="text-gray-400">Aucune activité récente pour le moment.</p>
                </div>
            </div>
        </div>
    )
}

// Composant Carte Statistique réutilisable
function StatCard({ title, value, trend, icon, color }: any) {
    // Mapping des couleurs pour les bordures/glows
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
                </div>
                <div className="rounded-xl bg-white/10 p-2 shadow-inner">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-medium text-green-400">
                    <ArrowUpRight size={14} />
                    {trend}
                </span>
                <span className="text-gray-500">vs mois dernier</span>
            </div>
        </div>
    )
}