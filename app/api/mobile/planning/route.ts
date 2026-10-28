import { NextResponse } from 'next/server'
import {
    getPlanningDataAction,
    createPlanningInterventionAction,
    updatePlanningInterventionStatusAction,
    deletePlanningInterventionAction
} from '@/app/actions/planning'
import { revalidatePath } from 'next/cache'

// GET /api/mobile/planning - Récupère les interventions du planning KOTA Web
export async function GET() {
    try {
        const data = await getPlanningDataAction()

        return NextResponse.json({
            success: true,
            interventions: data.interventions,
            chantiers: data.chantiers,
            teamMembers: data.teamMembers
        })
    } catch (error: any) {
        console.error('Erreur GET /api/mobile/planning:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST /api/mobile/planning - Crée une nouvelle intervention depuis le mobile et synchronise KOTA Web
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            title,
            chantierName,
            clientName,
            address,
            technicien,
            zone,
            date,
            startTime,
            endTime,
            color,
            notes,
            chantier_id,
            client_id,
            user_id
        } = body

        if (!title || !date || !startTime || !endTime) {
            return NextResponse.json({
                success: false,
                error: 'Champs obligatoires manquants (titre, date, horaires)'
            }, { status: 400 })
        }

        const res = await createPlanningInterventionAction({
            title: title.trim(),
            chantierName: chantierName?.trim() || 'Chantier Mobile',
            clientName: clientName?.trim() || 'Client',
            address: address?.trim() || '',
            technicien: technicien?.trim() || 'Technicien Mobile',
            zone: zone?.trim() || 'Île-de-France',
            date,
            startTime,
            endTime,
            color: color || 'rose',
            notes: notes?.trim() || '',
            chantier_id: chantier_id || null,
            client_id: client_id || null,
            user_id: user_id || null
        })

        if (!res.success) {
            return NextResponse.json({ success: false, error: res.error || 'Erreur création' }, { status: 500 })
        }

        revalidatePath('/dashboard/planning')

        return NextResponse.json({
            success: true,
            intervention: res.intervention
        })
    } catch (error: any) {
        console.error('Erreur POST /api/mobile/planning:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PATCH /api/mobile/planning - Met à jour le statut d'une intervention depuis le mobile
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({
                success: false,
                error: 'Identifiant et statut requis'
            }, { status: 400 })
        }

        const res = await updatePlanningInterventionStatusAction(id, status)
        if (!res.success) {
            return NextResponse.json({
                success: false,
                error: res.error || 'Erreur mise à jour statut'
            }, { status: 500 })
        }

        revalidatePath('/dashboard/planning')

        return NextResponse.json({
            success: true,
            message: `Statut mis à jour : ${status}`
        })
    } catch (error: any) {
        console.error('Erreur PATCH /api/mobile/planning:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// DELETE /api/mobile/planning - Supprime une intervention
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 })
        }

        const res = await deletePlanningInterventionAction(id)
        revalidatePath('/dashboard/planning')

        return NextResponse.json({ success: res.success })
    } catch (error: any) {
        console.error('Erreur DELETE /api/mobile/planning:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
