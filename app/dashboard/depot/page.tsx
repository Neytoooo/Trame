import { createClient } from '@/utils/supabase/server'
import { getDepotPhotos, getDepotStats } from '@/lib/depotStore'
import { getMobileDevis } from '@/lib/mobileDevisStore'
import DepotClient from '@/components/depot/DepotClient'

export const dynamic = 'force-dynamic'

export default async function DepotPage() {
    // 1. Récupération des photos et des statistiques du Dépôt
    const [photos, stats] = await Promise.all([
        getDepotPhotos(),
        getDepotStats()
    ])

    // 2. Récupérer les devis récents (Supabase + Devis Mobiles) pour suggestions de rattachement rapide
    let recentDevis: Array<{ id: string; reference: string; name: string; clientName?: string }> = []

    try {
        const supabase = await createClient()
        const { data: dbDevis } = await supabase
            .from('devis')
            .select(`
                id,
                reference,
                name,
                chantiers (
                    clients ( name )
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10)

        if (dbDevis) {
            recentDevis = dbDevis.map((d: any) => ({
                id: d.id,
                reference: d.reference || d.id.slice(0, 8),
                name: d.name,
                clientName: d.chantiers?.clients?.name || ''
            }))
        }
    } catch {
        // Fallback
    }

    // Fusionner avec les devis créés via le mobile
    const mobileDevis = getMobileDevis()
    const seenRefs = new Set(recentDevis.map(d => d.reference))

    for (const m of mobileDevis) {
        if (!seenRefs.has(m.reference)) {
            recentDevis.unshift({
                id: m.id,
                reference: m.reference,
                name: m.name,
                clientName: m.chantiers?.clients?.name || ''
            })
        }
    }

    return (
        <DepotClient
            initialPhotos={photos}
            initialStats={stats}
            recentDevis={recentDevis.slice(0, 15)}
        />
    )
}
