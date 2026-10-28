import { NextResponse } from 'next/server'
import { updateDepotPhoto, deleteDepotPhoto } from '@/lib/depotStore'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { devisReference, title, notes, category } = body

        const result = await updateDepotPhoto(id, {
            devisReference,
            title,
            notes,
            category
        })

        if (!result.success) {
            return NextResponse.json({ success: false, error: 'Photo non trouvée' }, { status: 404 })
        }

        return NextResponse.json({ success: true, photo: result.photo })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await deleteDepotPhoto(id)
        return NextResponse.json({ success: true, message: 'Photo supprimée du Dépôt' })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
