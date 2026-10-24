import { createClient, getCachedUser } from '@/utils/supabase/server'
import { INITIAL_TEAM_MEMBERS, computeCompanyTotals, TeamMember } from '@/lib/teamData'
import TeamPerformanceClient from '@/components/equipe/TeamPerformanceClient'
import { formatProfileName } from '@/types/users'

export default async function EquipePage() {
    const supabase = await createClient()
    const user = await getCachedUser()

    // 1. Fetch real database entities in parallel
    const [facturesRes, devisRes, chantiersRes, clientsRes] = await Promise.all([
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
            .order('created_at', { ascending: false })
    ])

    const allFactures = facturesRes.data || []
    const allDevis = devisRes.data || []
    const allChantiers = chantiersRes.data || []
    const allClients = clientsRes.data || []

    // 2. Real user live metrics
    const userPaidFactures = allFactures.filter(f => f.status === 'payee')
    const dbPaidCa = userPaidFactures.reduce((acc, f) => acc + (f.total_ht || 0), 0)

    const userPendingDevis = allDevis.filter(d => d.status === 'en_attente' || d.status === 'en_attente_approbation')
    const dbPendingDevis = userPendingDevis.reduce((acc, d) => acc + (d.total_ht || 0), 0)

    // User identity - Dynamique et adaptée au compte connecté réel
    const profile = formatProfileName(user?.email || '', user?.user_metadata)
    const firstName = profile.firstName
    const lastName = profile.lastName
    const userInitials = `${firstName[0] || 'U'}${lastName[0] || ''}`.toUpperCase()
    const userEmail = user?.email || 'collaborateur@kota.fr'

    // 3. Enrich primary team member with live DB stats or realistic baseline
    const enrichedMembers: TeamMember[] = INITIAL_TEAM_MEMBERS.map((member, index) => {
        if (index === 0) {
            // Primary logged-in user profile
            const caEncaisse = dbPaidCa > 0 ? dbPaidCa : member.caEncaisse
            const devisEnAttente = dbPendingDevis > 0 ? dbPendingDevis : member.devisEnAttente
            const nbDevis = allDevis.length > 0 ? allDevis.length : member.nbDevis
            const nbFactures = allFactures.length > 0 ? allFactures.length : member.nbFactures
            const nbChantiers = allChantiers.length > 0 ? allChantiers.length : member.nbChantiers
            const nbClients = allClients.length > 0 ? allClients.length : member.nbClients

            const conversion = nbDevis > 0 ? Math.round((nbFactures / nbDevis) * 100) : member.tauxConversion
            const panier = nbFactures > 0 ? Math.round(caEncaisse / nbFactures) : member.panierMoyen

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

            return {
                ...member,
                prenom: firstName,
                nom: lastName || member.nom,
                initials: userInitials,
                email: userEmail,
                caEncaisse,
                devisEnAttente,
                nbDevis,
                nbFactures,
                nbChantiers,
                nbClients,
                tauxConversion: conversion,
                panierMoyen: panier,
                chantiersList: liveChantiers.length > 0 ? liveChantiers : member.chantiersList,
                clientsList: liveClients.length > 0 ? liveClients : member.clientsList,
                derniersDevis: liveDevis.length > 0 ? liveDevis : member.derniersDevis,
                dernieresFactures: liveFactures.length > 0 ? liveFactures : member.dernieresFactures
            }
        }
        return member
    })

    // 4. Calculate total consolidated company metrics
    const initialTotals = computeCompanyTotals(enrichedMembers)

    return (
        <TeamPerformanceClient
            initialMembers={enrichedMembers}
            initialTotals={initialTotals}
        />
    )
}
