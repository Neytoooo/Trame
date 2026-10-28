import { NextResponse } from 'next/server'
import { getDepotPhotos, getDepotStats, addDepotPhoto } from '@/lib/depotStore'
import { DepotPhotoCategory } from '@/types/depot'

// GET /api/mobile/depot - Récupère les photos du Dépôt avec filtres optionnels
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const devisReference = searchParams.get('devis') || searchParams.get('devis_reference') || undefined
        const category = searchParams.get('category') || undefined
        const search = searchParams.get('search') || undefined

        const [photos, stats] = await Promise.all([
            getDepotPhotos({ devis_reference: devisReference, category, search }),
            getDepotStats()
        ])

        return NextResponse.json({
            success: true,
            photos,
            stats
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST /api/mobile/depot - Enregistre une photo envoyée depuis le smartphone ou le web
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            imageBase64,
            imageUrl,
            devisReference,
            title,
            category = 'constat',
            notes = '',
            clientName,
            chantierName,
            deviceInfo = 'Samsung S25+ (KOTA Mobile)'
        } = body

        // Préparer l'URL ou le format base64
        let finalImageUrl = imageUrl
        if (!finalImageUrl && imageBase64) {
            finalImageUrl = imageBase64.startsWith('data:') 
                ? imageBase64 
                : `data:image/jpeg;base64,${imageBase64}`
        }

        if (!finalImageUrl) {
            return NextResponse.json({
                success: false,
                error: 'Aucune image fournie'
            }, { status: 400 })
        }

        const res = await addDepotPhoto({
            imageUrl: finalImageUrl,
            title,
            devisReference,
            category: category as DepotPhotoCategory,
            notes,
            clientName,
            chantierName,
            deviceInfo
        })

        if (!res.success) {
            return NextResponse.json({ success: false, error: res.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Photo sauvegardée avec succès dans le Dépôt KOTA !',
            photo: res.photo
        })
    } catch (error: any) {
        console.error('Erreur POST /api/mobile/depot:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
