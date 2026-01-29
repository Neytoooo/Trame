import { createClient } from '@/utils/supabase/server'
import { Plus, Search, User, Mail, Phone, MapPin, Building2, MoreVertical } from 'lucide-react'

// On sépare la partie client (Modal + State) dans un composant "ClientPageClient" pour garder la page serveur
import ClientPageClient from './ClientPageClient'

export default async function ClientsPage() {
    const supabase = await createClient()

    // 1. Récupérer les clients
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Clients</h1>
                    <p className="text-gray-400">Gérez votre base de contacts</p>
                </div>
            </div>

            {/* On passe les clients au composant client qui gérera l'affichage et le modal */}
            <ClientPageClient initialClients={clients || []} />
        </div>
    )
}
