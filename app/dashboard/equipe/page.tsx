import { createClient, getCachedUser } from '@/utils/supabase/server'
import { computeCompanyTotals, buildEnrichedTeamMembers } from '@/lib/teamData'
import TeamPerformanceClient from '@/components/equipe/TeamPerformanceClient'
import { getStoredUsers } from '@/lib/authorizedUsersStore'
import type { AuthorizedUser } from '@/types/users'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
    const supabase = await createClient()
    const user = await getCachedUser()

    // 1. Fetch real database entities and authorized users in parallel
    const [facturesRes, devisRes, chantiersRes, clientsRes, usersRes] = await Promise.all([
        supabase
            .from('factures')
            .select('id, reference, total_ht, status, created_at, client:clients(name)')
            .order('created_at', { ascending: false }),
        supabase
            .from('devis')
            .select('id, reference, total_ht, status, created_at, client:clients(name)')
            .order('created_at', { ascending: false }),
        supabase
            .from('chantiers')
            .select('id, name, status')
            .order('created_at', { ascending: false }),
        supabase
            .from('clients')
            .select('id, name, city')
            .order('created_at', { ascending: false }),
        supabase
            .from('authorized_users')
            .select('*')
            .order('created_at', { ascending: true })
    ])

    const allFactures = facturesRes.data || []
    const allDevis = devisRes.data || []
    const allChantiers = chantiersRes.data || []
    const allClients = clientsRes.data || []

    // Récupération dynamique de la liste des collaborateurs autorisés (Supabase ou Store local)
    let authorizedUsers: AuthorizedUser[] = []
    if (!usersRes.error && usersRes.data && usersRes.data.length > 0) {
        authorizedUsers = usersRes.data as AuthorizedUser[]
    } else {
        authorizedUsers = getStoredUsers()
    }

    // 2. Real user live metrics
    const userPaidFactures = allFactures.filter(f => f.status === 'payee')
    const dbPaidCa = userPaidFactures.reduce((acc, f) => acc + (f.total_ht || 0), 0)

    const userPendingDevis = allDevis.filter(d => d.status === 'en_attente' || d.status === 'en_attente_approbation')
    const dbPendingDevis = userPendingDevis.reduce((acc, d) => acc + (d.total_ht || 0), 0)

    // Recent DB chantiers
    const liveChantiers = allChantiers.slice(0, 3).map(ch => ({
        id: ch.id,
        nom: ch.name || 'Chantier BTP',
        ville: 'Île-de-France',
        statut: ch.status || 'en_cours',
        montant: 45000
    }))

    // Recent DB clients
    const liveClients = allClients.slice(0, 3).map(cl => ({
        id: cl.id,
        nom: cl.name || 'Client BTP',
        ville: cl.city || 'Paris'
    }))

    // Recent DB devis & factures
    const liveDevis = allDevis.slice(0, 2).map(d => ({
        ref: d.reference || 'DEV-2026',
        client: (d.client as any)?.name || 'Client',
        montant: d.total_ht || 0,
        statut: d.status || 'en_attente'
    }))

    const liveFactures = allFactures.slice(0, 2).map(f => ({
        ref: f.reference || 'FAC-2026',
        client: (f.client as any)?.name || 'Client',
        montant: f.total_ht || 0,
        statut: f.status || 'payee'
    }))

    // 3. Enrichir l'ensemble des collaborateurs en Reactive State
    const enrichedMembers = buildEnrichedTeamMembers(
        authorizedUsers,
        user?.email || '',
        {
            caEncaisse: dbPaidCa,
            devisEnAttente: dbPendingDevis,
            nbDevis: allDevis.length,
            nbFactures: allFactures.length,
            nbChantiers: allChantiers.length,
            nbClients: allClients.length,
            liveChantiers,
            liveClients,
            liveDevis,
            liveFactures
        }
    )

    // 4. Calcul des métriques globales consolidées
    const initialTotals = computeCompanyTotals(enrichedMembers)

    return (
        <TeamPerformanceClient
            initialMembers={enrichedMembers}
            initialTotals={initialTotals}
        />
    )
}
