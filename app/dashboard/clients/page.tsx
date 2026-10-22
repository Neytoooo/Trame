import { createClient } from '@/utils/supabase/server'
import { Plus, Search, User, Mail, Phone, MapPin, Building2, MoreVertical } from 'lucide-react'

// On sépare la partie client (Modal + State) dans un composant "ClientPageClient" pour garder la page serveur
import ClientPageClient from './ClientPageClient'

export default async function ClientsPage() {
    const supabase = await createClient()

    // 1. Récupérer les clients (limite 10)
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header (Always Fixed) */}
            <div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Clients</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez votre base de contacts et maîtres d'ouvrage.</p>
                </div>
            </div>

            {/* On passe les clients au composant client qui gérera l'affichage et le modal */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <ClientPageClient initialClients={clients || []} />
            </div>
        </div>
    )
}
