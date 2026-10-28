import { NextResponse } from 'next/server'
import { createDevisPhotoCopy } from '@/lib/devisImageStore'

export const dynamic = 'force-dynamic'

/**
 * POST /api/devis/copy-photo
 * Crée une copie physique indépendante d'une photo du Dépôt pour le devis.
 * Garantit que la suppression de la photo dans le Dépôt n'impacte pas le devis.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { imageUrl, devisId } = body

        if (!imageUrl) {
            return NextResponse.json({ success: false, error: 'imageUrl requise' }, { status: 400 })
        }

        const devisCopyUrl = await createDevisPhotoCopy(imageUrl, devisId || 'devis')

        return NextResponse.json({
            success: true,
            imageUrl: devisCopyUrl
        })
    } catch (e: any) {
        console.error('Erreur POST /api/devis/copy-photo:', e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
