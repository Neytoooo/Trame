import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAndSyncMobileDevis, getMobileDevis, MobileDevisItem } from '@/lib/mobileDevisStore'

// GET /api/mobile/devis - Récupère la liste de tous les devis récents (Supabase + Devis Mobile)
export async function GET() {
    try {
        let dbDevis: any[] = []
        try {
            const supabase = await createClient()
            const { data } = await supabase
                .from('devis')
                .select(`
                    id,
                    reference,
                    name,
                    status,
                    total_ht,
                    created_at,
                    chantiers (
                        id,
                        name,
                        clients ( id, name )
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(20)
            if (data) dbDevis = data
        } catch {
            // Fallback si Supabase hors-ligne
        }

        const localMobileDevis = getMobileDevis()

        // Formater Supabase
        const formattedDb = dbDevis.map((d: any) => ({
            id: d.id,
            reference: d.reference || d.id.slice(0, 8),
            name: d.name || 'Devis sans nom',
            status: d.status || 'brouillon',
            totalHT: d.total_ht || 0,
            chantierName: d.chantiers?.name || 'Chantier',
            clientName: d.chantiers?.clients?.name || 'Client',
            created_at: d.created_at,
            source: 'web'
        }))

        // Formater Mobile store
        const formattedMobile = localMobileDevis.map((d) => ({
            id: d.id,
            reference: d.reference,
            name: d.name,
            status: d.status,
            totalHT: d.total_ht,
            chantierName: d.chantiers?.name || 'Chantier',
            clientName: d.chantiers?.clients?.name || 'Client',
            created_at: d.created_at,
            source: 'mobile'
        }))

        // Fusion sans doublon par id ou référence
        const seenIds = new Set(formattedDb.map(d => d.id))
        const seenRefs = new Set(formattedDb.map(d => d.reference))
        const merged = [...formattedDb]

        for (const m of formattedMobile) {
            if (!seenIds.has(m.id) && !seenRefs.has(m.reference)) {
                merged.push(m)
            }
        }

        // Trier par date décroissante
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return NextResponse.json({
            success: true,
            devis: merged
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST /api/mobile/devis - Enregistre un devis extrait sur mobile et génère la notification sur le web
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            clientName,
            clientPhone,
            clientAddress,
            projectName,
            notes,
            items
        } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Le devis doit comporter au moins une prestation'
            }, { status: 400 })
        }

        const itemsToInsert: MobileDevisItem[] = items.map((item: any) => ({
            description: item.description || 'Prestation BTP',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'u',
            unit_price: Number(item.unit_price) || 0,
            tva: Number(item.tva) || 10
        }))

        const syncResult = await createAndSyncMobileDevis({
            clientName: clientName || 'Client Mobile',
            clientPhone,
            clientAddress,
            projectName: projectName || 'Chantier Mobile',
            notes,
            items: itemsToInsert
        })

        return NextResponse.json({
            success: true,
            message: 'Devis enregistré dans la base et notification envoyée sur KOTA Web !',
            devis: {
                id: syncResult.devis.id,
                reference: syncResult.devis.reference,
                projectName: syncResult.devis.name.replace(/^Devis\s+/, ''),
                clientName: syncResult.devis.chantiers?.clients?.name || 'Client',
                totalHT: syncResult.devis.total_ht,
                itemsCount: syncResult.devis.items.length,
                webEditUrl: `/dashboard/devis/${syncResult.devis.id}/edit`
            },
            notification: syncResult.notification
        })
    } catch (error: any) {
        console.error('Erreur POST /api/mobile/devis:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
