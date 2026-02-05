import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const templates = [
        {
            name: "🛠️ Dépannage Express",
            description: "Scénario court pour les petites interventions rapides.",
            nodes: [
                { id: '1', type: 'step', action_type: 'play', label: 'Lancement', status: 'pending', position_x: 50, position_y: 100 },
                { id: '2', type: 'step', action_type: 'quote', label: 'Devis Rapide', status: 'pending', position_x: 250, position_y: 100 },
                { id: '3', type: 'step', action_type: 'setup', label: 'Intervention', status: 'pending', position_x: 450, position_y: 100 },
                { id: '4', type: 'step', action_type: 'invoice', label: 'Facturation', status: 'pending', position_x: 650, position_y: 100 },
            ],
            edges: [
                { id: 'e1', source: '1', target: '2' },
                { id: 'e2', source: '2', target: '3' },
                { id: 'e3', source: '3', target: '4' },
            ]
        },
        {
            name: "🏠 Rénovation Standard",
            description: "Flux classique : Visite, Devis, Acompte, Travaux, Réception.",
            nodes: [
                { id: '1', type: 'step', action_type: 'play', label: 'Lancement', status: 'pending', position_x: 50, position_y: 200 },
                { id: '2', type: 'step', action_type: 'site_visit', label: 'Visite Technique', status: 'pending', position_x: 250, position_y: 100 },
                { id: '3', type: 'step', action_type: 'quote', label: 'Devis & Signature', status: 'pending', position_x: 450, position_y: 100 },
                { id: '4', type: 'step', action_type: 'material_order', label: 'Commande Matériaux', status: 'pending', position_x: 450, position_y: 300 },
                { id: '5', type: 'step', action_type: 'invoice', label: 'Facture Acompte', status: 'pending', position_x: 650, position_y: 100 },
                { id: '6', type: 'step', action_type: 'setup', label: 'Travaux', status: 'pending', position_x: 850, position_y: 200 },
                { id: '7', type: 'step', action_type: 'cleaning', label: 'Nettoyage', status: 'pending', position_x: 1050, position_y: 200 },
                { id: '8', type: 'step', action_type: 'reception_report', label: 'PV de Réception', status: 'pending', position_x: 1250, position_y: 200 },
                { id: '9', type: 'step', action_type: 'invoice', label: 'Facture Solde', status: 'pending', position_x: 1450, position_y: 200 },
            ],
            edges: [
                { id: 'e1', source: '1', target: '2' },
                { id: 'e2', source: '2', target: '3' },
                { id: 'e3', source: '3', target: '5' },
                { id: 'e4', source: '3', target: '4' }, // Parallel materials
                { id: 'e5', source: '5', target: '6' },
                { id: 'e6', source: '4', target: '6' },
                { id: 'e7', source: '6', target: '7' },
                { id: 'e8', source: '7', target: '8' },
                { id: 'e9', source: '8', target: '9' },
            ]
        },
        {
            name: "🏗️ Construction Neuve",
            description: "Gros projet avec phases administratives et multiples lots.",
            nodes: [
                { id: '1', type: 'step', action_type: 'play', label: 'Lancement', status: 'pending', position_x: 50, position_y: 250 },
                { id: '2', type: 'step', action_type: 'client_choice', label: 'Etude & Plans', status: 'pending', position_x: 250, position_y: 250 },
                { id: '3', type: 'step', action_type: 'email', label: 'Dépôt Permis', status: 'pending', position_x: 450, position_y: 250 },
                { id: '4', type: 'step', action_type: 'calendar', label: 'Planning Gros Oeuvre', status: 'pending', position_x: 650, position_y: 150 },
                { id: '5', type: 'step', action_type: 'calendar', label: 'Planning Second Oeuvre', status: 'pending', position_x: 650, position_y: 350 },
                { id: '6', type: 'step', action_type: 'setup', label: 'Fondations & Murs', status: 'pending', position_x: 850, position_y: 150 },
                { id: '7', type: 'step', action_type: 'setup', label: 'Plomberie/Elec/Iso', status: 'pending', position_x: 850, position_y: 350 },
                { id: '8', type: 'step', action_type: 'site_visit', label: 'Visite Cloisons', status: 'pending', position_x: 1050, position_y: 250 },
                { id: '9', type: 'step', action_type: 'photo_report', label: 'Suivi Photo', status: 'pending', position_x: 1250, position_y: 250 },
                { id: '10', type: 'step', action_type: 'reception_report', label: 'Livraison', status: 'pending', position_x: 1450, position_y: 250 },
            ],
            edges: [
                { id: 'e1', source: '1', target: '2' },
                { id: 'e2', source: '2', target: '3' },
                { id: 'e3', source: '3', target: '4' },
                { id: 'e4', source: '3', target: '5' },
                { id: 'e5', source: '4', target: '6' },
                { id: 'e6', source: '5', target: '7' },
                { id: 'e7', source: '6', target: '8' },
                { id: 'e8', source: '7', target: '8' },
                { id: 'e9', source: '8', target: '9' },
                { id: 'e10', source: '9', target: '10' },
            ]
        }
    ]

    const results = []

    for (const t of templates) {
        const { error } = await supabase.from('chantier_templates').insert({
            name: t.name,
            description: t.description,
            nodes: t.nodes,
            edges: t.edges,
            is_public: true
        })
        if (error) results.push({ name: t.name, status: 'error', error })
        else results.push({ name: t.name, status: 'success' })
    }

    return NextResponse.json({ results })
}
